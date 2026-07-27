const Lead = require('../models/Lead');
const notificationService = require('../services/notificationService');
const { normalizeIndianPhone, isValidIndianPhone } = require('../utils/phoneUtils');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseUtils');

const VALID_TYPES = ['callback', 'pickup', 'booking', 'b2b_quote', 'franchise', 'contact', 'other'];

// POST /api/leads  (public, rate-limited, requires public API key)
exports.create = async (req, res) => {
  try {
    const type = String(req.body?.type || '').toLowerCase();
    if (!VALID_TYPES.includes(type)) {
      return sendError(res, 'Invalid lead type', 400);
    }

    const rawPhone = req.body?.phoneNumber || req.body?.phone;
    if (!isValidIndianPhone(rawPhone)) {
      return sendError(res, 'Valid phone number required', 400);
    }
    const phoneNumber = normalizeIndianPhone(rawPhone);

    const lead = await Lead.create({
      type,
      name: (req.body?.name || '').trim(),
      phoneNumber,
      email: (req.body?.email || '').trim(),
      address: (req.body?.address || '').trim(),
      city: (req.body?.city || '').trim(),
      pincode: (req.body?.pincode || '').trim(),
      message: (req.body?.message || '').trim(),
      source: req.body?.source || 'website',
      payload: req.body?.payload || null
    });

    // Notify staff via WhatsApp/SMS to the business number.
    const staffPhone = process.env.LEAD_ALERT_NUMBER || process.env.GUPSHUP_SOURCE_NUMBER;
    if (staffPhone) {
      const summary = `New ${type} lead from ${lead.name || 'unknown'} (+${lead.phoneNumber}). ${lead.message || ''}`.slice(0, 300);
      notificationService.sendNotification('whatsapp', staffPhone, summary)
        .catch((err) => console.error('lead alert failed:', err.message));
    }

    return sendSuccess(res, { id: lead._id }, 201);
  } catch (error) {
    console.error('lead create error:', error);
    return sendError(res, 'Failed to submit', 500);
  }
};

// GET /api/leads  (staff protect) — filter by type/status
exports.list = async (req, res) => {
  try {
    const query = {};
    if (req.query.type) query.type = req.query.type;
    if (req.query.status) query.status = req.query.status;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const [leads, total] = await Promise.all([
      Lead.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Lead.countDocuments(query)
    ]);
    return sendPaginated(res, leads, { total, page, limit });
  } catch (error) {
    console.error('lead list error:', error);
    return sendError(res, 'Failed to list leads', 500);
  }
};

// PATCH /api/leads/:id  (staff protect) — mark as contacted/converted/closed
exports.update = async (req, res) => {
  try {
    const patch = {};
    if (req.body?.status) patch.status = req.body.status;
    if (req.body?.status && req.body.status !== 'new') {
      patch.handledAt = new Date();
      patch.handledBy = req.user?.name || req.user?.email || 'staff';
    }
    const lead = await Lead.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!lead) return sendError(res, 'Not found', 404);
    return sendSuccess(res, lead);
  } catch (error) {
    return sendError(res, 'Failed to update lead', 500);
  }
};
