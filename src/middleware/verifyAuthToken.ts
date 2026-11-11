import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { envConfig } from '../config';
import { msg } from '../constant';
import { isTokenBlacklisted } from '../utils/security';
import { AuthenticatedRequest, AuthUserPayload } from '../types';

export interface ExtendedAuthRequest extends AuthenticatedRequest {
  rawToken?: string;
}

export const verifyToken = async (req: ExtendedAuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    let token: string | null = null;

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

    let decoded: AuthUserPayload;
    try {
      decoded = jwt.verify(token, envConfig.ACCESS_TOKEN_SECRET) as AuthUserPayload;
    } catch (err) {
      // Fallback check against legacy JWTSECRET if different
      if (envConfig.JWTSECRET && envConfig.JWTSECRET !== envConfig.ACCESS_TOKEN_SECRET) {
        decoded = jwt.verify(token, envConfig.JWTSECRET) as AuthUserPayload;
      } else {
        throw err;
      }
    }

    req.user = decoded;
    req.rawToken = token;
    return next();
  } catch (error) {
    const err = error as Error;
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: StatusCodes.UNAUTHORIZED,
      message: msg.userMsg.invalidToken,
      error: envConfig.NODEENV ? undefined : err.message,
    });
  }
};

export default verifyToken;
