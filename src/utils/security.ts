import cache from './cache';
import logger from './logger';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_SECONDS = 15 * 60; // 15 minutes
const ATTEMPT_WINDOW_SECONDS = 15 * 60; // 15 minutes

export interface FailedLoginResult {
  locked: boolean;
  attempts?: number;
  remainingAttempts?: number;
  remainingSeconds?: number;
}

/**
 * Checks whether an account is temporarily locked out due to consecutive failed sign-ins.
 * Returns null if not locked, or remaining lockout seconds if locked.
 */
export const checkAccountLockout = async (email: string): Promise<number | null> => {
  const client = cache.getClient();
  if (!client || !cache.isRedisConnected()) return null;

  try {
    const key = `lockout:${email.toLowerCase()}`;
    const ttl = await client.ttl(key);
    if (ttl > 0) {
      return ttl;
    }
    return null;
  } catch (err) {
    const error = err as Error;
    logger.warn('Redis error checking account lockout:', { error: error.message });
    return null;
  }
};

/**
 * Records a failed sign-in attempt. If threshold is reached, locks the account.
 */
export const recordFailedLogin = async (email: string): Promise<FailedLoginResult> => {
  const client = cache.getClient();
  if (!client || !cache.isRedisConnected()) return { locked: false, attempts: 1 };

  try {
    const emailKey = email.toLowerCase();
    const attemptsKey = `failed_attempts:${emailKey}`;
    const attempts = await client.incr(attemptsKey);

    if (attempts === 1) {
      await client.expire(attemptsKey, ATTEMPT_WINDOW_SECONDS);
    }

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutKey = `lockout:${emailKey}`;
      await client.set(lockoutKey, 'locked', 'EX', LOCKOUT_WINDOW_SECONDS);
      await client.del(attemptsKey);
      logger.warn(`Account locked due to consecutive failed logins: ${emailKey}`);
      return { locked: true, remainingSeconds: LOCKOUT_WINDOW_SECONDS };
    }

    return { locked: false, attempts, remainingAttempts: MAX_FAILED_ATTEMPTS - attempts };
  } catch (err) {
    const error = err as Error;
    logger.warn('Redis error recording failed login:', { error: error.message });
    return { locked: false, attempts: 1 };
  }
};

/**
 * Resets failed sign-in counters on successful authentication.
 */
export const clearFailedLogin = async (email: string): Promise<void> => {
  const client = cache.getClient();
  if (!client || !cache.isRedisConnected()) return;

  try {
    const emailKey = email.toLowerCase();
    await client.del(`failed_attempts:${emailKey}`, `lockout:${emailKey}`);
  } catch (err) {
    const error = err as Error;
    logger.warn('Redis error clearing failed login:', { error: error.message });
  }
};

/**
 * Adds an access token to the Redis revocation blacklist until its expiry.
 */
export const blacklistToken = async (token?: string, ttlSeconds = 900): Promise<void> => {
  const client = cache.getClient();
  if (!client || !cache.isRedisConnected() || !token) return;

  try {
    await client.set(`bl:${token}`, 'revoked', 'EX', Math.max(ttlSeconds, 60));
  } catch (err) {
    const error = err as Error;
    logger.warn('Redis error blacklisting token:', { error: error.message });
  }
};

/**
 * Checks whether an access token has been revoked / blacklisted.
 */
export const isTokenBlacklisted = async (token?: string): Promise<boolean> => {
  const client = cache.getClient();
  if (!client || !cache.isRedisConnected() || !token) return false;

  try {
    const result = await client.get(`bl:${token}`);
    return result === 'revoked';
  } catch (err) {
    const error = err as Error;
    logger.warn('Redis error checking token blacklist:', { error: error.message });
    return false;
  }
};

export default {
  checkAccountLockout,
  recordFailedLogin,
  clearFailedLogin,
  blacklistToken,
  isTokenBlacklisted,
};
