module.exports = (conf, res) => {
    const [contentType, charset] = (res.headers['content-type'] || '').split(';');
    res.charset = /charset=(.+)$/.test(charset) ? 
        charset.match(/charset=(.+)$/)[1] :
        contentType === 'text/html' ? 'iso-8859-1' : 'utf-8';
    res.body = res.rawBody.toString('utf8');
    if(contentType === 'application/json'){
        try {
            res.body = JSON.parse(res.body);
        } catch(e) {}
    }
    res.url = conf.url || null;
    return res;
}