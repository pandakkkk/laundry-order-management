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
  pickupSchedule: {
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
  // Admin-applied ad-hoc discount (percentage + reason)
  discount: {
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    amount: { type: Number, default: 0 },
    reason: { type: String, default: '' }
  },
  finalAmount: {
    type: Number,
    default: 0
  },
  // Customer-commerce breakdown (populated when order created from Cart via /api/checkout)
  subtotalAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  walletApplied: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String,
    uppercase: true,
    trim: true,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Online', 'Wallet', 'COD', 'Razorpay', 'Subscription'],
    default: 'Cash'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Partial', 'Refunded'],
    default: 'Pending'
  },
  paymentAttemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentAttempt',
    default: null,
    index: true
  },
  razorpayOrderId: {
    type: String,
    default: null,
    index: true,
    sparse: true
  },
  customerRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
    index: true
  },
  pickupAddress: {
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    pincode: { type: String, default: '' },
    landmark: { type: String, default: '' },
    slotDate: { type: Date, default: null },
    slotWindow: { type: String, default: '' }
  },
  refundToWalletProcessed: {
    type: Boolean,
    default: false
  },
  razorpayRefundId: {
    type: String,
    default: null
  },
  razorpayRefundStatus: {
    type: String,
    enum: ['pending', 'processed', 'failed', null],
    default: null
  },
  razorpayRefundAmount: {
    type: Number,
    default: 0
  },
  refundToRazorpayProcessed: {
    type: Boolean,
    default: false
  },
  refundToRazorpayError: {
    type: String,
    default: null
  },
  codCollectedAt: {
    type: Date,
    default: null
  },
  codCollectedBy: {
    type: String,
    default: ''
  },
  subscriptionCovered: {
    type: Number,
    default: 0
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
    }]
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

// Refund flow. On Order status='Refund':
//   - Razorpay portion (order.totalAmount when method Razorpay/COD) → refund via Razorpay API
//   - Wallet portion (order.walletApplied) → credit back to wallet ledger
// Both are idempotent via processed flags. Runs on every save; short-circuits after completion.
orderSchema.post('save', async function (doc) {
  try {
    if (doc.status !== 'Refund') return;
    if (!doc.customerRef && doc.paymentMethod !== 'Razorpay') return;

    // ---- Wallet portion: credit back the wallet amount + anything paid via 'Wallet' method
    if (!doc.refundToWalletProcessed && doc.customerRef) {
      let walletCredit = 0;
      if (doc.paymentMethod === 'Wallet' || doc.paymentMethod === 'Subscription') {
        walletCredit = doc.totalAmount + (doc.walletApplied || 0);
      } else {
        walletCredit = doc.walletApplied || 0;
      }
      if (walletCredit > 0) {
        const walletService = require('../services/walletService');
        await walletService.credit({
          customerId: doc.customerRef,
          amount: walletCredit,
          source: 'refund',
          referenceType: 'Order',
          referenceId: doc._id,
          notes: `Refund for order ${doc.ticketNumber}`
        });
      }
      await doc.constructor.updateOne(
        { _id: doc._id },
        { $set: { refundToWalletProcessed: true } }
      );
      // Notify customer via email (best-effort)
      try {
        const Customer = require('./Customer');
        const emailService = require('../services/emailService');
        const cust = await Customer.findById(doc.customerRef);
        if (cust?.email) {
          const tpl = emailService.refundCredited({
            order: doc,
            walletAmount: walletCredit,
            razorpayAmount: doc.paymentMethod === 'Razorpay' ? Math.round(doc.totalAmount * 100) : 0
          });
          emailService.send({ to: cust.email, subject: tpl.subject, text: tpl.text })
            .catch((err) => console.error('refund email failed:', err.message));
        }
      } catch (e) { console.error('refund email lookup failed:', e.message); }
    }

    // ---- Razorpay portion: fire a real refund for what customer paid via gateway
    if (!doc.refundToRazorpayProcessed && doc.paymentMethod === 'Razorpay' && doc.paymentAttemptId) {
      const razorpayService = require('../services/razorpayService');
      const PaymentAttempt = require('./PaymentAttempt');
      const attempt = await PaymentAttempt.findById(doc.paymentAttemptId);

      if (!attempt?.razorpayPaymentId) {
        await doc.constructor.updateOne(
          { _id: doc._id },
          { $set: { refundToRazorpayError: 'no razorpay payment id on attempt' } }
        );
        return;
      }

      // Gateway received the customer's out-of-pocket portion (Order.totalAmount).
      const refundPaise = Math.round(doc.totalAmount * 100);
      if (refundPaise <= 0) {
        await doc.constructor.updateOne(
          { _id: doc._id },
          { $set: { refundToRazorpayProcessed: true } }
        );
        return;
      }

      try {
        const refund = await razorpayService.refund({
          paymentId: attempt.razorpayPaymentId,
          amountPaise: refundPaise,
          notes: { ticketNumber: doc.ticketNumber, orderId: String(doc._id) }
        });
        await doc.constructor.updateOne(
          { _id: doc._id },
          {
            $set: {
              refundToRazorpayProcessed: true,
              razorpayRefundId: refund.id,
              razorpayRefundStatus: refund.status || 'pending',
              razorpayRefundAmount: refundPaise,
              refundToRazorpayError: null
            }
          }
        );
        // Mirror onto the PaymentAttempt for audit trail
        attempt.status = 'refunded';
        await attempt.save();
      } catch (rzpErr) {
        console.error(`Razorpay refund failed for order ${doc._id}:`, rzpErr.message);
        await doc.constructor.updateOne(
          { _id: doc._id },
          { $set: { refundToRazorpayError: rzpErr.message || 'unknown razorpay error' } }
        );
      }
    }
  } catch (err) {
    console.error(`refund pipeline failed for order ${doc._id}:`, err);
  }
});

// Index for faster queries
orderSchema.index({ status: 1, orderDate: -1 });
orderSchema.index({ assignedTo: 1, status: 1 });
orderSchema.index({ customerName: 'text', phoneNumber: 'text', ticketNumber: 'text' });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

