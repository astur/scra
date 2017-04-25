const parseOptions = require('./parse-options');

module.exports = (options, callback) => {

    const {conf, httpOptions} = parseOptions(options);

    const req = conf.request(httpOptions, (res) => {
        const chunks = [];
        res.on('data', (chunk) => {
            chunks.push(chunk);
        });
        res.on('end', () => {
            res.rawBody = Buffer.concat(chunks);
            res.body = res.rawBody.toString('utf8');
            callback(null, res);
        });
    });

    req.on('error', (err) => {
        callback(err);
    });

    req.end();
};