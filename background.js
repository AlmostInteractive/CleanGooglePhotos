var SIZE = 20;
var CERTAINTY = 4;

var _active = false;
var _albumImageHashList = [];
var _albumIdToHash = {};
var _mainIdToHash = {};
var _tabs = [];

// load saved data
//clearData(); //todo: remove this
loadData();


function loadData() {
    chrome.storage.local.get('imageHashes', function (data) {
        if (!chrome.runtime.error) {
            _albumImageHashList = data['imageHashes'] || [];
        } else {
            alert("Error loading data");
        }
    });
    chrome.storage.local.get('active', function(data) {
        if (!chrome.runtime.error) {
            activate(data.hasOwnProperty('active') ? data['active'] : true);
        } else {
            alert("Error loading data");
        }
    });
    console.log('data loaded');
}

function saveData() {
    chrome.storage.local.set({'imageHashes': _albumImageHashList}, function () {
        if (chrome.runtime.error) {
            console.log("Runtime error saving data");
        }
    });
    //console.log('data saved');
}

function clearData() {
    chrome.storage.local.set({'imageHashes': null}, function () {
        if (chrome.runtime.error) {
            console.log("Runtime error saving data");
        }
    });
    console.log('data cleared');
}

function onUrlChange(tabId, changeInfo, tab) {
    if (changeInfo.status !== 'complete')
        return;

/*    if (!/^https:\/\/photos\.google\.com/.test(tab.url)) {
        console.log('left google photos');
        chrome.runtime.onMessage.removeListener(onUrlChange);
        return;
    }*/

    tabChanged(tab);
}

function tabChanged(tab) {
    var match = tab.url.match(/album\/([a-zA-Z0-9-]+)(\/photo)?/);
    var isMainPage = !(/album/.test(tab.url)) && !(/assistant/.test(tab.url)) && !(/sharing/.test(tab.url));
    var isAlbumPage = !isMainPage && match && (match.length >= 3) && (match[2] == null);

    chrome.tabs.sendMessage(tab.id, {'type': 'page-changed'});

    if (isMainPage)
        chrome.tabs.sendMessage(tab.id, {'type': 'start-main-page'});
    else if (isAlbumPage)
        chrome.tabs.sendMessage(tab.id, {'type': 'start-album-page'});
}

function getImageHash(id, url, callback) {
    blockhash(url + '=w' + SIZE, 8, 1, function (err, hash) {
        //console.log(id + ' is ' + hash);
        callback(id, url, hash);
    });
}

function activate(enable) {
    _active = enable;

    if (enable) {
        chrome.browserAction.setIcon({path: "icons/32-on.png"});
        chrome.tabs.onUpdated.addListener(onUrlChange);
        return;
    }

    //deactivate
    chrome.browserAction.setIcon({path: "icons/32-off.png"});
    chrome.tabs.onUpdated.removeListener(onUrlChange);
}


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        switch (request.type) {

            /*case 'start-watching': {
                console.log('start-watching');
                //chrome.tabs.onUpdated.addListener(onUrlChange);
                break;
            }*/

            case 'check-album-element': {
                var albumId = request.id;
                var albumUrl = request.url;

                // do we already have this cached?
                if (_albumIdToHash.hasOwnProperty(albumId)) {
                    recordCached(albumId);
                    return;
                }

                getImageHash(albumId, albumUrl, function (id, url, hash) {
                    _albumIdToHash[id] = hash;
                    _albumImageHashList.push(hash);

                    recordCached(id);
                });

                function recordCached(id) {
                    chrome.tabs.sendMessage(sender.tab.id, {
                        'type': 'album-element-cached',
                        'id': id,
                        'hash': _albumIdToHash[id]
                    });
                }

                break;
            }

            case 'check-main-element': {
                var mainId = request.id;
                var mainUrl = request.url;

                if (!_mainIdToHash.hasOwnProperty(mainId)) {
                    getImageHash(mainId, mainUrl, function (id, url, hash) {
                        _mainIdToHash[id] = hash;
                        saveData();
                        recordInAlbum(id);
                    });
                    return;
                }

                recordInAlbum(mainId);

                function recordInAlbum(id) {
                    var hash = _mainIdToHash[id];
                    chrome.tabs.sendMessage(sender.tab.id, {'type': 'element-hash', 'id': id, 'hash': hash});

                    // check for direct match
                    if (_albumImageHashList.indexOf(hash) !== -1) {
                        chrome.tabs.sendMessage(sender.tab.id, {'type': 'element-in-album', 'id': id});
                    } else {
                        for (var i = 0; i < _albumImageHashList.length; i++) {
                            if (hammingDistance(hash, _albumImageHashList[i]) <= CERTAINTY) {
                                chrome.tabs.sendMessage(sender.tab.id, {
                                    'type': 'element-hash',
                                    'id': id,
                                    'hash': _albumImageHashList[i]
                                });
                                chrome.tabs.sendMessage(sender.tab.id, {'type': 'element-in-album', 'id': id});
                                return;
                            }
                        }
                    }
                }

                break;
            }

            case 'save': {
                saveData();
                break;
            }

            default:
                alert('Unknown message:' + request.type);
        }
    }
);

chrome.browserAction.onClicked.addListener(function(tab) {
    activate(!_active);
});
