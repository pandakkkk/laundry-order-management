const mongoose = require('mongoose');

const productOptionSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    default: 0
  }
});

const productOptionsSchema = new mongoose.Schema({
  gender: [productOptionSchema],
  color: [productOptionSchema],
  type: [productOptionSchema]
}, { _id: false });

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
    enum: ['combination', 'household', 'upper_body', 'lower_body', 'others']
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
    type: productOptionsSchema,
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
