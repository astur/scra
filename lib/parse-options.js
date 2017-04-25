const http = require('http');
const https = require('https');
const url = require('url');

module.exports = (options) => {
    if(typeof options === 'string'){
        options = url.parse(options);
    }
    const conf = {
        request: (options.protocol === 'https' ? https : http).request
    };
    const httpOptions = options;
    return {conf, httpOptions};
}