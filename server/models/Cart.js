const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  productId: {
    type: String,
    required: false
  },
  selectedOptions: {
    type: Map,
    of: String,
    required: false
  }
}, { _id: true });

const pickupSlotSchema = new mongoose.Schema({
  date: { type: Date },
  timeWindow: { type: String, trim: true },
  address: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  pincode: { type: String, trim: true, default: '' },
  landmark: { type: String, trim: true, default: '' }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true,
    default: null
  },
  sessionId: {
    type: String,
    index: true,
    sparse: true,
    trim: true
  },
  items: [cartItemSchema],
  couponCode: {
    type: String,
    uppercase: true,
    trim: true,
    default: null
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  walletApplied: {
    type: Number,
    default: 0,
    min: 0
  },
  subscriptionCovered: {
    type: Number,
    default: 0,
    min: 0
  },
  subscriptionCoverage: {
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
    breakdown: [{
      _id: false,
      productId: String,
      description: String,
      appliedQuantity: Number,
      valuePerUnit: Number,
      totalValue: Number
    }],
    computedAt: { type: Date, default: null }
  },
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  pickupSlot: {
    type: pickupSlotSchema,
    default: () => ({})
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
});

cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

cartSchema.methods.recomputeTotals = function () {
  const subtotal = this.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  this.subtotal = subtotal;
  const afterSubCover = Math.max(0, subtotal - (this.subscriptionCovered || 0));
  const afterDiscount = Math.max(0, afterSubCover - (this.discountAmount || 0));
  this.total = Math.max(0, afterDiscount - (this.walletApplied || 0));
  this.updatedAt = new Date();
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return this;
};

module.exports = mongoose.model('Cart', cartSchema);
