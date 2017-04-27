module.exports = {
    write: obj => Object.keys(obj)
        .map(k => k + '=' + encodeURIComponent(obj[k]))
        .join('; ')
};