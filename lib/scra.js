const parseOptions = require('./parse-options');
const wrapResponse = require('./wrap-response');
const ce = require('c-e');
const isuri = new RegExp(require('rfc-3986').uri);
const httpize = require('./httpize');

module.exports = (options, callback) => {
    if(typeof options === 'string'){
        options = {url: options};
    }
    if(!('url' in options)){
        return callback(new (ce('URIError'))('URL not specified'));
    }
    options.url = httpize(options.url);
    if(!isuri.test(options.url)){
        return callback(new (ce('URIError'))('Invalid URL'));
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
        callback(new (ce('TimeoutError'))('Request aborted by timeout'));
    });

    req.on('error', () => {
        callback(new (ce('NetworkError'))('Unable to connect the server'));
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
