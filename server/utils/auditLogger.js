const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

async function logAudit({ req, action, resource, resourceId, details = {} }) {
  try {
    const userId = req?.user?._id || null;
    const userRole = req?.user?.role || 'anonymous';
    const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '';

    await AuditLog.create({
      userId,
      userRole,
      action,
      resource,
      resourceId,
      details,
      ipAddress
    });

    logger.info(`[AUDIT] Action: ${action} | Resource: ${resource}:${resourceId || 'N/A'} | User: ${userId || 'system'}`);
  } catch (err) {
    logger.error(`Failed to record audit log: ${err.message}`, { action, resource, resourceId });
  }
}

module.exports = { logAudit };
