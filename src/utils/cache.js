const Redis = require('ioredis');
const { envConfig } = require('../config');

let redisClient = null;
let isConnected = false;

if (envConfig.REDIS_HOST) {
  try {
    redisClient = new Redis({
      host: envConfig.REDIS_HOST,
      port: envConfig.REDIS_PORT,
      password: envConfig.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('Redis unreachable after 3 attempts, continuing without cache.');
          return null; // Stop retrying
        }
        return Math.min(times * 500, 2000);
      },
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log('Connected to Redis cache server.');
    });

    redisClient.on('error', () => {
      isConnected = false;
      // Do not throw or spam logs on connection drops
    });

    redisClient.on('close', () => {
      isConnected = false;
    });

    redisClient.connect().catch(() => {
      // Gracefully handled; cache will bypass safely
    });
  } catch {
    redisClient = null;
    isConnected = false;
  }
}

/**
 * Get cached value by key
 */
const get = async (key) => {
  if (!isConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

/**
 * Set cache value with TTL (seconds)
 */
const set = async (key, value, ttlSeconds = 120) => {
  if (!isConnected || !redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Fail silently, don't impact primary flow
  }
};

/**
 * Read-Through Caching Pattern with Randomized TTL Jitter Offset
 * Prevents Cache Stampede / Thundering Herd under massive concurrent load (10M scale).
 *
 * @param {string} key Cache key
 * @param {Function} fetchFn Asynchronous fallback function returning fresh data
 * @param {Object} options Configuration options
 * @param {number} options.ttlSeconds Base TTL in seconds (default: 120s)
 * @param {number} options.jitterRange Maximum random seconds added to TTL (default: 30s)
 */
const getOrSet = async (key, fetchFn, { ttlSeconds = 120, jitterRange = 30 } = {}) => {
  const cached = await get(key);
  if (cached !== null) {
    return cached;
  }

  const freshData = await fetchFn();
  if (freshData !== undefined && freshData !== null) {
    const jitter = Math.floor(Math.random() * jitterRange);
    const effectiveTTL = ttlSeconds + jitter;
    await set(key, freshData, effectiveTTL);
  }
  return freshData;
};

/**
 * Invalidate cache by key pattern
 */
const delPattern = async (pattern) => {
  if (!isConnected || !redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch {
    // Fail silently
  }
};

/**
 * Cleanly close Redis connection
 */
const close = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('Redis connection cleanly closed.');
    } catch {
      // Ignored
    }
  }
};

const getClient = () => redisClient;
const isRedisConnected = () => isConnected;

module.exports = {
  get,
  set,
  getOrSet,
  delPattern,
  close,
  getClient,
  isRedisConnected,
};
