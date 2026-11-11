import { Request, Response, NextFunction, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Validates that specified route parameters match the 24-character hex MongoDB ObjectId format.
 * @param paramNames Array of route parameter names to validate (defaults to ['id'])
 */
export const validateObjectId = (paramNames: string[] | string = ['id']): RequestHandler => {
  const names = Array.isArray(paramNames) ? paramNames : [paramNames];

  return (req: Request, res: Response, next: NextFunction) => {
    for (const name of names) {
      const value = req.params[name];
      if (value !== undefined) {
        const strVal = typeof value === 'string' ? value : '';
        if (!strVal || !OBJECT_ID_REGEX.test(strVal)) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            status: StatusCodes.BAD_REQUEST,
            message: `Invalid ID parameter '${name}'. Must be a valid 24-character hexadecimal string.`,
          });
        }
      }
    }
    return next();
  };
};

export default validateObjectId;
