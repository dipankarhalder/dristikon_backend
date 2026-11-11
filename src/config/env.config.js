const dotenv = require('dotenv');
dotenv.config();

const isProduction = process.env.NODEENV === 'production';

const validateProductionEnv = () => {
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

module.exports = {
  PORT: process.env.PORT || 4000,
  MONGOURI: process.env.MONGOURI || 'mongodb://127.0.0.1:27017/dristikon_db',
  PLATFORM: process.env.PLATFORM || 'dev',
  JWTSECRET: process.env.JWTSECRET || 'dristikon_jwt_secret_dev_key_2026',
  EXPTIME: process.env.EXPTIME || '86400000',
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || process.env.JWTSECRET || 'dristikon_access_token_secret_key_2026',
  ACCESS_TOKEN_EXPTIME: process.env.ACCESS_TOKEN_EXPTIME || '15m',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'dristikon_refresh_token_secret_key_2026',
  REFRESH_TOKEN_EXPTIME: process.env.REFRESH_TOKEN_EXPTIME || '7d',
  REDIS_HOST: process.env.REDIS_HOST || '',
  REDIS_PORT: parseInt(process.env.REDIS_PORT, 10) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  NODEENV: isProduction,
  CLIENTURL: process.env.CLIENTURL || 'http://localhost:5173',
  ENABLE_CLUSTER: process.env.ENABLE_CLUSTER === 'true',
  KAFKA_BROKERS: process.env.KAFKA_BROKERS || '',
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'dristikon-backend',
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'dristikon-notification-group',
};
