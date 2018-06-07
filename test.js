const test = require('ava');
const scra = require('.');

test('GET', async t => {
    await scra('http://httpbin.org/get').then(() => t.pass(), e => t.fail(e));
    await scra('https://httpbin.org/get').then(() => t.pass(), e => t.fail(e));
    await scra('httpbin.org/get').then(() => t.pass(), e => t.fail(e));
    await scra({url: 'http://httpbin.org/get'}).then(() => t.pass(), e => t.fail(e));
});

test('POST', async t => {
    await scra({url: 'http://httpbin.org/post', data: 'a=1&b=2'}).then(res => {
        t.is(res.body.form.a, '1');
        t.is(res.body.form.b, '2');
    }, e => t.fail(e));
    await scra({url: 'http://httpbin.org/post', data: 'test', headers: {'Content-Type': 'plain/text'}}).then(res => {
        t.is(res.body.data, 'test');
    }, e => t.fail(e));
});

test('JSON', async t => {
    await scra({url: 'http://httpbin.org/user-agent'}).then(res => {
        t.is(res.body['user-agent'], 'astur/scra');
    }, e => t.fail(e));
    await scra({url: 'http://httpbin.org/html'}).then(res => {
        t.is(typeof res.body, 'string');
    }, e => t.fail(e));
    await scra({url: 'http://httpbin.org/post', data: {a: 1, b: 2}}).then(res => {
        t.is(res.body.json.a, 1);
        t.is(res.body.json.b, 2);
    }, e => t.fail(e));
});

test('Compression', async t => {
    await scra({url: 'http://httpbin.org/gzip'}).then(res => {
        t.true(res.body.gzipped);
    }, e => t.fail(e));
    await scra({url: 'http://httpbin.org/deflate'}).then(res => {
        t.true(res.body.deflated);
    }, e => t.fail(e));
});

test('Cookies', async t => {
    await scra({url: 'http://httpbin.org/cookies', cookies: {a: 1}}).then(res => {
        t.is(res.body.cookies.a, '1');
    }, e => t.fail(e));
    await scra({url: 'http://httpbin.org/cookies/set?a=1'}).then(res => {
        t.is(res.cookies.a, '1');
    }, e => t.fail(e));
});

test('Timeout', async t => {
    await scra({url: 'http://httpbin.org/delay/10', timeout: 1000}).then(() => t.fail(), e => {
        t.true(e instanceof Error);
    });
    await scra({url: 'http://httpbin.org/get', timeout: 10000}).then(() => t.pass(), e => t.fail(e));
});
