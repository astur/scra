const scra = require('.');

describe('GET', () => {
    it('should perform request with easy options object', (done) => {
        scra({hostname: 'httpbin.org', path: '/get'})
            .then((res)=>done(), (err)=>done('false eror is raised'));
    });
});