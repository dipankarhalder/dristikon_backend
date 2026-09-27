const rateLimit = require('express-rate-limit');
const { StatusCodes } = require('http-status-codes');

/**
 * General API Rate Limiter
 * Allows up to 300 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: StatusCodes.TOO_MANY_REQUESTS,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

/**
 * Strict Auth Rate Limiter
 * Protects login and signup against credential stuffing and brute force
 * Allows up to 20 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: StatusCodes.TOO_MANY_REQUESTS,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
