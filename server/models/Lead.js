const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['callback', 'pickup', 'booking', 'b2b_quote', 'franchise', 'contact', 'other'],
    required: true,
    index: true
  },
  name: { type: String, trim: true, default: '' },
  phoneNumber: { type: String, trim: true, index: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  address: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  pincode: { type: String, trim: true, default: '' },
  message: { type: String, trim: true, default: '' },
  source: { type: String, default: 'website' },
  payload: { type: mongoose.Schema.Types.Mixed, default: null }, // Free-form for form-specific fields
  status: {
    type: String,
    enum: ['new', 'contacted', 'converted', 'closed'],
    default: 'new',
    index: true
  },
  handledBy: { type: String, default: '' },
  handledAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Lead', leadSchema);
