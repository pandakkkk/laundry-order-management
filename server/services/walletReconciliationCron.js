const cron = require('node-cron');
const mongoose = require('mongoose');
const https = require('https');
const WalletTransaction = require('../models/WalletTransaction');

async function alert(subject, body) {
  console.error(`[wallet-reconciliation] ALERT: ${subject}\n${body}`);
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  const payload = JSON.stringify({ text: `*Wallet reconciliation alert*\n*${subject}*\n\`\`\`${body}\`\`\`` });
  try {
    await new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      }, (res) => { res.on('data', () => {}); res.on('end', resolve); });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  } catch (err) {
    console.error('[wallet-reconciliation] Slack webhook failed:', err.message);
  }
}

// Aggregates credits/debits per customer, checks:
//   1. balance never negative
//   2. latest transaction's balanceAfter matches the running aggregate
// Emits an alert on any inconsistency.
async function runOnce() {
  const started = Date.now();
  const results = { checked: 0, negatives: 0, mismatches: 0 };
  const issues = [];

  const cursor = WalletTransaction.aggregate([
    {
      $sort: { customerId: 1, createdAt: 1, _id: 1 }
    },
    {
      $group: {
        _id: '$customerId',
        credits: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
        debits: { $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] } },
        latestBalanceAfter: { $last: '$balanceAfter' },
        latestId: { $last: '$_id' },
        latestType: { $last: '$type' }
      }
    }
  ]).cursor({ batchSize: 500 });

  for (let row = await cursor.next(); row; row = await cursor.next()) {
    results.checked += 1;
    const balance = row.credits - row.debits;
    if (balance < 0) {
      results.negatives += 1;
      issues.push(`Customer ${row._id}: negative balance ${balance} (credits=${row.credits}, debits=${row.debits})`);
    }
    if (row.latestBalanceAfter != null && row.latestBalanceAfter !== balance) {
      results.mismatches += 1;
      issues.push(
        `Customer ${row._id}: latest balanceAfter=${row.latestBalanceAfter} but aggregate=${balance} (txn ${row.latestId})`
      );
    }
  }

  const summary =
    `checked=${results.checked} negatives=${results.negatives} mismatches=${results.mismatches} in ${Date.now() - started}ms`;
  console.log(`[wallet-reconciliation] ${summary}`);

  if (issues.length > 0) {
    await alert(
      `Wallet ledger inconsistency (${issues.length})`,
      `${summary}\n${issues.slice(0, 20).join('\n')}${issues.length > 20 ? `\n… and ${issues.length - 20} more` : ''}`
    );
  }
  return { ...results, issues };
}

function start() {
  const expr = process.env.WALLET_RECONCILIATION_CRON || '30 3 * * *'; // 03:30 IST daily
  console.log(`[wallet-reconciliation] scheduling with "${expr}"`);
  cron.schedule(expr, () => {
    runOnce().catch((err) => console.error('[wallet-reconciliation] unhandled error:', err));
  }, { timezone: 'Asia/Kolkata' });
}

module.exports = { start, runOnce };
