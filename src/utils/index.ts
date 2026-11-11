import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { msg } from '../constant';
import { envConfig } from '../config';
import pagination from './pagination';
import cache from './cache';
import logger from './logger';
import security from './security';

export interface AppError extends Error {
  name: string;
  message: string;
  path?: string;
  stack?: string;
  status?: number;
}

export const sendErrorResponse = (res: Response, error: unknown): Response => {
  const err = error as AppError;
  logger.error('Unhandled Controller Error:', { error: err.message, stack: err.stack });

  // Map Mongoose CastError (e.g. invalid ObjectId) directly to 400 Bad Request
  if (err.name === 'CastError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      message: `Invalid identifier provided for path '${err.path}'.`,
    });
  }

  // Map Mongoose Schema ValidationError to 400 Bad Request
  if (err.name === 'ValidationError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      message: err.message,
    });
  }

  // Prevent Information Disclosure in production
  const isProd = envConfig.NODEENV;
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    message: msg.appMsg.somethingWrong,
    error: isProd ? undefined : err.message,
  });
};

export const validateFields = (res: Response, messages: string | string[]): Response => {
  return res.status(StatusCodes.BAD_REQUEST).json({
    status: StatusCodes.BAD_REQUEST,
    message: messages,
  });
};

export const notFoundItem = (res: Response, messages: string): Response => {
  return res.status(StatusCodes.NOT_FOUND).json({
    status: StatusCodes.NOT_FOUND,
    message: messages,
  });
};

export { pagination, cache, logger, security };
export default {
  sendErrorResponse,
  validateFields,
  notFoundItem,
  pagination,
  cache,
  logger,
  security,
};
