const http = require('http');
const https = require('https');
const url = require('url');
const cookies = require('./cookies');

module.exports = (options) => {
    if(typeof options === 'string'){
        options = url.parse(options);
    } else if(options.url){
        Object.assign(options, url.parse(options.url));
    }
    const httpOptions = {
        protocol: options.protocol,
        auth: options.auth,
        hostname: options.hostname,
        port: options.port,
        path: options.path,
        headers: Object.keys(options.headers || {}).reduce(
            (r, v) => (r[v.toLowerCase()] = options.headers[v], r), {
            'connection': 'close',
            'user-agent': 'astur/scra',
            'accept': '*/*',
        }),
        agent: options.agent,
    };
    if(options.compressed){
        httpOptions.headers['accept-encoding'] = 'gzip, deflate';
    }
    if(options.cookies){
        httpOptions.headers['cookie'] = cookies.write(options.cookies);
    }
    const conf = {
        url: options.url || options.href,
        cookies: options.cookies ? httpOptions.headers['cookie'] : {},
        request: (options.protocol === 'https:' ? https : http).request
    };
    if(options.data && typeof options.data === 'string'){
        conf.data = options.data;
        httpOptions.method = 'POST';
        httpOptions.headers['content-type'] = httpOptions.headers['content-type'] || 'application/x-www-form-urlencoded';
        httpOptions.headers['content-length'] = conf.data.length;
    }
    if(options.data && typeof options.data === 'object'){
        conf.data = JSON.stringify(options.data);
        httpOptions.method = 'POST';
        httpOptions.headers['content-type'] = 'application/json';
        httpOptions.headers['content-length'] = conf.data.length;
    }
    return {conf, httpOptions};
}