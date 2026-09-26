const dotenv = require('dotenv');
dotenv.config();

const isProduction = process.env.NODEENV === 'production';

module.exports = {
  PORT: process.env.PORT || 4000,
  MONGOURI: process.env.MONGOURI || 'mongodb://127.0.0.1:27017/dristikon_db',
  PLATFORM: process.env.PLATFORM || 'dev',
  JWTSECRET: process.env.JWTSECRET || 'dristikon_jwt_secret_dev_key_2026',
  EXPTIME: process.env.EXPTIME || '86400000',
  ACCESS_TOKEN_SECRET:
    process.env.ACCESS_TOKEN_SECRET ||
    process.env.JWTSECRET ||
    'dristikon_access_token_secret_key_2026',
  ACCESS_TOKEN_EXPTIME: process.env.ACCESS_TOKEN_EXPTIME || '15m',
  REFRESH_TOKEN_SECRET:
    process.env.REFRESH_TOKEN_SECRET || 'dristikon_refresh_token_secret_key_2026',
  REFRESH_TOKEN_EXPTIME: process.env.REFRESH_TOKEN_EXPTIME || '7d',
  NODEENV: isProduction,
  CLIENTURL: process.env.CLIENTURL || 'http://localhost:5173',
};
