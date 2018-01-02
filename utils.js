var MAIN_IMAGE_PREFIX = 'main-';
var ALBUM_IMAGE_PREFIX = 'album-';

function assignId(elem, prefix) {
    var url = $(elem).css('background-image');
    if (!url)
        return null;

    url = url.split(',')[0].replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/=.*/, '');
    if (url == 'none')
        return null;

    var id =MD5(url);
    $(elem).attr('id',  prefix + id);
    return {id: id, url: url};
}

function hideMainImage(id) {
    $('#' + MAIN_IMAGE_PREFIX + id).closest('.rtIMgb').addClass('inAlbum');
}