const http = require('http');
const https = require('https');
const url = require('url');

module.exports = (options) => {
    if(typeof options === 'string'){
        options = url.parse(options);
    } else if(options.url){
        Object.assign(options, url.parse(options.url));
    }
    const httpOptions = {
        method: options.method,
        protocol: options.protocol,
        auth: options.auth,
        hostname: options.hostname,
        port: options.port,
        path: options.path,
        headers: Object.assign({
            'connection': 'close',
            'user-agent': 'astur/scra',
            'accept': '*/*',
        }, Object.keys(options.headers || {}).reduce(
            (r, v) => (r[v.toLowerCase()] = options.headers[v], r), {}
        )),
        agent: options.agent,
    };
    const conf = {
        url: options.url || options.href,
        request: (options.protocol === 'https:' ? https : http).request
    };
    return {conf, httpOptions};
}