const mongoose = require('mongoose');

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
    required: true,
    trim: true
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
  customerId: 'text',
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

