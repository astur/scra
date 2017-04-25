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