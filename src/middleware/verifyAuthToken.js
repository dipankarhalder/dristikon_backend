const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const { envConfig } = require('../config');
const { msg } = require('../constant');

const verifyToken = (req, res, next) => {
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
    next();
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: StatusCodes.UNAUTHORIZED,
      message: msg.userMsg.invalidToken,
      error: error.message,
    });
  }
};

module.exports = verifyToken;
