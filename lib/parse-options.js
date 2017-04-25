const http = require('http');
const https = require('https');
const url = require('url');

module.exports = (options) => {
    if(typeof options === 'string'){
        options = url.parse(options);
    }
    const httpOptions = {
        method: options.method,
        protocol: options.protocol,
        auth: options.auth,
        hostname: options.hostname,
        port: options.port,
        path: options.path,
        headers: options.headers || {},
        agent: options.agent,
    };
    const conf = {
        request: (options.protocol === 'https:' ? https : http).request
    };
    return {conf, httpOptions};
}