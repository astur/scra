const parseOptions = require('./parse-options');
const wrapResponse = require('./wrap-response');

module.exports = (options, callback) => {

    const {conf, httpOptions} = parseOptions(options);

    const req = conf.request(httpOptions, (res) => {
        const chunks = [];
        res.on('data', (chunk) => {
            chunks.push(chunk);
        });
        res.on('end', () => {
            res.rawBody = Buffer.concat(chunks);
            callback(null, wrapResponse(conf, res));
        });
    });

    req.on('error', (err) => {
        callback(err);
    });

    if(conf.data){
        req.write(conf.data);
    }

    req.end();
};