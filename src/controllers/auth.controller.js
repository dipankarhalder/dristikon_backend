const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { envConfig } = require('../config');
const { msg } = require('../constant');
const { authValidate } = require('../validation');
const { validateFields, sendErrorResponse, security } = require('../utils');

const ACCESS_TOKEN_COOKIE_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Standardized secure cookie options for production
 */
const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: Boolean(envConfig.NODEENV),
  sameSite: envConfig.NODEENV ? 'strict' : 'lax',
  ...(maxAge !== undefined ? { maxAge } : {}),
});

/* user signup */
const userSignup = async (req, res) => {
  try {
    const { error, value } = authValidate.userInfoSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return validateFields(res, error.details.map((detail) => detail.message).join(', '));
    }
    const existingEmail = await User.findOne({ email: value.email.toLowerCase() });
    if (existingEmail) {
      return validateFields(res, msg.userMsg.emailAlreadyExist);
    }
    const user = new User({
      name: value.name,
      email: value.email.toLowerCase(),
      password: value.password,
      phone: value.phone,
      role: value.role,
    });
    await user.save();
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: msg.userMsg.newUserCreated,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* user signin */
const userSignin = async (req, res) => {
  try {
    const { error, value } = authValidate.userLoginSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return validateFields(res, error.details.map((detail) => detail.message).join(', '));
    }

    const email = value.email.toLowerCase();

    // Check account lockout status
    const lockoutRemaining = await security.checkAccountLockout(email);
    if (lockoutRemaining) {
      const minutes = Math.ceil(lockoutRemaining / 60);
      return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        status: StatusCodes.TOO_MANY_REQUESTS,
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutes} minute(s).`,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Record failed attempt against unknown email to prevent enumeration timing
      await security.recordFailedLogin(email);
      return validateFields(res, msg.userMsg.existUserEmail);
    }

    const isMatch = await user.comparePassword(value.password);
    if (!isMatch) {
      const { locked } = await security.recordFailedLogin(email);
      if (locked) {
        return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
          status: StatusCodes.TOO_MANY_REQUESTS,
          message:
            'Account is now temporarily locked due to 5 consecutive failed login attempts. Please try again after 15 minutes.',
        });
      }
      return validateFields(res, msg.userMsg.userWrongPassword);
    }

    // Reset failed login attempts on successful authentication
    await security.clearFailedLogin(email);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Persist refresh token in database for validation/revocation
    user.refreshToken = refreshToken;
    await user.save();

    // Set secure HTTP-only cookies with SameSite policy
    res.cookie('accessToken', accessToken, getCookieOptions(ACCESS_TOKEN_COOKIE_MAX_AGE));
    res.cookie('authToken', accessToken, getCookieOptions(ACCESS_TOKEN_COOKIE_MAX_AGE));
    res.cookie('refreshToken', refreshToken, getCookieOptions(REFRESH_TOKEN_COOKIE_MAX_AGE));

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      token: accessToken,
      accessToken: accessToken,
      refreshToken: refreshToken,
      message: msg.userMsg.userLoginSuccessfully,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* refresh access token */
const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: msg.userMsg.refreshTokenRequired,
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(incomingRefreshToken, envConfig.REFRESH_TOKEN_SECRET);
    } catch {
      return res.status(StatusCodes.FORBIDDEN).json({
        status: StatusCodes.FORBIDDEN,
        message: msg.userMsg.invalidRefreshToken,
      });
    }

    const user = await User.findById(decoded.userid);
    if (!user || user.refreshToken !== incomingRefreshToken) {
      return res.status(StatusCodes.FORBIDDEN).json({
        status: StatusCodes.FORBIDDEN,
        message: msg.userMsg.invalidRefreshToken,
      });
    }

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    // Rotate refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('accessToken', newAccessToken, getCookieOptions(ACCESS_TOKEN_COOKIE_MAX_AGE));
    res.cookie('authToken', newAccessToken, getCookieOptions(ACCESS_TOKEN_COOKIE_MAX_AGE));
    res.cookie('refreshToken', newRefreshToken, getCookieOptions(REFRESH_TOKEN_COOKIE_MAX_AGE));

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      token: newAccessToken,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      message: msg.userMsg.tokenRefreshedSuccessfully,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* user signout */
const userSignout = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (incomingRefreshToken) {
      try {
        const decoded = jwt.verify(incomingRefreshToken, envConfig.REFRESH_TOKEN_SECRET);
        await User.findByIdAndUpdate(decoded.userid, { refreshToken: null });
      } catch {
        // Token might already be invalid, proceed to clear cookies
      }
    } else if (req.user?.userid) {
      await User.findByIdAndUpdate(req.user.userid, { refreshToken: null });
    }

    // Blacklist access token in Redis
    const tokenToRevoke = req.rawToken || req.cookies?.accessToken || req.cookies?.authToken;
    if (tokenToRevoke) {
      await security.blacklistToken(tokenToRevoke, 900);
    }

    const clearOptions = getCookieOptions();
    res.clearCookie('accessToken', clearOptions);
    res.clearCookie('authToken', clearOptions);
    res.clearCookie('refreshToken', clearOptions);

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: msg.userMsg.userLogoutSuccessfully,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

module.exports = {
  userSignup,
  userSignin,
  refreshAccessToken,
  userSignout,
};
