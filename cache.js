const Redis = require('ioredis');
const redis = new Redis({ db: 1 });


const cache = async (req, res, next) => {
    let url = new URL(req.params[0]);
    url = url.origin + url.pathname;
    const found = await redis.get(url);
    if (found) {
        return res.send(found);
    }
    return next()
}

module.exports = { redis, cache };