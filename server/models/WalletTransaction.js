const mongoose = require('mongoose');

// Append-only ledger. Never mutate past entries.
// Balance for a customer = sum(credits) - sum(debits).
const walletTransactionSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  source: {
    type: String,
    enum: [
      'topup',
      'refund',
      'order_payment',
      'referral_bonus',
      'signup_bonus',
      'admin_adjustment'
    ],
    required: true
  },
  referenceType: {
    type: String,
    enum: ['Order', 'PaymentAttempt', 'Customer', 'Manual'],
    default: 'Manual'
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// A single (source, referenceId) pair should map to at most one credit or debit — used for
// idempotency: refund on the same order id, or topup for the same payment attempt id.
walletTransactionSchema.index(
  { customerId: 1, source: 1, referenceId: 1, type: 1 },
  { unique: true, partialFilterExpression: { referenceId: { $type: 'objectId' } } }
);

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
