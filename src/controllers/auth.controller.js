const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { envConfig } = require('../config');
const { msg } = require('../constant');
const { authValidate } = require('../validation');
const { validateFields, sendErrorResponse } = require('../utils');

const ACCESS_TOKEN_COOKIE_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/* user signup */
const userSignup = async (req, res) => {
  try {
    const { error, value } = authValidate.userInfoSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return validateFields(res, error.details.map((detail) => detail.message).join(', '));
    }
    const existingEmail = await User.findOne({ email: value.email });
    if (existingEmail) {
      return validateFields(res, msg.userMsg.emailAlreadyExist);
    }
    const user = new User({
      name: value.name,
      email: value.email,
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
    const user = await User.findOne({ email: value.email });
    if (!user) {
      return validateFields(res, msg.userMsg.existUserEmail);
    }
    const isMatch = await user.comparePassword(value.password);
    if (!isMatch) {
      return validateFields(res, msg.userMsg.userWrongPassword);
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Persist refresh token in database for validation/revocation
    user.refreshToken = refreshToken;
    await user.save();

    // Set secure HTTP-only cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: envConfig.NODEENV,
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
    });
    res.cookie('authToken', accessToken, {
      httpOnly: true,
      secure: envConfig.NODEENV,
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: envConfig.NODEENV,
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });

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
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: msg.userMsg.refreshTokenRequired,
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(incomingRefreshToken, envConfig.REFRESH_TOKEN_SECRET);
    } catch (err) {
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

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: envConfig.NODEENV,
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
    });
    res.cookie('authToken', newAccessToken, {
      httpOnly: true,
      secure: envConfig.NODEENV,
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
    });
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: envConfig.NODEENV,
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });

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
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (incomingRefreshToken) {
      try {
        const decoded = jwt.verify(incomingRefreshToken, envConfig.REFRESH_TOKEN_SECRET);
        await User.findByIdAndUpdate(decoded.userid, { refreshToken: null });
      } catch (err) {
        // Token might already be invalid, proceed to clear cookies
      }
    } else if (req.user?.userid) {
      await User.findByIdAndUpdate(req.user.userid, { refreshToken: null });
    }

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: envConfig.NODEENV,
    });
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: envConfig.NODEENV,
      sameSite: 'Strict',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: envConfig.NODEENV,
    });

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
