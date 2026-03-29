const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['combination', 'household', 'upper_body', 'lower_body', 'others', 'b2b_business']
  },
  basePrice: {
    type: Number,
    required: true,
    default: 0
  },
  hasOptions: {
    type: Boolean,
    default: false
  },
  options: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    default: ''
  }
});

// Update timestamp on save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
