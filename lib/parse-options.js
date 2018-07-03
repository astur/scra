const http = require('http');
const https = require('https');
const parse = require('url').parse;
const cookies = require('./cookies');
const ProxyAgent = require('proxy-agent');
const httpize = require('prepend-http');
const isuri = new RegExp(require('rfc-3986').uri);

module.exports = options => {
    if(typeof options === 'string'){
        options = {url: options};
    }
    if(!('url' in options) || !options.url || typeof options.url !== 'string'){
        return {err: new URIError('URL not specified')};
    }
    options.url = httpize(options.url);
    if(!isuri.test(options.url)){
        const err = new URIError('Invalid URL');
        err.url = options.url;
        return {err};
    }
    const url = parse(options.url);
    const conf = {
        url: options.url,
        timeout: typeof options.timeout === 'number' && options.timeout >= 0 ? options.timeout : 5000,
        cookies: options.cookies || {},
        request: (url.protocol === 'https:' ? https : http).request,
    };
    conf.httpOptions = {
        protocol: url.protocol,
        auth: url.auth,
        hostname: url.hostname,
        port: url.port,
        path: url.path,
        headers: Object.keys(options.headers || {}).reduce(
            (r, v) => {
                r[v.toLowerCase()] = options.headers[v];
                return r;
            },
            {
                connection: 'close',
                'user-agent': 'astur/scra',
                accept: '*/*',
            }
        ),
    };
    if(options.agent){
        conf.httpOptions.agent = options.agent;
    } else if(options.proxy){
        conf.httpOptions.agent = new ProxyAgent(httpize(options.proxy));
    }
    if(options.compressed){
        conf.httpOptions.headers['accept-encoding'] = 'gzip, deflate';
    }
    if(options.cookies){
        conf.httpOptions.headers.cookie = cookies.write(options.cookies);
    }
    if(options.data && typeof options.data === 'string'){
        conf.data = options.data;
        conf.httpOptions.method = 'POST';
        conf.httpOptions.headers['content-type'] = conf.httpOptions.headers['content-type'] || 'application/x-www-form-urlencoded';
        conf.httpOptions.headers['content-length'] = conf.data.length;
    }
    if(options.data && typeof options.data === 'object'){
        conf.data = JSON.stringify(options.data);
        conf.httpOptions.method = 'POST';
        conf.httpOptions.headers['content-type'] = 'application/json';
        conf.httpOptions.headers['content-length'] = conf.data.length;
    }
    return {conf};
};
