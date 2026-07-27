/**
 * Centralized API Response Builders (DRY Principle)
 * Standardizes success, error, and paginated JSON response contracts.
 */

function sendSuccess(res, data, status = 200, meta = {}) {
  return res.status(status).json({
    success: true,
    data,
    ...meta
  });
}

function sendError(res, message, status = 400, details = null) {
  const payload = {
    success: false,
    error: message
  };
  if (details) payload.details = details;
  return res.status(status).json(payload);
}

function sendPaginated(res, data, { total, page, limit }) {
  return res.status(200).json({
    success: true,
    count: data.length,
    data,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated
};
