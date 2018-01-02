function PageMain() {

    var _interval;


    function start() {
        //console.log('starting main page');

        chrome.runtime.onMessage.addListener(messageListner);

        checkImages();
        _interval = setInterval(checkImages, 500);
    }

    function stop() {
        //console.log('stopping main page');

        chrome.runtime.onMessage.removeListener(messageListner);

        if (_interval)
            clearInterval(_interval);
        _interval = null;
    }

    function messageListner(msg, _, sendResponse) {
        //alert("Got message from background page: " + JSON.stringify(msg));

        switch (msg.type) {
            case 'element-hash': {
                $('#' + MAIN_IMAGE_PREFIX + msg.id).attr('hash', msg.hash);
                break;
            }

            case 'element-in-album': {
                $('#' + MAIN_IMAGE_PREFIX + msg.id).addClass('cached');
                hideMainImage(msg.id);
                break;
            }
        }
    }

    function checkImages() {
        var imageElements = $('.RY3tic:visible:not([id])');
        //console.log('checking main ' + imageElements.length);
        if (imageElements.length === 0)
            return;

        //console.log('found ' + imageElements.length);

        imageElements.each(function () {
            var ret;
            if (ret = assignId(this, MAIN_IMAGE_PREFIX))
                chrome.runtime.sendMessage({type: 'check-main-element', id: ret.id, url: ret.url});
        });
    }

    return {
        start: start,
        stop: stop,
        foo: {}
    }
}