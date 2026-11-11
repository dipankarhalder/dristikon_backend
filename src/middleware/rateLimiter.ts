import rateLimit, { Store } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { StatusCodes } from 'http-status-codes';
import { getClient, isRedisConnected } from '../utils/cache';
import logger from '../utils/logger';

/**
 * Helper to build a RedisStore if Redis is connected, otherwise returns undefined (falls back to memory store)
 */
const buildRedisStore = (prefix: string): Store | undefined => {
  const client = getClient();
  if (!client || !isRedisConnected()) {
    return undefined;
  }

  try {
    return new RedisStore({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sendCommand: async (...args: string[]): Promise<any> => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return await (client.call as any)(args[0], ...args.slice(1));
        } catch (err) {
          const error = err as Error;
          logger.warn('Redis rate-limit store error, falling back:', { error: error.message });
          throw err;
        }
      },
      prefix: `rl:${prefix}:`,
    }) as unknown as Store;
  } catch (err) {
    const error = err as Error;
    logger.warn('Failed to initialize RedisStore for rate limiter:', { error: error.message });
    return undefined;
  }
};

/**
 * General API Rate Limiter
 * Allows up to 300 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildRedisStore('api'),
  message: {
    status: StatusCodes.TOO_MANY_REQUESTS,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

/**
 * Strict Auth Rate Limiter (Production-hardened)
 * Restricts sensitive auth routes (login, signup, password reset) to 5 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildRedisStore('auth'),
  message: {
    status: StatusCodes.TOO_MANY_REQUESTS,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * Strict Mutation Rate Limiter
 * Restricts state-changing operations (POST, PATCH, DELETE) to 15 requests per minute
 * Prevents automated bot floods, spamming, and resource exhaustion
 */
export const mutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildRedisStore('mutation'),
  message: {
    status: StatusCodes.TOO_MANY_REQUESTS,
    message: 'Too many create/update requests. Please slow down and try again shortly.',
  },
});

export default {
  apiLimiter,
  authLimiter,
  mutationLimiter,
};
