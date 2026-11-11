const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { StatusCodes } = require('http-status-codes');
const { getClient, isRedisConnected } = require('../utils/cache');
const logger = require('../utils/logger');

/**
 * Helper to build a RedisStore if Redis is connected, otherwise returns undefined (falls back to memory store)
 */
const buildRedisStore = (prefix) => {
  const client = getClient();
  if (!client || !isRedisConnected()) {
    return undefined;
  }

  try {
    return new RedisStore({
      sendCommand: async (...args) => {
        try {
          return await client.call(...args);
        } catch (err) {
          logger.warn('Redis rate-limit store error, falling back:', { error: err.message });
          throw err;
        }
      },
      prefix: `rl:${prefix}:`,
    });
  } catch (err) {
    logger.warn('Failed to initialize RedisStore for rate limiter:', { error: err.message });
    return undefined;
  }
};

/**
 * General API Rate Limiter
 * Allows up to 300 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
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
const authLimiter = rateLimit({
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
const mutationLimiter = rateLimit({
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

module.exports = {
  apiLimiter,
  authLimiter,
  mutationLimiter,
};
