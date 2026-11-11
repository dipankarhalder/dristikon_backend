import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODEENV === 'production';

const validateProductionEnv = (): void => {
  if (isProduction) {
    const insecureTokens = [
      'dristikon_jwt_secret_dev_key_2026',
      'dristikon_access_token_secret_key_2026',
      'dristikon_refresh_token_secret_key_2026',
    ];

    if (!process.env.ACCESS_TOKEN_SECRET || insecureTokens.includes(process.env.ACCESS_TOKEN_SECRET)) {
      throw new Error('SECURITY CRITICAL: Unsafe or missing ACCESS_TOKEN_SECRET in production environment.');
    }

    if (!process.env.REFRESH_TOKEN_SECRET || insecureTokens.includes(process.env.REFRESH_TOKEN_SECRET)) {
      throw new Error('SECURITY CRITICAL: Unsafe or missing REFRESH_TOKEN_SECRET in production environment.');
    }

    if (!process.env.MONGOURI) {
      throw new Error('SECURITY CRITICAL: MONGOURI must be configured in production.');
    }
  }
};

validateProductionEnv();

export const PORT = Number(process.env.PORT) || 4000;
export const MONGOURI = process.env.MONGOURI || 'mongodb://127.0.0.1:27017/dristikon_db';
export const PLATFORM = process.env.PLATFORM || 'dev';
export const JWTSECRET = process.env.JWTSECRET || 'dristikon_jwt_secret_dev_key_2026';
export const EXPTIME = process.env.EXPTIME || '86400000';
export const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || process.env.JWTSECRET || 'dristikon_access_token_secret_key_2026';
export const ACCESS_TOKEN_EXPTIME = process.env.ACCESS_TOKEN_EXPTIME || '15m';
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dristikon_refresh_token_secret_key_2026';
export const REFRESH_TOKEN_EXPTIME = process.env.REFRESH_TOKEN_EXPTIME || '7d';
export const REDIS_HOST = process.env.REDIS_HOST || '';
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10) || 6379;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
export const NODEENV = isProduction;
export const CLIENTURL = process.env.CLIENTURL || 'http://localhost:5173';
export const ENABLE_CLUSTER = process.env.ENABLE_CLUSTER === 'true';
export const KAFKA_BROKERS = process.env.KAFKA_BROKERS || '';
export const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'dristikon-backend';
export const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID || 'dristikon-notification-group';

export default {
  PORT,
  MONGOURI,
  PLATFORM,
  JWTSECRET,
  EXPTIME,
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPTIME,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPTIME,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  NODEENV,
  CLIENTURL,
  ENABLE_CLUSTER,
  KAFKA_BROKERS,
  KAFKA_CLIENT_ID,
  KAFKA_GROUP_ID,
};
