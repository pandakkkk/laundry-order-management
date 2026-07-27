const nodemailer = require('nodemailer');

let cachedTransporter = null;
let cachedFrom = null;

function getConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    secure: process.env.SMTP_SECURE === 'true'
  };
}

function isConfigured() {
  const cfg = getConfig();
  return Boolean(cfg.host && cfg.user && cfg.pass && cfg.from);
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const cfg = getConfig();
  if (!isConfigured()) return null;
  cachedTransporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass }
  });
  cachedFrom = cfg.from;
  return cachedTransporter;
}

async function send({ to, subject, text, html }) {
  if (!to) return { success: false, error: 'no recipient' };
  const transporter = getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV email] to=${to} subject="${subject}"`);
    }
    return { success: false, error: 'smtp not configured' };
  }
  try {
    const info = await transporter.sendMail({ from: cachedFrom, to, subject, text, html });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`email send failed to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ---- Templates ------------------------------------------------------------

function formatRupees(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function orderConfirmation(order) {
  const subject = `Booking confirmed — order #${order.ticketNumber}`;
  const lines = [
    `Hi ${order.customerName || 'there'},`,
    ``,
    `We've received your order.`,
    `Ticket: ${order.ticketNumber}`,
    `Amount: ${formatRupees(order.totalAmount)}`,
    order.paymentMethod === 'Subscription' ? `Paid via your subscription.` :
      order.paymentStatus === 'Paid' ? `Payment received.` :
      `To pay: ${formatRupees(order.totalAmount)} (COD)`,
    ``,
    order.expectedDelivery ? `Expected delivery: ${new Date(order.expectedDelivery).toLocaleString('en-IN', { day: 'numeric', month: 'short' })}` : '',
    ``,
    `Track your order: https://laundryman.pro/track/${encodeURIComponent(order.ticketNumber)}`,
    ``,
    `— Laundryman`
  ].filter(Boolean).join('\n');
  return { subject, text: lines };
}

function refundCredited({ order, walletAmount, razorpayAmount }) {
  const subject = `Refund processed — order #${order.ticketNumber}`;
  const lines = [
    `Hi ${order.customerName || 'there'},`,
    ``,
    `Your refund for order ${order.ticketNumber} has been processed.`,
    walletAmount > 0 ? `Wallet credited: ${formatRupees(walletAmount)}` : '',
    razorpayAmount > 0 ? `Refunded to source: ${formatRupees(razorpayAmount / 100)} (may take 5–7 business days)` : '',
    ``,
    `— Laundryman`
  ].filter(Boolean).join('\n');
  return { subject, text: lines };
}

function subscriptionRenewal({ customer, subscription, amount }) {
  const planName = subscription.planSnapshot?.name || 'your plan';
  const subject = `Renew your ${planName} plan`;
  const text = [
    `Hi ${customer.name || 'there'},`,
    ``,
    `Your ${planName} plan renewal of ${formatRupees(amount)} is due.`,
    `Open the app to complete payment and continue uninterrupted service.`,
    ``,
    `Manage plan: https://laundryman.pro/subscriptions/manage`,
    ``,
    `— Laundryman`
  ].join('\n');
  return { subject, text };
}

module.exports = {
  isConfigured,
  send,
  orderConfirmation,
  refundCredited,
  subscriptionRenewal
};
