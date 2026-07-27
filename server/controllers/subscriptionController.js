const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const PaymentAttempt = require('../models/PaymentAttempt');
const subscriptionService = require('../services/subscriptionService');
const razorpayService = require('../services/razorpayService');

// GET /api/subscriptions/plans  (public)
exports.listPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
    return res.json({ success: true, data: plans });
  } catch (error) {
    console.error('listPlans error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list plans' });
  }
};

// POST /api/subscriptions/subscribe  { planSlug }
exports.subscribe = async (req, res) => {
  try {
    const planSlug = String(req.body?.planSlug || '').toLowerCase().trim();
    if (!planSlug) return res.status(400).json({ success: false, error: 'planSlug required' });

    const { subscription, attempt } = await subscriptionService.subscribe({
      customer: req.customer,
      planSlug
    });

    return res.json({
      success: true,
      subscriptionId: subscription._id,
      attemptId: attempt.attempt._id,
      razorpayOrderId: attempt.attempt.razorpayOrderId,
      razorpayKeyId: razorpayService.getKeys().keyId,
      amount: attempt.attempt.amount,
      currency: 'INR',
      customerName: req.customer.name || 'Customer',
      customerPhone: req.customer.phoneNumber
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, error: error.message });
    console.error('subscribe error:', error);
    return res.status(500).json({ success: false, error: 'Failed to subscribe' });
  }
};

// POST /api/subscriptions/confirm  { razorpayOrderId, razorpayPaymentId, razorpaySignature }
exports.confirm = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};
    const attempt = await PaymentAttempt.findOne({ razorpayOrderId });
    if (!attempt) return res.status(404).json({ success: false, error: 'Attempt not found' });
    if (attempt.purpose !== 'subscription_billing') {
      return res.status(400).json({ success: false, error: 'Not a subscription payment' });
    }
    if (String(attempt.customerId) !== String(req.customer._id)) {
      return res.status(403).json({ success: false, error: 'Not your subscription' });
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

    const subscription = await Subscription.findById(attempt.subscriptionId);
    if (!subscription) return res.status(404).json({ success: false, error: 'Subscription missing' });
    await subscriptionService.recordPayment({ subscription, attempt });
    return res.json({ success: true, subscription });
  } catch (error) {
    console.error('subscription confirm error:', error);
    return res.status(500).json({ success: false, error: 'Failed to confirm subscription' });
  }
};

// GET /api/subscriptions/mine
exports.mine = async (req, res) => {
  try {
    const subs = await Subscription.find({ customerId: req.customer._id }).sort({ createdAt: -1 });
    return res.json({ success: true, data: subs });
  } catch (error) {
    console.error('mine subs error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load subscriptions' });
  }
};

async function loadOwnedSubscription(req) {
  const sub = await Subscription.findById(req.params.id);
  if (!sub) return { error: { status: 404, message: 'Not found' } };
  if (String(sub.customerId) !== String(req.customer._id)) {
    return { error: { status: 403, message: 'Not your subscription' } };
  }
  return { sub };
}

exports.pause = async (req, res) => {
  const { sub, error } = await loadOwnedSubscription(req);
  if (error) return res.status(error.status).json({ success: false, error: error.message });
  try {
    await subscriptionService.pause({ subscription: sub, resumeAt: req.body?.resumeAt });
    return res.json({ success: true, subscription: sub });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    return res.status(500).json({ success: false, error: 'Failed to pause' });
  }
};

exports.resume = async (req, res) => {
  const { sub, error } = await loadOwnedSubscription(req);
  if (error) return res.status(error.status).json({ success: false, error: error.message });
  try {
    await subscriptionService.resume({ subscription: sub });
    return res.json({ success: true, subscription: sub });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    return res.status(500).json({ success: false, error: 'Failed to resume' });
  }
};

exports.cancel = async (req, res) => {
  const { sub, error } = await loadOwnedSubscription(req);
  if (error) return res.status(error.status).json({ success: false, error: error.message });
  try {
    await subscriptionService.cancel({ subscription: sub });
    return res.json({ success: true, subscription: sub });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to cancel' });
  }
};

// Admin: POST /api/subscriptions/plans
exports.createPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.create({
      ...req.body,
      slug: String(req.body.slug || '').toLowerCase().trim()
    });
    return res.status(201).json({ success: true, data: plan });
  } catch (error) {
    console.error('createPlan error:', error);
    return res.status(400).json({ success: false, error: error.message });
  }
};

// Admin: GET /api/subscriptions/admin/list?status=&search=&limit=&page=
exports.adminList = async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status && req.query.status !== 'all') query.status = req.query.status;

    if (req.query.search) {
      const Customer = require('../models/Customer');
      const rx = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const customers = await Customer.find({
        $or: [{ name: rx }, { phoneNumber: rx }, { email: rx }]
      }).select('_id').limit(50).lean();
      query.customerId = { $in: customers.map((c) => c._id) };
    }

    const [subs, total] = await Promise.all([
      Subscription.find(query)
        .populate('customerId', 'name phoneNumber email')
        .sort({ nextBillingDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(query)
    ]);

    return res.json({ success: true, data: subs, total, page, limit });
  } catch (error) {
    console.error('adminList subs error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load subscriptions' });
  }
};

// Admin: POST /api/subscriptions/admin/:id/pause|resume|cancel  (staff acts on customer's behalf)
async function adminMutate(req, res, action) {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, error: 'Not found' });
    if (action === 'pause') await subscriptionService.pause({ subscription: sub, resumeAt: req.body?.resumeAt });
    else if (action === 'resume') await subscriptionService.resume({ subscription: sub });
    else if (action === 'cancel') await subscriptionService.cancel({ subscription: sub });
    else return res.status(400).json({ success: false, error: 'Unknown action' });
    return res.json({ success: true, subscription: sub });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    console.error(`admin ${action} error:`, err);
    return res.status(500).json({ success: false, error: `Failed to ${action}` });
  }
}
exports.adminPause = (req, res) => adminMutate(req, res, 'pause');
exports.adminResume = (req, res) => adminMutate(req, res, 'resume');
exports.adminCancel = (req, res) => adminMutate(req, res, 'cancel');

exports.updatePlan = async (req, res) => {
  try {
    const update = { ...req.body };
    delete update.slug;
    const plan = await SubscriptionPlan.findOneAndUpdate(
      { slug: req.params.slug.toLowerCase() },
      update,
      { new: true }
    );
    if (!plan) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: plan });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};
