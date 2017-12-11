const parseOptions = require('./parse-options');
const wrapResponse = require('./wrap-response');

module.exports = (options, callback) => {
    const {conf, httpOptions} = parseOptions(options);
    const startTime = Date.now();

    const req = conf.request(httpOptions, res => {
        const chunks = [];
        res.on('data', chunk => {
            chunks.push(chunk);
        });
        res.on('end', () => {
            stopTimer();
            res.requestTime = Date.now() - startTime;
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

    if(conf.data){
        req.write(conf.data);
    }

    req.end();
};
