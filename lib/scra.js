const parseOptions = require('./parse-options');

module.exports = (options, callback) => {

    const {conf, httpOptions} = parseOptions(options);

    const req = conf.request(httpOptions, (res) => {
        const chunks = [];
        res.on('data', (chunk) => {
            chunks.push(chunk);
        });
        res.on('end', () => {
            res.body = Buffer.concat(chunks).toString('utf8');
            callback(null, res);
        });
    });

    req.on('error', (err) => {
        callback(err);
    });

    req.end();
};