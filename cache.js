const Redis = require('ioredis');
const redis = new Redis({ db: 1 });

redis.flushdb();
redis.set('ee', 'aa')
redis.expire('ee', 10)


const cache = (req, res, next) => {

}

module.exports = cache;