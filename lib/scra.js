const parseOptions = require('./parse-options');
const wrapResponse = require('./wrap-response');
const httpize = require('./httpize');
const {URIError, TimeoutError, NetworkError} = require('./errors');
const isuri = new RegExp(require('rfc-3986').uri);

module.exports = (options, callback) => {
    if(typeof options === 'string'){
        options = {url: options};
    }
    if(!('url' in options) || !options.url || typeof options.url !== 'string'){
        return callback(new URIError());
    }
    options.url = httpize(options.url);
    if(!isuri.test(options.url)){
        return callback(new URIError(options.url));
    }
    const {conf, httpOptions} = parseOptions(options);
    const timings = {start: Date.now()};

    const req = conf.request(httpOptions, res => {
        const chunks = [];
        res.once('readable', () => {
            timings.responce = Date.now();
        });
        res.on('data', chunk => {
            chunks.push(chunk);
        });
        res.on('end', () => {
            stopTimer();
            timings.end = Date.now();
            res.requestTime = timings.end - timings.start;
            res.timings = timings;
            res.bytes = {
                sent: res.socket.bytesWritten,
                received: res.socket.bytesRead,
            };
            res.rawBody = Buffer.concat(chunks);
            callback(null, wrapResponse(conf, res));
        });
    });

    const timer = conf.timeout ? setTimeout(() => req.abort(), conf.timeout) : null;

    function stopTimer(){
        clearTimeout(timer);
    }

    req.on('abort', () => {
        callback(new TimeoutError(options.url, conf.timeout, timings));
    });

    req.on('error', err => {
        callback(new NetworkError(options.url, err, timings));
    });

    req.on('socket', socket => {
        timings.socket = Date.now();
        socket.on('lookup', () => {
            timings.lookup = Date.now();
        });
        socket.on('connect', () => {
            timings.connect = Date.now();
        });
        socket.on('secureConnect', () => {
            timings.secureConnect = Date.now();
        });
    });

    if(conf.data){
        req.write(conf.data);
    }

    req.end();
};
