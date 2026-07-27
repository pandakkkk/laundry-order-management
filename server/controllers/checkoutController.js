const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const PaymentAttempt = require('../models/PaymentAttempt');
const orderController = require('./orderController');
const razorpayService = require('../services/razorpayService');
const couponService = require('../services/couponService');
const walletService = require('../services/walletService');
const subscriptionService = require('../services/subscriptionService');

// Locate the caller's cart the same way cartController does.
async function findCallerCart(req) {
  if (req.customer) {
    return Cart.findOne({ customerId: req.customer._id });
  }
  const sessionId = req.headers['x-cart-session'] || req.body?.sessionId;
  if (!sessionId) return null;
  return Cart.findOne({ sessionId, customerId: null });
}

function validateContact(req, cart) {
  if (req.customer) {
    return {
      phoneNumber: req.customer.phoneNumber,
      name: req.customer.name || req.body?.name || 'Customer'
    };
  }
  const phone = String(req.body?.phoneNumber || '').replace(/\D/g, '');
  const name = String(req.body?.name || '').trim();
  if (phone.length < 10 || !name) return null;
  return { phoneNumber: phone.length === 10 ? '91' + phone : phone, name };
}

// POST /api/checkout/initiate  { method: 'razorpay' | 'cod' }
exports.initiate = async (req, res) => {
  try {
    const method = req.body?.method === 'cod' ? 'cod' : 'razorpay';
    const cart = await findCallerCart(req);
    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    const contact = validateContact(req, cart);
    if (!contact) {
      return res.status(400).json({
        success: false,
        error: 'Contact details required for guest checkout (name, phoneNumber)'
      });
    }

    if (!cart.pickupSlot?.address) {
      return res.status(400).json({ success: false, error: 'Pickup address required' });
    }

    // Server-side recompute — refresh subscription coverage first so downstream steps see current values.
    const preview = await subscriptionService.previewCoverage(req.customer, cart);
    cart.subscriptionCovered = preview.covered;
    cart.subscriptionCoverage = {
      subscriptionId: preview.subscriptionId,
      breakdown: preview.breakdown,
      computedAt: new Date()
    };
    cart.recomputeTotals();

    // Re-validate coupon: cart may have changed since apply. Any failure clears the coupon.
    if (cart.couponCode) {
      try {
        const { discountAmount } = await couponService.validateForCart({
          code: cart.couponCode,
          cart,
          customer: req.customer
        });
        cart.discountAmount = discountAmount;
      } catch (err) {
        cart.couponCode = null;
        cart.discountAmount = 0;
      }
      cart.recomputeTotals();
    }

    // Re-validate wallet: cap by current balance and current post-cover-and-discount total.
    if (cart.walletApplied > 0) {
      if (!req.customer) {
        cart.walletApplied = 0;
      } else {
        const balance = await walletService.getBalance(req.customer._id);
        const maxWallet = Math.max(0, cart.subtotal - cart.subscriptionCovered - cart.discountAmount);
        cart.walletApplied = Math.floor(Math.min(cart.walletApplied, balance, maxWallet));
      }
      cart.recomputeTotals();
    }
    await cart.save();

    // Total already zero (fully covered by coupon + wallet) — no gateway needed.
    if (cart.total <= 0) {
      const attempt = await PaymentAttempt.create({
        cartId: cart._id,
        customerId: req.customer?._id || null,
        amount: 0,
        method: 'cod',
        status: 'created',
        idempotencyKey: `zero:${cart._id}`,
        notes: { name: contact.name, phoneNumber: contact.phoneNumber, zeroTotal: true }
      });
      return res.json({
        success: true,
        method: 'wallet',
        attemptId: attempt._id,
        amount: 0
      });
    }

    if (method === 'cod') {
      const attempt = await PaymentAttempt.create({
        cartId: cart._id,
        customerId: req.customer?._id || null,
        amount: Math.round(cart.total * 100),
        method: 'cod',
        status: 'created',
        idempotencyKey: `cod:${cart._id}`,
        notes: { name: contact.name, phoneNumber: contact.phoneNumber }
      });
      return res.json({
        success: true,
        method: 'cod',
        attemptId: attempt._id,
        amount: cart.total
      });
    }

    if (!razorpayService.isConfigured()) {
      return res.status(500).json({ success: false, error: 'Payment gateway not configured' });
    }

    const amountPaise = Math.round(cart.total * 100);
    const rzpOrder = await razorpayService.createOrder({
      amountPaise,
      receipt: String(cart._id),
      notes: {
        cartId: String(cart._id),
        customerId: String(req.customer?._id || ''),
        phoneNumber: contact.phoneNumber
      }
    });

    const attempt = await PaymentAttempt.create({
      cartId: cart._id,
      customerId: req.customer?._id || null,
      razorpayOrderId: rzpOrder.id,
      amount: amountPaise,
      method: 'razorpay',
      status: 'created',
      idempotencyKey: `rzp:${rzpOrder.id}`,
      notes: { name: contact.name, phoneNumber: contact.phoneNumber }
    });

    return res.json({
      success: true,
      method: 'razorpay',
      attemptId: attempt._id,
      razorpayOrderId: rzpOrder.id,
      razorpayKeyId: razorpayService.getKeys().keyId,
      amount: amountPaise,
      currency: 'INR',
      customerName: contact.name,
      customerPhone: contact.phoneNumber
    });
  } catch (error) {
    console.error('checkout initiate error:', error);
    return res.status(500).json({ success: false, error: 'Failed to initiate checkout' });
  }
};

// POST /api/checkout/confirm
//   Razorpay: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
//   COD:      { attemptId }
exports.confirm = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, attemptId } = req.body || {};

    let attempt;
    if (razorpayOrderId) {
      attempt = await PaymentAttempt.findOne({ razorpayOrderId });
    } else if (attemptId) {
      attempt = await PaymentAttempt.findById(attemptId);
    }
    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Payment attempt not found' });
    }

    const cart = await Cart.findById(attempt.cartId);
    if (!cart) {
      return res.status(400).json({ success: false, error: 'Cart no longer exists' });
    }

    if (attempt.method === 'razorpay') {
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
      attempt.status = 'captured';
      await attempt.save();
    } else if (attempt.notes?.zeroTotal) {
      // Wallet-only or fully-couponed — commit immediately.
      attempt.status = 'captured';
      await attempt.save();
    } else {
      // COD — no gateway; mark 'created' -> nothing to capture yet
      attempt.status = 'created';
      await attempt.save();
    }

    // Atomic coupon usage — guarded against last-usage race.
    let couponIncremented = false;
    if (cart.couponCode) {
      const inc = await couponService.tryIncrementUsage(cart.couponCode);
      if (!inc) {
        return res.status(409).json({
          success: false,
          error: 'Coupon usage limit reached — please retry checkout without it'
        });
      }
      couponIncremented = true;
    }

    // Subscription quota — transactional decrement using the coverage snapshot.
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
        console.error('quota consumption failed:', subErr.message);
        return res.status(subErr.status || 409).json({
          success: false,
          error: subErr.message || 'Subscription quota unavailable'
        });
      } finally {
        session.endSession();
      }
    }

    // Wallet debit — transactional, rejects on insufficient balance.
    if (cart.walletApplied > 0 && req.customer) {
      try {
        await walletService.debit({
          customerId: req.customer._id,
          amount: cart.walletApplied,
          source: 'order_payment',
          referenceType: 'PaymentAttempt',
          referenceId: attempt._id,
          notes: `Cart ${cart._id}`
        });
      } catch (walletErr) {
        if (couponIncremented) await couponService.decrementUsage(cart.couponCode);
        if (subscriptionConsumed) await subscriptionService.rollbackConsumption(subscriptionConsumed);
        console.error('wallet debit at checkout failed:', walletErr);
        return res.status(400).json({
          success: false,
          error: walletErr.code === 'INSUFFICIENT_BALANCE'
            ? 'Insufficient wallet balance'
            : 'Failed to debit wallet'
        });
      }
    }

    const order = await orderController.createFromCart({
      cart,
      paymentAttempt: attempt,
      customer: req.customer || null,
      contactOverrides: attempt.notes || {}
    });

    await Cart.deleteOne({ _id: cart._id });

    return res.json({
      success: true,
      order: {
        id: order._id,
        ticketNumber: order.ticketNumber,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        expectedDelivery: order.expectedDelivery
      }
    });
  } catch (error) {
    console.error('checkout confirm error:', error);
    return res.status(500).json({ success: false, error: 'Failed to confirm checkout' });
  }
};
