const http = require('http');
const https = require('https');
const parse = require('url').parse;
const cookies = require('./cookies');
const tunnel = require('tunnel-agent');

module.exports = (options) => {
    if(typeof options === 'string'){
        options = {url: options};
    }
    const url = parse(options.url);
    const httpOptions = {
        protocol: url.protocol,
        auth: url.auth,
        hostname: url.hostname,
        port: url.port,
        path: url.path,
        headers: Object.keys(options.headers || {}).reduce(
            (r, v) => (r[v.toLowerCase()] = options.headers[v], r), {
            'connection': 'close',
            'user-agent': 'astur/scra',
            'accept': '*/*',
        }),
    };
    if(options.agent){
        httpOptions.agent = options.agent;
    } else if(options.proxy){
        const proxy = parse(options.proxy);
        const urlProtocol = url.protocol === 'https:' ? 'https' : 'http';
        const proxyProtocol = proxy.protocol === 'https:' ? 'Https' : 'Http';
        httpOptions.agent = tunnel[`${urlProtocol}Over${proxyProtocol}`]({
            proxy: {
                port: proxy.port || (proxyProtocol === 'Https' ? 443 : 80),
                host: proxy.hostname,
                proxyAuth: proxy.auth
            }
        });
    }
    if(options.compressed){
        httpOptions.headers['accept-encoding'] = 'gzip, deflate';
    }
    if(options.cookies){
        httpOptions.headers['cookie'] = cookies.write(options.cookies);
    }
    const conf = {
        url: options.url,
        cookies: options.cookies ? httpOptions.headers['cookie'] : {},
        request: (url.protocol === 'https:' ? https : http).request
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