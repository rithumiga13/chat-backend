const { getRedis } = require('../config/redis');

const TTL = 30; // seconds — heartbeat must fire every ~20s

async function setOnline(userId) {
  const redis = getRedis();
  await redis.set(`user:${userId}:online`, '1', 'EX', TTL);
}

async function setOffline(userId) {
  const redis = getRedis();
  await redis.del(`user:${userId}:online`);
}

async function isOnline(userId) {
  const redis = getRedis();
  return (await redis.exists(`user:${userId}:online`)) === 1;
}

async function bulkPresence(userIds) {
  const redis = getRedis();
  const keys  = userIds.map((id) => `user:${id}:online`);
  const vals  = await redis.mget(...keys);
  return userIds.reduce((acc, id, i) => {
    acc[id] = vals[i] === '1';
    return acc;
  }, {});
}

module.exports = { setOnline, setOffline, isOnline, bulkPresence };
