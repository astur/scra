module.exports = (conf, res) => {
    res.body = res.rawBody.toString('utf8');
    res.url = conf.url || null;
    return res;
}