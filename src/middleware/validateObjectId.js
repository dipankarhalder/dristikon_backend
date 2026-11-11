const { StatusCodes } = require('http-status-codes');

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Validates that specified route parameters match the 24-character hex MongoDB ObjectId format.
 * @param {string[]} paramNames Array of route parameter names to validate (defaults to ['id'])
 */
const validateObjectId = (paramNames = ['id']) => {
  const names = Array.isArray(paramNames) ? paramNames : [paramNames];

  return (req, res, next) => {
    for (const name of names) {
      const value = req.params[name];
      if (value !== undefined) {
        if (!OBJECT_ID_REGEX.test(value)) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            status: StatusCodes.BAD_REQUEST,
            message: `Invalid ID parameter '${name}'. Must be a valid 24-character hexadecimal string.`,
          });
        }
      }
    }
    next();
  };
};

module.exports = validateObjectId;
