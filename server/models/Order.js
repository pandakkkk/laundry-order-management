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
  },
  notes: {
    type: String,
    default: ''
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
    required: false,
    index: true,
    default: ''
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
    required: false
  },
  servedBy: {
    type: String,
    required: false,
    default: ''
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  discount: {
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    amount: { type: Number, default: 0 },
    reason: { type: String, default: '' }
  },
  finalAmount: {
    type: Number,
    default: 0
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
      'Booking Confirmed',   // Order just created
      'Received in Workshop', // Order physically received at workshop after pickup
      'Tag Printed',        // Garment tags printed/attached
      'Ready for Processing', // Tagged and ready for operations to process
      'Ready for Pickup',   // Ready to collect clothes FROM customer
      'Pickup In Progress', // Delivery boy going to collect from customer
      'Sorting',
      'Spotting',
      'Washing',
      'Dry Cleaning',
      'Drying',
      'Ironing',
      'Quality Check',
      'Packing',
      'Ready for Delivery', // Washed clothes in rack, ready to deliver TO customer
      'Out for Delivery',   // Delivery boy on the way
      'Delivered',          // Delivered to customer
      'Return',
      'Refund',
      'Cancelled'
    ],
    default: 'Booking Confirmed'
  },
  location: {
    type: String,
    default: ''
  },
  rackNumber: {
    type: String,
    default: ''
  },
  rackAssignedAt: {
    type: Date,
    default: null
  },
  rackAssignedBy: {
    type: String,
    default: ''
  },
  packedAt: {
    type: Date,
    default: null
  },
  packedBy: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    enum: ['store', 'website'],
    default: 'store'
  },
  orderType: {
    type: String,
    enum: ['retail', 'b2b'],
    default: 'retail'
  },
  // Delivery assignment fields
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedToName: {
    type: String,
    default: ''
  },
  assignedAt: {
    type: Date,
    default: null
  },
  // B2B: Staff assignment (Manager assigns to Staff)
  assignedToStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedToStaffName: {
    type: String,
    default: ''
  },
  assignedToStaffAt: {
    type: Date,
    default: null
  },
  // Delivery tracking
  pickedUpAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  deliveredTo: {
    type: String,
    default: ''
  },
  deliveryNotes: {
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
orderSchema.index({ assignedTo: 1, status: 1 });
orderSchema.index({ customerName: 'text', phoneNumber: 'text', ticketNumber: 'text' });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

