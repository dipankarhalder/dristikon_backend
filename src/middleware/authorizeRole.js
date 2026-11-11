const { StatusCodes } = require('http-status-codes');

/**
 * Middleware to enforce role-based access control (RBAC).
 * Expects `req.user` to be populated by verifyAuthToken.
 *
 * @param  {...string} allowedRoles Roles authorized to access the route
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
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

    next();
  };
};

module.exports = authorizeRole;
