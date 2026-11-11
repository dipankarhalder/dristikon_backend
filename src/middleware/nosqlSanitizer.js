/**
 * Recursive sanitizer that strips MongoDB operator injection keys ($ or .)
 * from objects, arrays, and query/body structures.
 */
const sanitizeInput = (target) => {
  if (!target || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      target[i] = sanitizeInput(target[i]);
    }
    return target;
  }

  for (const key of Object.keys(target)) {
    // Strip keys starting with '$' (e.g. $gt, $where, $ne) or containing '.' (nested path injection)
    if (key.startsWith('$') || key.includes('.')) {
      delete target[key];
    } else {
      target[key] = sanitizeInput(target[key]);
    }
  }

  return target;
};

/**
 * Express middleware to sanitize body, query, and params against NoSQL injections
 */
const nosqlSanitizer = (req, res, next) => {
  if (req.body) {
    sanitizeInput(req.body);
  }
  if (req.query) {
    sanitizeInput(req.query);
  }
  if (req.params) {
    sanitizeInput(req.params);
  }
  next();
};

module.exports = {
  nosqlSanitizer,
  sanitizeInput,
};
