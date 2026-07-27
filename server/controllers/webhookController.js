const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Customer = require('../models/Customer');
const PaymentAttempt = require('../models/PaymentAttempt');
const Subscription = require('../models/Subscription');
const orderController = require('./orderController');
const razorpayService = require('../services/razorpayService');
const walletService = require('../services/walletService');
const couponService = require('../services/couponService');
const subscriptionService = require('../services/subscriptionService');

// POST /api/webhooks/razorpay
// Mounted with express.raw({ type: 'application/json' }) — req.body is a Buffer.
exports.razorpay = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body; // Buffer

  if (!Buffer.isBuffer(rawBody)) {
    console.error('Razorpay webhook: raw body missing');
    return res.status(400).json({ success: false, error: 'Invalid body' });
  }

  const ok = razorpayService.verifyWebhookSignature(rawBody, signature);
  if (!ok) {
    return res.status(401).json({ success: false, error: 'Invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ success: false, error: 'Malformed JSON' });
  }

  const eventId = req.headers['x-razorpay-event-id'] || payload.id;
  const eventType = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;
  const orderEntity = payload.payload?.order?.entity;

  const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
  if (!razorpayOrderId) {
    return res.status(200).json({ success: true, ignored: 'no order id' });
  }

  try {
    const attempt = await PaymentAttempt.findOne({ razorpayOrderId });
    if (!attempt) {
      // Unknown order — respond 200 so Razorpay doesn't retry a phantom.
      console.warn(`webhook: unknown razorpayOrderId ${razorpayOrderId}`);
      return res.status(200).json({ success: true, ignored: 'unknown attempt' });
    }

    if (eventId && attempt.hasEvent(eventId)) {
      return res.status(200).json({ success: true, deduped: true });
    }

    attempt.webhookEvents.push({ eventId: eventId || String(Date.now()), event: eventType });

    switch (eventType) {
      case 'payment.captured':
      case 'order.paid':
        if (paymentEntity?.id) attempt.razorpayPaymentId = paymentEntity.id;
        if (attempt.status !== 'captured') attempt.status = 'captured';
        await attempt.save();
        if (attempt.purpose === 'wallet_topup') {
          await ensureWalletTopupCredit(attempt);
        } else if (attempt.purpose === 'subscription_billing') {
          await ensureSubscriptionAdvanced(attempt);
        } else {
          await ensureOrder(attempt);
        }
        break;

      case 'payment.authorized':
        if (paymentEntity?.id) attempt.razorpayPaymentId = paymentEntity.id;
        if (attempt.status === 'created') attempt.status = 'authorized';
        await attempt.save();
        break;

      case 'payment.failed':
        attempt.status = 'failed';
        attempt.failureReason =
          paymentEntity?.error_description || paymentEntity?.error_code || 'unknown';
        await attempt.save();
        break;

      case 'refund.processed':
      case 'refund.created':
        attempt.status = 'refunded';
        await attempt.save();
        break;

      default:
        await attempt.save();
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('webhook processing error:', error);
    // 500 so Razorpay retries — the event is recorded before status changes so retry is safe.
    return res.status(500).json({ success: false });
  }
};

async function ensureOrder(attempt) {
  if (attempt.orderId) return;
  const cart = await Cart.findById(attempt.cartId);
  if (!cart) {
    console.warn(`ensureOrder: cart ${attempt.cartId} already consumed`);
    return;
  }

  // Same commit sequencing as the client-side confirm path.
  let couponIncremented = false;
  if (cart.couponCode) {
    const inc = await couponService.tryIncrementUsage(cart.couponCode);
    if (!inc) {
      console.error(`ensureOrder: coupon ${cart.couponCode} exhausted between initiate and webhook`);
      // Order proceeds without coupon so the customer isn't left un-fulfilled.
      cart.couponCode = null;
      cart.discountAmount = 0;
      cart.recomputeTotals();
    } else {
      couponIncremented = true;
    }
  }

  let subscriptionConsumed = null;
  const coverageBreakdown = cart.subscriptionCoverage?.breakdown || [];
  if (cart.subscriptionCovered > 0 && cart.subscriptionCoverage?.subscriptionId && coverageBreakdown.length) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await subscriptionService.consumeQuota({
          subscriptionId: cart.subscriptionCoverage.subscriptionId,
          breakdown: coverageBreakdown,
          session
        });
      });
      subscriptionConsumed = {
        subscriptionId: cart.subscriptionCoverage.subscriptionId,
        breakdown: coverageBreakdown
      };
    } catch (subErr) {
      if (couponIncremented) await couponService.decrementUsage(cart.couponCode);
      console.error(`ensureOrder quota consumption failed: ${subErr.message}`);
      // Proceed without coverage so customer's paid order still lands. Refund manually via admin.
      cart.subscriptionCovered = 0;
      cart.subscriptionCoverage = { subscriptionId: null, breakdown: [], computedAt: new Date() };
      cart.recomputeTotals();
    }
  }

  if (cart.walletApplied > 0 && attempt.customerId) {
    try {
      await walletService.debit({
        customerId: attempt.customerId,
        amount: cart.walletApplied,
        source: 'order_payment',
        referenceType: 'PaymentAttempt',
        referenceId: attempt._id,
        notes: `Cart ${cart._id} (webhook)`
      });
    } catch (err) {
      if (couponIncremented) await couponService.decrementUsage(cart.couponCode);
      if (subscriptionConsumed) await subscriptionService.rollbackConsumption(subscriptionConsumed);
      console.error('ensureOrder wallet debit failed:', err);
      cart.walletApplied = 0;
      cart.recomputeTotals();
    }
  }

  const customer = attempt.customerId ? await Customer.findById(attempt.customerId) : null;
  await orderController.createFromCart({
    cart,
    paymentAttempt: attempt,
    customer,
    contactOverrides: attempt.notes || {}
  });
  await Cart.deleteOne({ _id: cart._id });
}

async function ensureWalletTopupCredit(attempt) {
  if (!attempt.customerId) return;
  const amountRupees = Math.floor(attempt.amount / 100);
  await walletService.credit({
    customerId: attempt.customerId,
    amount: amountRupees,
    source: 'topup',
    referenceType: 'PaymentAttempt',
    referenceId: attempt._id,
    notes: `Topup ₹${amountRupees} (webhook)`
  });
}

async function ensureSubscriptionAdvanced(attempt) {
  if (!attempt.subscriptionId) return;
  const subscription = await Subscription.findById(attempt.subscriptionId);
  if (!subscription) {
    console.warn(`ensureSubscriptionAdvanced: subscription ${attempt.subscriptionId} missing`);
    return;
  }
  await subscriptionService.recordPayment({ subscription, attempt });
}
