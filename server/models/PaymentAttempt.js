const mongoose = require('mongoose');

// Amount is stored in paise (Razorpay convention). Never floats.
const paymentAttemptSchema = new mongoose.Schema({
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
    index: true
  },
  razorpayOrderId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  razorpayPaymentId: {
    type: String,
    default: null,
    index: true
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  method: {
    type: String,
    enum: ['razorpay', 'cod'],
    required: true
  },
  purpose: {
    type: String,
    enum: ['order', 'wallet_topup', 'subscription_billing'],
    default: 'order',
    index: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: ['created', 'authorized', 'captured', 'failed', 'refunded', 'cancelled'],
    default: 'created',
    index: true
  },
  failureReason: {
    type: String,
    default: null
  },
  webhookEvents: [{
    eventId: { type: String, required: true },
    event: { type: String },
    receivedAt: { type: Date, default: Date.now }
  }],
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true
  },
  notes: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

paymentAttemptSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

paymentAttemptSchema.methods.hasEvent = function (eventId) {
  return this.webhookEvents.some((e) => e.eventId === eventId);
};

module.exports = mongoose.model('PaymentAttempt', paymentAttemptSchema);
