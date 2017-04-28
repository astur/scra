module.exports = {
    read: header =>[].concat(header)
        .map(v => v.split(';')[0].split('='))
        .filter(v => v.length > 1)
        .map(v => [v[0], v.slice(1).join('=')].map(w => w.trim()))
        .map(v => v[1][0] === '"' ? [v[0], v[1].slice(1, -1)]: v)
        .reduce((r, v) => {
            try {
                r[v[0]] = decodeURIComponent(v[1]);
            } catch(e) {
                r[v[0]] = v[1];
            }
            return r;
        }, {}),
    write: obj => Object.keys(obj)
        .map(k => k + '=' + encodeURIComponent(obj[k]))
        .join('; ')
};