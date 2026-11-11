const { StatusCodes } = require('http-status-codes');
const { msg } = require('../constant');
const { envConfig } = require('../config');
const pagination = require('./pagination');
const cache = require('./cache');
const logger = require('./logger');
const security = require('./security');

const sendErrorResponse = (res, error) => {
  logger.error('Unhandled Controller Error:', { error: error.message, stack: error.stack });

  // Map Mongoose CastError (e.g. invalid ObjectId) directly to 400 Bad Request
  if (error.name === 'CastError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      message: `Invalid identifier provided for path '${error.path}'.`,
    });
  }

  // Map Mongoose Schema ValidationError to 400 Bad Request
  if (error.name === 'ValidationError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      message: error.message,
    });
  }

  // Prevent Information Disclosure in production
  const isProd = envConfig.NODEENV;
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    message: msg.appMsg.somethingWrong,
    error: isProd ? undefined : error.message,
  });
};

const validateFields = (res, messages) => {
  return res.status(StatusCodes.BAD_REQUEST).json({
    status: StatusCodes.BAD_REQUEST,
    message: messages,
  });
};

const notFoundItem = (res, messages) => {
  return res.status(StatusCodes.NOT_FOUND).json({
    status: StatusCodes.NOT_FOUND,
    message: messages,
  });
};

module.exports = {
  sendErrorResponse,
  validateFields,
  notFoundItem,
  pagination,
  cache,
  logger,
  security,
};
