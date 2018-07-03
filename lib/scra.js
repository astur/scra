const parseOptions = require('./parse-options');
const wrapResponse = require('./wrap-response');
const {TimeoutError, NetworkError} = require('./errors');

module.exports = (options, callback) => {
    const {err, conf} = parseOptions(options);
    if(err) return callback(err);

    const timings = {start: Date.now()};

    const req = conf.request(conf.httpOptions, res => {
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
            res.timings = timings;
            callback(null, wrapResponse(conf, res, chunks));
        });
    });

    const timer = conf.timeout ? setTimeout(() => req.abort(), conf.timeout) : null;

    function stopTimer(){
        clearTimeout(timer);
    }

    req.on('abort', () => {
        callback(new TimeoutError(conf.url, conf.timeout, timings));
    });

    req.on('error', err => {
        stopTimer();
        callback(new NetworkError(conf.url, err, timings));
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
