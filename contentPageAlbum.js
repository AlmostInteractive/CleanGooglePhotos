function PageAlbum() {

    var _requested = 0;
    var _cached;
    var _timeout;


    function start() {
        console.log('starting album page');

        chrome.runtime.onMessage.addListener(messageListner);

        checkImages();
    }

    function stop() {
        console.log('stopping album page');

        chrome.runtime.onMessage.removeListener(messageListner);

        if (_timeout)
            clearTimeout(_timeout);
        _timeout = null;
    }

    function messageListner(msg, _, sendResponse) {
        //alert("Got message from background page: " + JSON.stringify(msg));

        switch (msg.type) {
            case 'album-element-cached': {
                incCached();

                $('#' + ALBUM_IMAGE_PREFIX + msg.id).addClass('cached').attr('hash', msg.hash);
                hideMainImage(msg.id);

                break;
            }
        }
    }

    function checkImages() {
        var imageElements = $('.RY3tic:visible:not([id])');
        //console.log('checking album ' + imageElements.length);
        if (imageElements.length === 0) {
            _timeout = setTimeout(checkImages, 500);
            return;
        }

        _requested = imageElements.length;
        _cached = 0;

        imageElements.addClass('uncached');

        imageElements.each(function () {
            var ret;
            if (ret = assignId(this, ALBUM_IMAGE_PREFIX))
                chrome.runtime.sendMessage({type: 'check-album-element', id: ret.id, url: ret.url});
            else
                incCached();
        });
    }

    function incCached() {
        if (++_cached == _requested) {
            chrome.runtime.sendMessage({type: 'save'});
            _timeout = setTimeout(checkImages, 500);
        }
        console.log(_cached + ' of ' + _requested);
    }

    return {
        start: start,
        stop: stop
    }
}