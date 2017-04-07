const http = require('http');
const https = require('https');

module.exports = (options, callback) => {

    const request = (options.protocol === 'https' ? https : http).request;
    const chunks = [];

    const req = request(options, (res) => {
        res.on('data', (chunk) => {
            chunks.push(chunk);
        });
        res.on('end', () => {
            res.body = Buffer.concat(chunks).toString('utf8');
            callback(null, res.body);
        });
    });

    req.on('error', (err) => {
        callback(err);
    });

    req.end();
};