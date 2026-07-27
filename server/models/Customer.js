const mongoose = require('mongoose');
const crypto = require('crypto');

function generateReferralCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

const customerSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  name: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true // Allows multiple null values
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  city: {
    type: String,
    trim: true,
    default: ''
  },
  state: {
    type: String,
    trim: true,
    default: ''
  },
  pincode: {
    type: String,
    trim: true,
    default: ''
  },
  customerId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  notes: {
    type: String,
    default: ''
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  lastOrderDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Blocked'],
    default: 'Active'
  },
  tags: [{
    type: String,
    trim: true
  }],
  authProvider: {
    type: String,
    enum: ['otp', 'password', 'staff_created'],
    default: 'staff_created'
  },
  passwordHash: {
    type: String,
    select: false
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true,
    default: generateReferralCode
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  referralBonusCredited: {
    type: Boolean,
    default: false
  },
  lastLoginAt: {
    type: Date
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

// Update timestamp on save
customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for text search
customerSchema.index({ 
  name: 'text', 
  phoneNumber: 'text', 
  email: 'text', 
  address: 'text',
  city: 'text'
});

// Virtual for full address
customerSchema.virtual('fullAddress').get(function() {
  const parts = [this.address, this.city, this.state, this.pincode].filter(Boolean);
  return parts.join(', ');
});

// Method to increment order count
customerSchema.methods.incrementOrderCount = function(amount) {
  this.totalOrders += 1;
  this.totalSpent += amount;
  this.lastOrderDate = new Date();
  return this.save();
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;

