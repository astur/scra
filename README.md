# scra

HTTP client, designed mainly for scraping web sites. It is not so complicated as famous [request](https://github.com/request/request), but it is really simple tool for geting html pages for parsing data or json responses from site internal API. Sometime "_less is more_".

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url] 

## Features

* GET and POST requests via HTTP/HTTPS
* Supports both promise way and callback way
* Proxy support via [proxy-agent](https://github.com/TooTallNate/node-proxy-agent)
* Non-utf8 charset decoding via [iconv-lite](https://github.com/ashtuchkin/iconv-lite)
* Auto decompression gzip/deflate
* Easy JSON-API support
* Cookies parsing/serialization
* Useful request fields
* Informative custom errors via [c-e](https://github.com/astur/c-e)
* No any superfluous things

## Install

_(node '>=8.0.0' required)_

```bash
npm install scra
```

## Usage

`scra` takes url string or options object as first param and callback function as optional second param. If no callback - `scra` returns promise. Any way `scra` produce response object, same as [http.ClientRequest](https://nodejs.org/api/http.html#http_class_http_clientrequest) but with few extra fields.

#### Synopsis

````js
const scra = require('scra');

// promise way
scra('http://httpbin.org/get')
    .then((res) => console.log(res.body))
    .catch((err) => console.error(err.message));

// callback way
scra('http://httpbin.org/get', (err, res) => {
    if(err) console.error(err.message);
    if(res) console.log(res.body);
})
````

See more examples in test.

#### Available options:

* `url` (required) - address for request. String. If protocol is omitted in string - it will be set to `http:`, so `example.com` means `http://example.com`. If `url` is the only field in options object then first param may be this string, so `scra('example.com')` is equal to `scra({url: 'example.com'})`.
* `headers` - http-headers for sending with a request. Object with string fields. By default there are three predefined headers:

    ````js
    {
        'connection': 'close',
        'user-agent': 'astur/scra',
        'accept': '*/*',
    }
    ````

    You may set any headers manually. Also 'Host' header will be set by node `http` module, and some headers may be set depending on the other options (see below). Such headers have a high priority over values in `headers` option (be careful, it is not "as usual").
    
    Manually set headers will replace defaults, but will be replaced by headers from options.

* `data` - data for POST request. If `data` is a string with length more then 0 - this string will be sent as a request body without any conversions (if `content-type` header is not set it will be `application/x-www-form-urlencoded`). If `data` is an object it will be stringified to json and sent as a request body (`content-type` header will be `application/json`).
* `cookies` - cookies to be sent with request. Key-value object. It will be stringified and placed to `cookie` header.
* `compressed` - Boolean. If `true` set `accept-encoding` header to `'gzip, deflate'`. Defaults to `false`.
* `timeout` - Number of milliseconds. Time limit for request to be done (if not - error will be thrown). If `timeout` set to `0` it means no time limit. Defaults to `5000`.
* `proxy` - address of proxy server. It may be both, `http` or `https`, and if protocol is omitted it will be `'http:'`. Now `scra` supports proxy via `proxy-agent`, so you can use proxy with `https` sites.
* `agent` - custom [http](https://nodejs.org/api/http.html#http_class_http_agent)/[https](https://nodejs.org/api/https.html#https_class_https_agent) agent.

#### Response object extra fields:

* `rawBody` - buffer with response body (decompressed if necessary).
* `charset` - charset part from `content-type` response header.
* `body` - response body converted to string (using `iconv-lite` if `charset` defined.) If `content-type` response header is `application/json` then `body` will be object parsed from json.
* `cookies` - key-value object with cookies from `cookies` option and from `set-cookie` response header.
* `url` - same as `url` field in options.
* `requestHeaders` - object with headers sent with request.
* `requestTime` - request duration (number of milliseconds).
* `timings` - detailed timings (timestamps of all request phases).
* `bytes` - just how many `bytes.sent` and `bytes.received` by this request.

## License

MIT

[npm-url]: https://npmjs.org/package/scra
[npm-image]: https://badge.fury.io/js/scra.svg
[travis-url]: https://travis-ci.org/astur/scra
[travis-image]: https://travis-ci.org/astur/scra.svg?branch=master
