/**
 * Structured Logger Module
 * Standardizes log formatting for server operations, security audits, and error reporting.
 */

const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...meta
  });
};

const logger = {
  info: (message, meta) => {
    if (process.env.NODE_ENV === 'production') {
      console.log(formatLog('info', message, meta));
    } else {
      console.log(`ℹ️ [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },
  warn: (message, meta) => {
    if (process.env.NODE_ENV === 'production') {
      console.warn(formatLog('warn', message, meta));
    } else {
      console.warn(`⚠️ [WARN] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },
  error: (message, meta) => {
    if (process.env.NODE_ENV === 'production') {
      console.error(formatLog('error', message, meta));
    } else {
      console.error(`❌ [ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  }
};

module.exports = logger;
