const parseOptions = require('./parse-options');
const wrapResponse = require('./wrap-response');

module.exports = (options, callback) => {
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
        callback('REQUEST ABORTED');
    });

    req.on('error', err => {
        callback(err);
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
