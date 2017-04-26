module.exports = (conf, res) => {
    res.body = res.rawBody.toString('utf8');
    if(res.headers['content-type'] === 'application/json'){
        try {
            res.body = JSON.parse(res.body);
        } catch(e) {}
    }
    res.url = conf.url || null;
    return res;
}