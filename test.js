const test = require('ava');
const scra = require('.');
const zlib = require('zlib');
const iconv = require('iconv-lite');
const promisify = require('util').promisify;
const keyCert = require('key-cert');
const mockser = require('mockser');
const s = mockser();
const answer = 'Lorem ipsum';
const {TimeoutError, NetworkError, ZlibError} = scra;
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
    s.on('/headers', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(req.headers));
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
    s.on('/badGzip', (req, res) => {
        res.setHeader('Response-Accept-Encoding', req.headers['accept-encoding']);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Encoding', 'gzip');
        res.end('badGzip');
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
    await scra('http://localhost:1703').then(() => t.pass());
    await scra('localhost:1703').then(() => t.pass());
    await scra({url: 'http://localhost:1703'}).then(() => t.pass());
    await scra({url: 'http://localhost:1703', proxy: 'localhost:3128'}).then(() => t.pass());
    await scra({url: 'http://example.com:1234', reverseProxy: 'http://localhost:1703'}).then(() => t.pass());
    await scra({url: 'http://example.com:1234/text', reverseProxy: 'http://localhost:1703'}).then(() => t.pass());
    await scra({
        url: 'http://example.com:1234/text',
        reverseProxy: {
            to: 'example.com:1234',
            from: 'localhost:1703',
        },
    }).then(res => t.is(res.body, answer));
    await scra('').then(() => t.fail(), e => {
        t.true(e instanceof URIError);
    });
    await scra({}).then(() => t.fail(), e => {
        t.true(e instanceof URIError);
        t.is(e.message, 'URL not specified');
    });
    await scra({url: 1}).then(() => t.fail(), e => {
        t.true(e instanceof URIError);
        t.is(e.message, 'URL not specified');
    });
    await scra(':::').then(() => t.fail(), e => {
        t.true(e instanceof URIError);
        t.is(e.message, 'Invalid URL');
        t.is(e.url, 'http://:::');
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
    t.deepEqual(res.requestHeaders, {
        connection: 'close',
        'user-agent': 'astur/scra',
        accept: '*/*',
    });
    t.is(res.options, 'localhost:1703');
    t.true('requestTime' in res);
    t.true('timings' in res);
    t.true('bytes' in res);
    t.true('start' in res.timings);
    t.true('socket' in res.timings);
    t.true('lookup' in res.timings);
    t.true('connect' in res.timings);
    t.true('responce' in res.timings);
    t.true('end' in res.timings);
    t.true('wait' in res.timingPhases);
    t.true('dns' in res.timingPhases);
    t.true('tcp' in res.timingPhases);
    t.true('responce' in res.timingPhases);
    t.true('read' in res.timingPhases);
    t.true('total' in res.timingPhases);
    t.true('sent' in res.bytes);
    t.true('received' in res.bytes);
});

test('headers', async t => {
    await scra('http://localhost:1703/headers').then(r => {
        t.true(r.body && typeof r.body === 'object');
        t.deepEqual(r.body, {
            accept: '*/*',
            connection: 'close',
            host: 'localhost:1703',
            'user-agent': 'astur/scra',
        });
    });
    await scra('http://username:password@localhost:1703/headers').then(r => {
        t.true(r.body && typeof r.body === 'object');
        t.deepEqual(r.body, {
            accept: '*/*',
            connection: 'close',
            host: 'localhost:1703',
            'user-agent': 'astur/scra',
            authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=',
        });
    });
    await scra({url: 'http://localhost:1703/headers', headers: {test: 'ok'}}).then(r => {
        t.true(r.body && typeof r.body === 'object');
        t.deepEqual(r.body, {
            accept: '*/*',
            connection: 'close',
            host: 'localhost:1703',
            'user-agent': 'astur/scra',
            test: 'ok',
        });
    });
});

test('HTTPS', async t => {
    const ss = mockser(await keyCert());
    ss.on('/', (req, res) => {
        res.end('ok');
    });
    await ss.listen(1704);
    await scra('https://localhost:1704').then(res => {
        t.true('secureConnect' in res.timings);
        t.true('tls' in res.timingPhases);
    });
    await scra({url: 'https://localhost:1704', proxy: 'localhost:3128'}).then(res => {
        t.true('secureConnect' in res.timings);
        t.true('tls' in res.timingPhases);
    });
    await ss.close();
});

test('POST', async t => {
    await scra({url: 'localhost:1703/post', data: 'a=1&b=2&c=кирилица'}).then(res => {
        t.is(res.headers['request-content-type'], 'application/x-www-form-urlencoded');
        t.is(res.body, 'a=1&b=2&c=кирилица');
    });
    await scra({url: 'localhost:1703/post', data: {a: 1, b: 2, c: 'кирилица'}}).then(res => {
        t.is(res.headers['request-content-type'], 'application/json');
        t.is(res.body, '{"a":1,"b":2,"c":"кирилица"}');
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
    await scra({url: 'localhost:1703/badGzip', compressed: true}).then(() => t.fail(), e => {
        t.true(e instanceof ZlibError);
    });
});

test('Cookies', async t => {
    await scra({url: 'localhost:1703/cookie', cookies: {b: 'bla', c: 42}}).then(res => {
        t.deepEqual(res.cookies, {a: '42', b: '%80', c: 42});
        t.is(res.body, 'b=bla; c=42');
    });
});

test('Timeout', async t => {
    await scra({url: 'localhost:1703/delay', timeout: 500}).then(() => t.fail(), e => {
        t.true(e instanceof TimeoutError);
    });
    await scra({url: 'localhost:1703', timeout: 0}).then(() => t.pass());
});

test('Agent', async t => {
    await scra({url: 'localhost:1703', agent}).then(() => t.pass());
});

test.after('cleanup', async () => {
    await s.close();
});
