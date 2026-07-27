const mongoose = require('mongoose');
const WalletTransaction = require('../models/WalletTransaction');

class WalletError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function getBalance(customerId) {
  if (!customerId) return 0;
  const [row] = await WalletTransaction.aggregate([
    { $match: { customerId: new mongoose.Types.ObjectId(String(customerId)) } },
    {
      $group: {
        _id: '$customerId',
        credit: {
          $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] }
        },
        debit: {
          $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] }
        }
      }
    }
  ]);
  if (!row) return 0;
  return Math.max(0, row.credit - row.debit);
}

async function listHistory(customerId, { limit = 20, before = null } = {}) {
  const query = { customerId };
  if (before) query.createdAt = { $lt: new Date(before) };
  return WalletTransaction.find(query).sort({ createdAt: -1 }).limit(limit);
}

// Append a credit entry idempotently. If a matching (source, referenceId) entry already exists,
// returns it without inserting a duplicate.
async function credit({ customerId, amount, source, referenceType, referenceId, notes }) {
  if (!customerId) throw new WalletError('customerId required', 'CUSTOMER_REQUIRED');
  if (!(amount > 0)) throw new WalletError('amount must be > 0', 'BAD_AMOUNT');

  if (referenceId) {
    const existing = await WalletTransaction.findOne({
      customerId,
      source,
      referenceId,
      type: 'credit'
    });
    if (existing) return existing;
  }

  const session = await mongoose.startSession();
  try {
    let entry;
    await session.withTransaction(async () => {
      const balance = await getBalance(customerId);
      const balanceAfter = balance + amount;
      entry = await WalletTransaction.create(
        [{
          customerId,
          type: 'credit',
          amount,
          balanceAfter,
          source,
          referenceType: referenceType || 'Manual',
          referenceId: referenceId || null,
          notes: notes || ''
        }],
        { session }
      ).then((docs) => docs[0]);
    });
    return entry;
  } catch (err) {
    if (err.code === 11000) {
      // Idempotency race — another writer inserted the same (source, refId, credit) entry.
      const dup = await WalletTransaction.findOne({
        customerId,
        source,
        referenceId,
        type: 'credit'
      });
      if (dup) return dup;
    }
    throw err;
  } finally {
    session.endSession();
  }
}

// Append a debit entry within a transaction. Rejects if resulting balance would go negative.
async function debit({ customerId, amount, source, referenceType, referenceId, notes }) {
  if (!customerId) throw new WalletError('customerId required', 'CUSTOMER_REQUIRED');
  if (!(amount > 0)) throw new WalletError('amount must be > 0', 'BAD_AMOUNT');

  if (referenceId) {
    const existing = await WalletTransaction.findOne({
      customerId,
      source,
      referenceId,
      type: 'debit'
    });
    if (existing) return existing;
  }

  const session = await mongoose.startSession();
  try {
    let entry;
    await session.withTransaction(async () => {
      const balance = await getBalance(customerId);
      if (balance < amount) {
        throw new WalletError('Insufficient balance', 'INSUFFICIENT_BALANCE');
      }
      const balanceAfter = balance - amount;
      entry = await WalletTransaction.create(
        [{
          customerId,
          type: 'debit',
          amount,
          balanceAfter,
          source,
          referenceType: referenceType || 'Manual',
          referenceId: referenceId || null,
          notes: notes || ''
        }],
        { session }
      ).then((docs) => docs[0]);
    });
    return entry;
  } catch (err) {
    if (err.code === 11000) {
      const dup = await WalletTransaction.findOne({
        customerId,
        source,
        referenceId,
        type: 'debit'
      });
      if (dup) return dup;
    }
    throw err;
  } finally {
    session.endSession();
  }
}

module.exports = {
  WalletError,
  getBalance,
  listHistory,
  credit,
  debit
};
