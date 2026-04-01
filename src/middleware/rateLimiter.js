const { getRedis } = require('../config/redis');

const MAX     = parseInt(process.env.RATE_LIMIT_MAX_MESSAGES)    || 10;
const WINDOW  = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS)  || 10;

/**
 * Redis sliding-window rate limiter for Socket.IO message events.
 * Returns true if the user is within the limit, false if throttled.
 */
async function checkMessageRate(userId) {
  const redis = getRedis();
  const key   = `ratelimit:msg:${userId}`;
  const now   = Date.now();
  const floor = now - WINDOW * 1000;

  const pipe = redis.pipeline();
  pipe.zremrangebyscore(key, '-inf', floor);
  pipe.zadd(key, now, `${now}`);
  pipe.zcard(key);
  pipe.expire(key, WINDOW);
  const results = await pipe.exec();

  const count = results[2][1];
  return count <= MAX;
}

module.exports = { checkMessageRate };
