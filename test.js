const test = require('ava');
const scra = require('.');
const zlib = require('zlib');
const promisify = require('util').promisify;
const keyCert = require('key-cert');
const mockser = require('mockser');
const s = mockser();
const answer = 'Lorem ipsum';

test.before('setup', async () => {
    const compressed = {
        gzip: await promisify(zlib.gzip)(answer),
        deflate: await promisify(zlib.deflate)(answer),
    };
    s.on('/', (req, res) => {
        res.end(answer);
    });
    s.on('/post', (req, res) => {
        res.setHeader('Request-Content-Type', req.headers['content-type']);
        req.pipe(res);
    });
    s.on('/goodJSON', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end('{"a":1}');
    });
    s.on('/badJSON', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end('text');
    });
    s.on('/gzip', (req, res) => {
        res.setHeader('Response-Accept-Encoding', 'gzip, deflate');
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Encoding', 'gzip');
        res.end(compressed.gzip);
    });
    s.on('/deflate', (req, res) => {
        res.setHeader('Response-Accept-Encoding', 'gzip, deflate');
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Encoding', 'deflate');
        res.end(compressed.deflate);
    });
    s.on('/cookie', (req, res) => {
        res.setHeader('Set-Cookie', ['a=1; Path=/']);
        res.end(req.headers.cookie);
    });
    s.on('/delay', (req, res) => {
        setTimeout(() => res.end(answer), 5000);
    });
    await s.listen(1703);
});

test('url', async t => {
    await scra('http://localhost:1703').then(() => t.pass(), e => t.fail(e));
    await scra('localhost:1703').then(() => t.pass(), e => t.fail(e));
    await scra({url: 'http://localhost:1703'}).then(() => t.pass(), e => t.fail(e));
});

test('response fields', async t => {
    const res = await scra('localhost:1703');
    t.true('url' in res);
    t.true('body' in res);
    t.true('rawBody' in res);
    t.true('charset' in res);
    t.true('cookies' in res);
    t.true('requestTime' in res);
    t.true('timings' in res);
    t.true('bytes' in res);
    t.true('start' in res.timings);
    t.true('socket' in res.timings);
    t.true('lookup' in res.timings);
    t.true('connect' in res.timings);
    t.true('responce' in res.timings);
    t.true('end' in res.timings);
    t.true('sent' in res.bytes);
    t.true('received' in res.bytes);
});

test('HTTPS', async t => {
    const ss = mockser(await keyCert());
    ss.on('/', (req, res) => {
        res.end('ok');
    });
    await ss.listen(1704);
    await scra('https://localhost:1704').then(() => t.pass(), e => t.fail(e));
    await ss.close();
});

test('POST', async t => {
    await scra({url: 'localhost:1703/post', data: 'a=1&b=2'}).then(res => {
        t.is(res.headers['request-content-type'], 'application/x-www-form-urlencoded');
        t.is(res.body, 'a=1&b=2');
    });
    await scra({url: 'localhost:1703/post', data: {a: 1, b: 2}}).then(res => {
        t.is(res.headers['request-content-type'], 'application/json');
        t.is(res.body, '{"a":1,"b":2}');
    });
    await scra({url: 'localhost:1703/post', data: 'test', headers: {'Content-Type': 'plain/text'}}).then(res => {
        t.is(res.headers['request-content-type'], 'plain/text');
        t.is(res.body, 'test');
    });
});

test('JSON', async t => {
    await scra({url: 'localhost:1703/goodJSON'}).then(res => {
        t.is(res.headers['content-type'], 'application/json');
        t.is(res.body.a, 1);
    });
    await scra({url: 'localhost:1703/badJSON'}).then(res => {
        t.is(res.headers['content-type'], 'application/json');
        t.is(res.body, 'text');
    });
});

test('Compression', async t => {
    await scra({url: 'localhost:1703/gzip', compressed: true}).then(res => {
        t.is(res.body, answer);
        t.is(res.headers['response-accept-encoding'], 'gzip, deflate');
    });
    await scra({url: 'localhost:1703/deflate', compressed: true}).then(res => {
        t.is(res.body, answer);
        t.is(res.headers['response-accept-encoding'], 'gzip, deflate');
    });
});

test('Cookies', async t => {
    await scra({url: 'localhost:1703/cookie', cookies: {a: 1, b: 2}}).then(res => {
        t.is(res.cookies.a, '1');
        t.is(res.body, 'a=1; b=2');
    });
});

test('Timeout', async t => {
    await scra({url: 'localhost:1703/delay', timeout: 500}).then(() => t.fail(), e => {
        t.true(e instanceof Error);
    });
    await scra({url: 'localhost:1703', timeout: 10000}).then(() => t.pass(), e => t.fail(e));
});

test.after('cleanup', async () => {
    await s.close();
});
