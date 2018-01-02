$.fn.scrollBottom = function () {
    return $(document).height() - this.scrollTop() - this.height();
};

//alert("content ready");
var _page;

chrome.runtime.onMessage.addListener(function (msg, _, sendResponse) {
    //console.log('bg message: ' + JSON.stringify(msg));

    switch (msg.type) {

        case 'page-changed': {
            if (_page)
                _page.stop();
            _page = null;
            break;
        }

        case 'start-main-page': {
            _page = PageMain();
            _page.start();
            break;
        }

        case 'start-album-page': {
            _page = PageAlbum();
            _page.start();
            break;
        }

    }
});


//chrome.runtime.sendMessage({type: "start-watching"});

