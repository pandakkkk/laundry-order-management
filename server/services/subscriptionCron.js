const cron = require('node-cron');
const subscriptionService = require('./subscriptionService');
const notificationService = require('./notificationService');
const emailService = require('./emailService');

async function runOnce() {
  const started = Date.now();
  const now = new Date();
  const due = await subscriptionService.findDueForBilling(now);
  console.log(`[subscription-cron] ${due.length} subscriptions due at ${now.toISOString()}`);

  const results = { attempted: 0, succeeded: 0, failed: 0 };
  for (const subscription of due) {
    results.attempted += 1;
    try {
      const { attempt } = await subscriptionService.createBillingAttempt({
        subscription,
        plan: subscription.planSnapshot,
        kind: 'renewal'
      });
      subscription.lastBillingReminderAt = new Date();
      await subscription.save();

      await sendBillingSms(subscription, attempt).catch((err) =>
        console.error(`[subscription-cron] SMS failed for sub ${subscription._id}:`, err.message)
      );
      results.succeeded += 1;
    } catch (err) {
      results.failed += 1;
      console.error(`[subscription-cron] failed for sub ${subscription._id}:`, err.message);
    }
  }

  console.log(
    `[subscription-cron] done in ${Date.now() - started}ms — attempted=${results.attempted} ok=${results.succeeded} failed=${results.failed}`
  );
  return results;
}

async function sendBillingSms(subscription, attempt) {
  const customer = await require('../models/Customer').findById(subscription.customerId);
  if (!customer?.phoneNumber) return;

  const amount = Math.floor(attempt.amount / 100);
  const planName = subscription.planSnapshot?.name || 'your plan';
  const message =
    `Hi ${customer.name || 'there'}, your Laundryman ${planName} renewal of ₹${amount} is due. ` +
    `Open the app to complete payment and continue enjoying uninterrupted service.`;

  await notificationService.sendNotification(
    process.env.NOTIFICATION_TYPE || 'both',
    customer.phoneNumber,
    message
  );

  if (customer.email) {
    const tpl = emailService.subscriptionRenewal({ customer, subscription, amount });
    emailService.send({ to: customer.email, subject: tpl.subject, text: tpl.text })
      .catch((err) => console.error('renewal email failed:', err.message));
  }
}

function start() {
  // Daily at 06:00 IST.
  const expr = process.env.SUBSCRIPTION_CRON || '0 6 * * *';
  console.log(`[subscription-cron] scheduling with "${expr}"`);
  cron.schedule(expr, () => {
    runOnce().catch((err) => console.error('[subscription-cron] unhandled error:', err));
  }, { timezone: 'Asia/Kolkata' });
}

module.exports = { start, runOnce };
