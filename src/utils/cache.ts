import Redis from 'ioredis';
import { envConfig } from '../config';

let redisClient: Redis | null = null;
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
export const get = async <T = unknown>(key: string): Promise<T | null> => {
  if (!isConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
};

/**
 * Set cache value with TTL (seconds)
 */
export const set = async (key: string, value: unknown, ttlSeconds = 120): Promise<void> => {
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
 */
export const getOrSet = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  { ttlSeconds = 120, jitterRange = 30 } = {},
): Promise<T> => {
  const cached = await get<T>(key);
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
export const delPattern = async (pattern: string): Promise<void> => {
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
export const close = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('Redis connection cleanly closed.');
    } catch {
      // Ignored
    }
  }
};

export const getClient = (): Redis | null => redisClient;
export const isRedisConnected = (): boolean => isConnected;

export default {
  get,
  set,
  getOrSet,
  delPattern,
  close,
  getClient,
  isRedisConnected,
};
