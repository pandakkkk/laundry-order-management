const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const PaymentAttempt = require('../models/PaymentAttempt');
const razorpayService = require('./razorpayService');

class SubscriptionError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function addMonths(date, months) {
  const d = new Date(date);
  const target = d.getMonth() + months;
  d.setMonth(target);
  // handle month rollover for end-of-month dates (e.g. Jan 31 + 1 month)
  if (d.getMonth() !== ((target % 12) + 12) % 12) d.setDate(0);
  return d;
}

function initialQuota(plan) {
  return plan.includedItems.map((it) => ({
    productId: it.productId,
    description: it.description,
    quantity: it.quantity
  }));
}

// Create a subscription in 'pending' state and a Razorpay order for the first period.
// Rejects if the customer already has a non-cancelled subscription.
async function subscribe({ customer, planSlug }) {
  if (!customer) throw new SubscriptionError('Login required', 'AUTH_REQUIRED', 401);
  const plan = await SubscriptionPlan.findOne({ slug: planSlug, isActive: true });
  if (!plan) throw new SubscriptionError('Plan not found', 'PLAN_NOT_FOUND', 404);

  const existing = await Subscription.findOne({
    customerId: customer._id,
    status: { $in: ['pending', 'active', 'paused'] }
  });
  if (existing) {
    throw new SubscriptionError(
      `You already have a ${existing.status} subscription`,
      'ALREADY_SUBSCRIBED',
      409
    );
  }

  const subscription = await Subscription.create({
    customerId: customer._id,
    planId: plan._id,
    planSnapshot: {
      slug: plan.slug,
      name: plan.name,
      price: plan.price,
      pickupsPerMonth: plan.pickupsPerMonth,
      includedItems: plan.includedItems
    },
    status: 'pending'
  });

  const attempt = await createBillingAttempt({ subscription, plan, kind: 'initial' });
  return { subscription, attempt, plan };
}

// Create a Razorpay order for a billing cycle. kind = 'initial' | 'renewal'.
async function createBillingAttempt({ subscription, plan, kind = 'renewal' }) {
  if (!razorpayService.isConfigured()) {
    throw new SubscriptionError('Payment gateway not configured', 'GATEWAY_MISSING', 500);
  }
  const price = plan?.price ?? subscription.planSnapshot?.price;
  if (!price || price <= 0) throw new SubscriptionError('Plan has no price', 'BAD_PRICE');

  const amountPaise = Math.round(price * 100);
  const rzpOrder = await razorpayService.createOrder({
    amountPaise,
    receipt: `sub:${subscription._id}:${Date.now()}`,
    notes: {
      purpose: 'subscription_billing',
      subscriptionId: String(subscription._id),
      kind
    }
  });

  const attempt = await PaymentAttempt.create({
    customerId: subscription.customerId,
    subscriptionId: subscription._id,
    razorpayOrderId: rzpOrder.id,
    amount: amountPaise,
    method: 'razorpay',
    purpose: 'subscription_billing',
    status: 'created',
    idempotencyKey: `rzp:${rzpOrder.id}`,
    notes: { kind }
  });

  return { attempt, rzpOrder };
}

// Idempotent: called by both the client-side confirm path and the webhook.
// Advances currentPeriod and nextBillingDate on first payment; safe on repeat.
async function recordPayment({ subscription, attempt }) {
  if (!subscription) return null;
  if (attempt && String(attempt.subscriptionId) !== String(subscription._id)) return null;

  // Only advance if this payment hasn't been counted yet.
  if (subscription.lastPaidAt && attempt && subscription.lastPaidAt >= attempt.createdAt) {
    return subscription;
  }

  const now = new Date();
  if (subscription.status === 'pending') {
    // First payment — activate.
    const plan = subscription.planSnapshot || {};
    subscription.status = 'active';
    subscription.startedAt = subscription.startedAt || now;
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = addMonths(now, 1);
    subscription.nextBillingDate = addMonths(now, 1);
    subscription.remainingQuota = initialQuota({ includedItems: plan.includedItems || [] });
  } else if (subscription.status === 'active') {
    // Renewal — extend by one billing cycle.
    const nextStart = subscription.currentPeriodEnd || now;
    subscription.currentPeriodStart = nextStart;
    subscription.currentPeriodEnd = addMonths(nextStart, 1);
    subscription.nextBillingDate = addMonths(nextStart, 1);
    // Refill quota — MVP does not carry unused quota forward unless plan says so.
    const plan = subscription.planSnapshot || {};
    if (!plan.carryForwardAllowed) {
      subscription.remainingQuota = initialQuota({ includedItems: plan.includedItems || [] });
    } else {
      // Add fresh quota on top of existing.
      const fresh = initialQuota({ includedItems: plan.includedItems || [] });
      const merged = new Map();
      for (const q of subscription.remainingQuota) {
        merged.set(q.productId || q.description, { ...q });
      }
      for (const q of fresh) {
        const key = q.productId || q.description;
        const cur = merged.get(key);
        if (cur) cur.quantity += q.quantity;
        else merged.set(key, { ...q });
      }
      subscription.remainingQuota = Array.from(merged.values());
    }
  }

  subscription.lastPaidAt = now;
  subscription.lastBillingReminderAt = null;
  await subscription.save();
  return subscription;
}

async function pause({ subscription, resumeAt }) {
  if (subscription.status !== 'active') {
    throw new SubscriptionError('Only active subscriptions can be paused', 'BAD_STATUS');
  }
  subscription.status = 'paused';
  subscription.pausedUntil = resumeAt ? new Date(resumeAt) : null;
  await subscription.save();
  return subscription;
}

async function resume({ subscription }) {
  if (subscription.status !== 'paused') {
    throw new SubscriptionError('Not paused', 'BAD_STATUS');
  }
  subscription.status = 'active';
  // If they were paused past their billing date, push billing out by the pause duration.
  if (subscription.pausedUntil) {
    const now = new Date();
    if (subscription.pausedUntil > now && subscription.nextBillingDate) {
      const pauseDays = Math.ceil((subscription.pausedUntil - now) / (1000 * 60 * 60 * 24));
      subscription.nextBillingDate = new Date(
        subscription.nextBillingDate.getTime() + pauseDays * 24 * 60 * 60 * 1000
      );
    }
  }
  subscription.pausedUntil = null;
  await subscription.save();
  return subscription;
}

async function cancel({ subscription }) {
  if (subscription.status === 'cancelled') return subscription;
  subscription.status = 'cancelled';
  subscription.cancelledAt = new Date();
  subscription.nextBillingDate = null;
  await subscription.save();
  return subscription;
}

// Cron helper — subscriptions ready to be re-billed.
async function findDueForBilling(today = new Date()) {
  const reminderCooldown = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  return Subscription.find({
    status: 'active',
    nextBillingDate: { $lte: today },
    $or: [
      { lastBillingReminderAt: null },
      { lastBillingReminderAt: { $lt: reminderCooldown } }
    ]
  });
}

// Preview how much of a cart the customer's active subscription would cover.
// Non-mutating; safe to call from every cart mutation.
async function previewCoverage(customer, cart) {
  const empty = { covered: 0, breakdown: [], subscriptionId: null };
  if (!customer || !cart?.items?.length) return empty;

  const sub = await Subscription.findOne({
    customerId: customer._id,
    status: 'active'
  });
  if (!sub) return empty;

  const quotaMap = new Map();
  for (const q of sub.remainingQuota) {
    if (q.productId) quotaMap.set(q.productId, q.quantity);
  }

  let covered = 0;
  const breakdown = [];
  for (const item of cart.items) {
    if (!item.productId) continue;
    const available = quotaMap.get(item.productId) || 0;
    if (available <= 0) continue;
    const applied = Math.min(available, item.quantity);
    const value = applied * item.price;
    covered += value;
    quotaMap.set(item.productId, available - applied);
    breakdown.push({
      productId: item.productId,
      description: item.description,
      appliedQuantity: applied,
      valuePerUnit: item.price,
      totalValue: value
    });
  }

  return { covered: Math.floor(covered), breakdown, subscriptionId: sub._id };
}

// Atomically decrement a subscription's remainingQuota by the amounts in `breakdown`.
// Runs inside the caller's Mongoose session (transactional).
async function consumeQuota({ subscriptionId, breakdown, session }) {
  if (!subscriptionId || !breakdown?.length) return;

  const sub = await Subscription.findById(subscriptionId).session(session);
  if (!sub) throw new SubscriptionError('Subscription missing', 'SUB_MISSING');
  if (sub.status !== 'active') {
    throw new SubscriptionError('Subscription is not active', 'SUB_NOT_ACTIVE');
  }

  // Verify sufficient quota for every entry before mutating.
  const requestByProduct = new Map();
  for (const b of breakdown) {
    requestByProduct.set(b.productId, (requestByProduct.get(b.productId) || 0) + b.appliedQuantity);
  }
  for (const [productId, wanted] of requestByProduct.entries()) {
    const line = sub.remainingQuota.find((q) => q.productId === productId);
    if (!line || line.quantity < wanted) {
      throw new SubscriptionError(
        `Quota changed for ${productId} — please refresh your cart`,
        'QUOTA_STALE',
        409
      );
    }
  }

  for (const [productId, wanted] of requestByProduct.entries()) {
    const line = sub.remainingQuota.find((q) => q.productId === productId);
    line.quantity -= wanted;
  }
  await sub.save({ session });
}

// Best-effort rollback (compensation) — restore consumed quantities to a subscription
// after a downstream failure. Not transactional.
async function rollbackConsumption({ subscriptionId, breakdown }) {
  if (!subscriptionId || !breakdown?.length) return;
  try {
    const sub = await Subscription.findById(subscriptionId);
    if (!sub) return;
    const restoreByProduct = new Map();
    for (const b of breakdown) {
      restoreByProduct.set(b.productId, (restoreByProduct.get(b.productId) || 0) + b.appliedQuantity);
    }
    for (const [productId, qty] of restoreByProduct.entries()) {
      const line = sub.remainingQuota.find((q) => q.productId === productId);
      if (line) line.quantity += qty;
    }
    await sub.save();
  } catch (err) {
    console.error('rollbackConsumption failed:', err.message);
  }
}

module.exports = {
  SubscriptionError,
  subscribe,
  createBillingAttempt,
  recordPayment,
  pause,
  resume,
  cancel,
  findDueForBilling,
  previewCoverage,
  consumeQuota,
  rollbackConsumption
};
