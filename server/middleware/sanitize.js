/**
 * NoSQL Injection Protection & Input Sanitizer Middleware
 * Strips MongoDB operator keys starting with '$' or containing '.' from inputs.
 */

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const cleaned = {};
  for (const key of Object.keys(obj)) {
    // Strip keys starting with $ or containing .
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    const val = obj[key];
    cleaned[key] = typeof val === 'object' && val !== null ? sanitizeObject(val) : val;
  }
  return cleaned;
}

const mongoSanitize = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

module.exports = mongoSanitize;
