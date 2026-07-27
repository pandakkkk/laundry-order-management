const mongoose = require('mongoose');

const remainingQuotaSchema = new mongoose.Schema({
  productId: { type: String },
  description: { type: String },
  quantity: { type: Number, default: 0 }
}, { _id: false });

const subscriptionSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  planSnapshot: {
    // Copy at time of subscribe so plan edits don't retroactively change existing subs.
    slug: { type: String },
    name: { type: String },
    price: { type: Number },
    pickupsPerMonth: { type: Number },
    includedItems: { type: Array, default: [] }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'paused', 'cancelled'],
    default: 'pending',
    index: true
  },
  startedAt: { type: Date, default: null },
  currentPeriodStart: { type: Date, default: null },
  currentPeriodEnd: { type: Date, default: null },
  nextBillingDate: { type: Date, default: null, index: true },
  nextPickupDate: { type: Date, default: null },
  remainingQuota: {
    type: [remainingQuotaSchema],
    default: []
  },
  pausedUntil: { type: Date, default: null },
  lastPaidAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  lastBillingReminderAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

subscriptionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// One active/pending subscription per customer at a time.
subscriptionSchema.index(
  { customerId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'active', 'paused'] } } }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
