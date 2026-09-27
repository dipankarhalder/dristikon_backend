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

    redisClient.on('error', (err) => {
      isConnected = false;
      // Do not throw or spam logs on connection drops
    });

    redisClient.on('close', () => {
      isConnected = false;
    });

    redisClient.connect().catch(() => {
      // Gracefully handled; cache will bypass safely
    });
  } catch (err) {
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
  } catch (err) {
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
  } catch (err) {
    // Fail silently, don't impact primary flow
  }
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
  } catch (err) {
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
    } catch (err) {
      // Ignored
    }
  }
};

module.exports = {
  get,
  set,
  delPattern,
  close,
};
