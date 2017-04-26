module.exports = (conf, res) => {
    const [contentType, charset] = (res.headers['content-type'] || '').split(';');
    res.body = res.rawBody.toString('utf8');
    if(contentType === 'application/json'){
        try {
            res.body = JSON.parse(res.body);
        } catch(e) {}
    }
    res.url = conf.url || null;
    return res;
}