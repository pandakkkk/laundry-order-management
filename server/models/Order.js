const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  price: {
    type: Number,
    required: true
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
});

const orderSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  orderDate: {
    type: Date,
    required: true
  },
  expectedDelivery: {
    type: Date,
    required: true
  },
  servedBy: {
    type: String,
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Online'],
    default: 'Cash'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Partial'],
    default: 'Pending'
  },
  status: {
    type: String,
    enum: [
      'Received',
      'Sorting',
      'Spotting',
      'Washing',
      'Dry Cleaning',
      'Drying',
      'Ironing',
      'Quality Check',
      'Packing',
      'Ready for Pickup',
      'Out for Delivery',
      'Delivered',
      'Return',
      'Refund',
      'Cancelled'
    ],
    default: 'Received'
  },
  location: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
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
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
orderSchema.index({ status: 1, orderDate: -1 });
orderSchema.index({ customerName: 'text', phoneNumber: 'text', ticketNumber: 'text', customerId: 'text' });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

