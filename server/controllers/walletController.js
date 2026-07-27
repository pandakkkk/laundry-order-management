const walletService = require('../services/walletService');
const razorpayService = require('../services/razorpayService');
const PaymentAttempt = require('../models/PaymentAttempt');

// GET /api/wallet  — balance + recent 10 transactions
exports.summary = async (req, res) => {
  try {
    const [balance, history] = await Promise.all([
      walletService.getBalance(req.customer._id),
      walletService.listHistory(req.customer._id, { limit: 10 })
    ]);
    return res.json({ success: true, balance, transactions: history });
  } catch (error) {
    console.error('wallet summary error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load wallet' });
  }
};

// GET /api/wallet/history?limit=&before=
exports.history = async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const history = await walletService.listHistory(req.customer._id, {
      limit,
      before: req.query.before || null
    });
    return res.json({ success: true, transactions: history });
  } catch (error) {
    console.error('wallet history error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load history' });
  }
};

// POST /api/wallet/topup/initiate { amount }
exports.topupInitiate = async (req, res) => {
  try {
    const amount = Math.floor(Number(req.body?.amount || 0));
    if (!Number.isFinite(amount) || amount < 100) {
      return res.status(400).json({ success: false, error: 'Minimum topup is ₹100' });
    }
    if (amount > 50000) {
      return res.status(400).json({ success: false, error: 'Maximum topup is ₹50,000' });
    }

    if (!razorpayService.isConfigured()) {
      return res.status(500).json({ success: false, error: 'Payment gateway not configured' });
    }

    const amountPaise = amount * 100;
    const rzpOrder = await razorpayService.createOrder({
      amountPaise,
      receipt: `wallet:${req.customer._id}`,
      notes: { purpose: 'wallet_topup', customerId: String(req.customer._id) }
    });

    const attempt = await PaymentAttempt.create({
      customerId: req.customer._id,
      razorpayOrderId: rzpOrder.id,
      amount: amountPaise,
      method: 'razorpay',
      purpose: 'wallet_topup',
      status: 'created',
      idempotencyKey: `rzp:${rzpOrder.id}`
    });

    return res.json({
      success: true,
      attemptId: attempt._id,
      razorpayOrderId: rzpOrder.id,
      razorpayKeyId: razorpayService.getKeys().keyId,
      amount: amountPaise,
      currency: 'INR',
      customerName: req.customer.name || 'Customer',
      customerPhone: req.customer.phoneNumber
    });
  } catch (error) {
    console.error('topupInitiate error:', error);
    return res.status(500).json({ success: false, error: 'Failed to initiate topup' });
  }
};

// POST /api/wallet/topup/confirm { razorpayOrderId, razorpayPaymentId, razorpaySignature }
// Client callback path — webhook is the ultimate source of truth.
exports.topupConfirm = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};
    const attempt = await PaymentAttempt.findOne({ razorpayOrderId });
    if (!attempt) return res.status(404).json({ success: false, error: 'Attempt not found' });
    if (attempt.purpose !== 'wallet_topup') {
      return res.status(400).json({ success: false, error: 'Not a wallet topup' });
    }
    if (String(attempt.customerId) !== String(req.customer._id)) {
      return res.status(403).json({ success: false, error: 'Not your topup' });
    }

    const ok = razorpayService.verifyClientSignature({
      razorpayOrderId,
      razorpayPaymentId,
      signature: razorpaySignature
    });
    if (!ok) {
      attempt.status = 'failed';
      attempt.failureReason = 'signature_mismatch';
      await attempt.save();
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    attempt.razorpayPaymentId = razorpayPaymentId;
    attempt.razorpaySignature = razorpaySignature;
    if (attempt.status !== 'captured') attempt.status = 'captured';
    await attempt.save();

    const amountRupees = Math.floor(attempt.amount / 100);
    await walletService.credit({
      customerId: attempt.customerId,
      amount: amountRupees,
      source: 'topup',
      referenceType: 'PaymentAttempt',
      referenceId: attempt._id,
      notes: `Topup ₹${amountRupees}`
    });

    const balance = await walletService.getBalance(req.customer._id);
    return res.json({ success: true, balance, credited: amountRupees });
  } catch (error) {
    console.error('topupConfirm error:', error);
    return res.status(500).json({ success: false, error: 'Failed to confirm topup' });
  }
};
