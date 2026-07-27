const mongoose = require('mongoose');

const includedItemSchema = new mongoose.Schema({
  productId: { type: String },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

const subscriptionPlanSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  billingCycle: {
    type: String,
    enum: ['monthly'],
    default: 'monthly'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  pickupsPerMonth: {
    type: Number,
    default: 2,
    min: 1
  },
  includedItems: {
    type: [includedItemSchema],
    default: []
  },
  features: {
    type: [String],
    default: []
  },
  carryForwardAllowed: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

subscriptionPlanSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
