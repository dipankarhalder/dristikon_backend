import { Request, Response, NextFunction } from 'express';

/**
 * Recursive sanitizer that strips MongoDB operator injection keys ($ or .)
 * from objects, arrays, and query/body structures.
 */
export const sanitizeInput = <T>(target: T): T => {
  if (!target || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      target[i] = sanitizeInput(target[i]);
    }
    return target;
  }

  const obj = target as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    // Strip keys starting with '$' (e.g. $gt, $where, $ne) or containing '.' (nested path injection)
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else {
      obj[key] = sanitizeInput(obj[key]);
    }
  }

  return target;
};

/**
 * Express middleware to sanitize body, query, and params against NoSQL injections
 */
export const nosqlSanitizer = (req: Request, _res: Response, next: NextFunction): void => {
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

export default {
  nosqlSanitizer,
  sanitizeInput,
};
