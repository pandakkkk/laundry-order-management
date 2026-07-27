const crypto = require('crypto');
const Razorpay = require('razorpay');

function getKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  return { keyId, keySecret, webhookSecret };
}

let cachedClient = null;
function getClient() {
  const { keyId, keySecret } = getKeys();
  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
  }
  if (!cachedClient) {
    cachedClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return cachedClient;
}

function isConfigured() {
  const { keyId, keySecret } = getKeys();
  return Boolean(keyId && keySecret);
}

// amountPaise MUST be an integer.
async function createOrder({ amountPaise, receipt, notes }) {
  const client = getClient();
  return client.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes: notes || {}
  });
}

// Client-side callback signature: HMAC-SHA256(order_id + '|' + payment_id, KEY_SECRET)
function verifyClientSignature({ razorpayOrderId, razorpayPaymentId, signature }) {
  const { keySecret } = getKeys();
  if (!keySecret || !razorpayOrderId || !razorpayPaymentId || !signature) return false;
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return timingSafeEquals(expected, signature);
}

// Webhook signature: HMAC-SHA256(raw_body, WEBHOOK_SECRET)
function verifyWebhookSignature(rawBody, signature) {
  const { webhookSecret } = getKeys();
  if (!webhookSecret || !signature) return false;
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  return timingSafeEquals(expected, signature);
}

function timingSafeEquals(a, b) {
  try {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

async function refund({ paymentId, amountPaise, notes }) {
  const client = getClient();
  return client.payments.refund(paymentId, {
    amount: amountPaise,
    notes: notes || {}
  });
}

module.exports = {
  isConfigured,
  createOrder,
  verifyClientSignature,
  verifyWebhookSignature,
  refund,
  getKeys
};
