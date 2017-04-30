const scra = require('.');

describe('GET', () => {
    it('should perform request with easy options object', (done) => {
        scra({hostname: 'httpbin.org', path: '/get'})
            .then((res)=>done(), (err)=>done('false eror is raised'));
    });
    it('should perform request with easy string url', (done) => {
        scra('http://httpbin.org/get')
            .then((res)=>done(), (err)=>done('false eror is raised'));
    });
    it('should perform request with url in object field', (done) => {
        scra({url: 'http://httpbin.org/get'})
            .then((res)=>done(), (err)=>done('false eror is raised'));
    });
});

describe('POST', () => {
    it('should perform post request with easy form data', (done) => {
        scra({url: 'http://httpbin.org/post', data: 'a=1&b=2'})
            .then(
                (res)=>done(res.body.form.a === '1' && res.body.form.b === '2' ? undefined : 'post error'),
                (err)=>done('false eror is raised')
            );
    });
    it('should perform post request with plain text', (done) => {
        scra({url: 'http://httpbin.org/post', data: 'test', headers: {'Content-Type': 'plain/text'}})
            .then(
                (res)=>done(res.body.data === 'test' ? undefined : 'post error'),
                (err)=>done('false eror is raised')
            );
    });
});

describe('JSON', () => {
    it('should parse JSON response to object', (done) => {
        scra({url: 'http://httpbin.org/user-agent'}).then(
            (res)=>done(res.body['user-agent'] === 'astur/scra' ? undefined : 'json parse error'),
            (err)=>done('false eror is raised')
        );
    });
    it('should not parse HTML response to object', (done) => {
        scra({url: 'http://httpbin.org/html'}).then(
            (res)=>done(typeof res.body === 'string' ? undefined : 'unnecessary json parse error'),
            (err)=>done('false eror is raised')
        );
    });
});

describe('Compression', () => {
    it('should decode Gzip-compressed response', (done) => {
        scra({url: 'http://httpbin.org/gzip'}).then(
            (res)=>done(res.body.gzipped ? undefined : 'gzip error'),
            (err)=>done('false eror is raised')
        );
    });
    it('should decode Deflate-compressed response', (done) => {
        scra({url: 'http://httpbin.org/deflate'}).then(
            (res)=>done(res.body.deflated ? undefined : 'gzip error'),
            (err)=>done('false eror is raised')
        );
    });
});

describe('Cookies', () => {
    it('should send cookies from options', (done) => {
        scra({url: 'http://httpbin.org/cookies', cookies: {a: 1}}).then(
            (res)=>done(res.body.cookies.a === '1' ? undefined : 'cookies error'),
            (err)=>done('false eror is raised')
        );
    });
    it('should store cookies in response', (done) => {
        scra({url: 'http://httpbin.org/cookies/set?a=1'}).then(
            (res)=>done(res.cookies.a === '1' ? undefined : 'cookies error'),
            (err)=>done('false eror is raised')
        );
    });
});