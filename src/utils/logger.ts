import winston from 'winston';
import { envConfig } from '../config';

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
const redactInPlace = (target: unknown, seen = new WeakSet<object>()): void => {
  if (!target || typeof target !== 'object' || seen.has(target as object)) return;
  seen.add(target as object);

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      if (target[i] && typeof target[i] === 'object') {
        redactInPlace(target[i], seen);
      }
    }
    return;
  }

  const obj = target as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      obj[key] = '[REDACTED]';
    } else if (obj[key] && typeof obj[key] === 'object') {
      redactInPlace(obj[key], seen);
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

export type AppLogger = Omit<winston.Logger, 'stream'> & {
  stream?: {
    write: (message: string) => void;
  };
};

const winstonLogger = winston.createLogger({
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

export const logger = winstonLogger as unknown as AppLogger;

// Stream for piping Morgan HTTP access logs through Winston
logger.stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
