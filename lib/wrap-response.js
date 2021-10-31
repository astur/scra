const iconv = require('iconv-lite');
const zlib = require('zlib');
const cookies = require('./cookies');
const {ZlibError} = require('./errors');

module.exports = (conf, res, chunks) => {
    res.requestTime = res.timings.end - res.timings.start;
    res.bytes = {
        sent: res.socket && res.socket.bytesWritten || 0,
        received: res.socket && res.socket.bytesRead || 0,
    };
    res.rawBody = Buffer.concat(chunks);
    res.requestHeaders = conf.httpOptions.headers;
    const unzip = {
        'x-deflate': zlib.inflateSync,
        deflate: zlib.inflateSync,
        'x-gzip': zlib.gunzipSync,
        gzip: zlib.gunzipSync,
    }[res.headers['content-encoding']];
    if(unzip){
        try {
            res.rawBody = unzip(res.rawBody);
        } catch(e){
            throw new ZlibError(conf.url, res.headers['content-encoding']);
        }
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
        } catch(e){}
    }
    res.cookies = Object.assign(conf.cookies, cookies.read(res.headers['set-cookie'] || []));
    res.url = conf.url;
    return res;
};
