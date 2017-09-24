module.exports = uri => uri
    .replace(/^(https?:\/\/)?(.*)$/i, (_, p1, p2) => (p1 || 'http://') + p2);
