import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthenticatedRequest, UserRole } from '../types';

/**
 * Middleware to enforce role-based access control (RBAC).
 * Expects `req.user` to be populated by verifyAuthToken.
 *
 * @param allowedRoles Roles authorized to access the route
 */
export const authorizeRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: 'Authentication required to access this resource.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        status: StatusCodes.FORBIDDEN,
        message: `Forbidden: role '${req.user.role}' is not authorized. Required: [${allowedRoles.join(', ')}].`,
      });
    }

    return next();
  };
};

export default authorizeRole;
