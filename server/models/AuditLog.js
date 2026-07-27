const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userRole: {
    type: String,
    default: 'system'
  },
  action: {
    type: String,
    required: true, // e.g., 'ORDER_CANCELLED', 'REFUND_ISSUED', 'PRICE_UPDATED'
    index: true
  },
  resource: {
    type: String,
    required: true // e.g., 'Order', 'Customer', 'User'
  },
  resourceId: {
    type: String,
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 90 * 24 * 60 * 60 // Auto-expire after 90 days
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
