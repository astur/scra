const http = require('http');
const https = require('https');

module.exports = (options) => {
    const conf = {
        request: (options.protocol === 'https' ? https : http).request
    };
    const httpOptions = options;
    return {conf, httpOptions};
}