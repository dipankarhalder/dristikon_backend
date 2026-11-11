const winston = require('winston');
const { envConfig } = require('../config');

// Sensitive keys to redact for GDPR compliance and credential protection
const SENSITIVE_KEYS = new Set([
  'password',
  'oldpassword',
  'newpassword',
  'refreshtoken',
  'accesstoken',
  'token',
  'authtoken',
  'authorization',
  'creditcard',
  'credit_card',
  'cardnumber',
  'cvv',
  'cvc',
  'secret',
]);

/**
 * In-place redaction that preserves Winston's internal Symbol properties (LEVEL, MESSAGE, SPLAT)
 */
const redactInPlace = (target, seen = new WeakSet()) => {
  if (!target || typeof target !== 'object' || seen.has(target)) return;
  seen.add(target);

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      if (target[i] && typeof target[i] === 'object') {
        redactInPlace(target[i], seen);
      }
    }
    return;
  }

  for (const key of Object.keys(target)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      target[key] = '[REDACTED]';
    } else if (target[key] && typeof target[key] === 'object') {
      redactInPlace(target[key], seen);
    }
  }
};

/**
 * Winston format that redacts sensitive PII and credential data
 */
const redactSensitiveData = winston.format((info) => {
  redactInPlace(info);
  return info;
});

const isProd = envConfig.NODEENV;

const logger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    redactSensitiveData(),
    isProd
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `[${timestamp}] ${level}: ${stack || message}${metaStr}`;
          }),
        ),
  ),
  transports: [new winston.transports.Console()],
});

// Stream for piping Morgan HTTP access logs through Winston
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;
