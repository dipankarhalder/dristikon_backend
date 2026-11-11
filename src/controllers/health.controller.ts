import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { msg } from '../constant';
import { sendErrorResponse } from '../utils';

export const getHealth = async (_req: Request, res: Response): Promise<Response> => {
  try {
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      msg: msg.healthCheck.successMsg,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

export default {
  getHealth,
};
