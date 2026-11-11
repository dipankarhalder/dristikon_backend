const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const { envConfig } = require('../config');
const { msg } = require('../constant');
const { isTokenBlacklisted } = require('../utils/security');

const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header (Bearer token)
    if (req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : req.headers.authorization;
    }

    // Fall back to cookies (accessToken or legacy authToken)
    if (!token && req.cookies) {
      token = req.cookies.accessToken || req.cookies.authToken;
    }

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: msg.userMsg.accessDenied,
      });
    }

    // Check if access token has been revoked / blacklisted
    const revoked = await isTokenBlacklisted(token);
    if (revoked) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: 'Token has been revoked. Please sign in again.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, envConfig.ACCESS_TOKEN_SECRET);
    } catch (err) {
      // Fallback check against legacy JWTSECRET if different
      if (envConfig.JWTSECRET && envConfig.JWTSECRET !== envConfig.ACCESS_TOKEN_SECRET) {
        decoded = jwt.verify(token, envConfig.JWTSECRET);
      } else {
        throw err;
      }
    }

    req.user = decoded;
    req.rawToken = token;
    next();
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: StatusCodes.UNAUTHORIZED,
      message: msg.userMsg.invalidToken,
      error: envConfig.NODEENV ? undefined : error.message,
    });
  }
};

module.exports = verifyToken;
