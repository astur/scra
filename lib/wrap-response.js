const iconv = require('iconv-lite');
const zlib = require('zlib');

module.exports = (conf, res) => {
    const unzip = ({
        'x-deflate': zlib.inflateSync,
        'deflate': zlib.inflateSync,
        'x-gzip': zlib.gunzipSync,
        'gzip': zlib.gunzipSync,
    })[res.headers['content-encoding']];
    if(unzip){
        res.rawBody = unzip(res.rawBody);
    }
    const [contentType, charset] = (res.headers['content-type'] || '').split(';');
    res.charset = /charset=(.+)$/.test(charset) ? 
        charset.match(/charset=(.+)$/)[1] :
        contentType === 'text/html' ? 'iso-8859-1' : 'utf-8';
    res.body = iconv.encodingExists(res.charset) ?
        iconv.decode(res.rawBody, res.charset) :
        res.rawBody.toString('utf8');
    if(contentType === 'application/json'){
        try {
            res.body = JSON.parse(res.body);
        } catch(e) {}
    }
    res.url = conf.url || null;
    return res;
}