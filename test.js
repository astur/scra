const test = require('ava');
const scra = require('.');
const zlib = require('zlib');
const iconv = require('iconv-lite');
const promisify = require('util').promisify;
const keyCert = require('key-cert');
const mockser = require('mockser');
const s = mockser();
const answer = 'Lorem ipsum';
const {URIError, TimeoutError, NetworkError} = require('./lib/errors');
const agent = new (require('http')).Agent({maxFreeSockets: 128});

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
    s.on('/charset', (req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=win1251');
        res.end(iconv.encode('<p>Лорем ипсум</p>', 'win1251'));
    });
    s.on('/charset/bad', (req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=bad123');
        res.end(answer);
    });
    s.on('/text', (req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.end(answer);
    });
    s.on('/gzip', (req, res) => {
        res.setHeader('Response-Accept-Encoding', req.headers['accept-encoding']);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Encoding', 'gzip');
        res.end(compressed.gzip);
    });
    s.on('/deflate', (req, res) => {
        res.setHeader('Response-Accept-Encoding', req.headers['accept-encoding']);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Encoding', 'deflate');
        res.end(compressed.deflate);
    });
    s.on('/cookie', (req, res) => {
        res.setHeader('Set-Cookie', ['a=%34%32; Path=/', 'b="%80"; Path=/']);
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
    await scra('').then(() => t.fail(), e => {
        t.true(e instanceof URIError);
    });
    await scra({}).then(() => t.fail(), e => {
        t.true(e instanceof URIError);
    });
    await scra({url: 1}).then(() => t.fail(), e => {
        t.true(e instanceof URIError);
    });
    await scra(':::').then(() => t.fail(), e => {
        t.true(e instanceof URIError);
    });
    await scra('https://localhost:1703').then(() => t.fail(), e => {
        t.true(e instanceof NetworkError);
    });
});

test('response fields', async t => {
    const res = await scra('localhost:1703');
    t.is(res.url, 'http://localhost:1703');
    t.is(res.body, answer);
    t.is(res.rawBody.toString(), answer);
    t.is(res.charset, 'utf-8');
    t.deepEqual(res.cookies, {});
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
    await scra('https://localhost:1704').then(res => {
        t.true('secureConnect' in res.timings);
    });
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

test('charset', async t => {
    await scra({url: 'localhost:1703/charset'}).then(res => {
        t.is(res.body, '<p>Лорем ипсум</p>');
        t.is(res.charset, 'win1251');
    });
});

test('charset/bad', async t => {
    await scra({url: 'localhost:1703/charset/bad'}).then(res => {
        t.is(res.body, answer);
        t.is(res.charset, 'bad123');
    });
});

test('text', async t => {
    await scra({url: 'localhost:1703/text'}).then(res => {
        t.is(res.body, answer);
        t.is(res.charset, 'iso-8859-1');
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
    await scra({url: 'localhost:1703/cookie', cookies: {A: 1, B: 2}}).then(res => {
        t.deepEqual(res.cookies, {a: '42', b: '%80', A: 1, B: 2});
        t.is(res.body, 'A=1; B=2');
    });
});

test('Timeout', async t => {
    await scra({url: 'localhost:1703/delay', timeout: 500}).then(() => t.fail(), e => {
        t.true(e instanceof TimeoutError);
    });
    await scra({url: 'localhost:1703', timeout: 0}).then(() => t.pass(), e => t.fail(e));
});

test('Agent', async t => {
    await scra({url: 'localhost:1703', agent}).then(() => t.pass(), e => t.fail(e));
});

test.after('cleanup', async () => {
    await s.close();
});
