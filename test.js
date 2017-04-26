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