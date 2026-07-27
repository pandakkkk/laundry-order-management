/**
 * Seed sample coupons into MongoDB.
 * Usage: node scripts/seed-coupons.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Coupon = require('../server/models/Coupon');

const COUPONS = [
  {
    code: 'FIRST20',
    description: 'Flat 20% off on your first order',
    type: 'percentage',
    value: 20,
    minOrderAmount: 50,
    maxDiscount: 300,
    usageLimit: null,
    perUserLimit: 1,
    isActive: true
  },
  {
    code: 'WELCOME20',
    description: '20% off Welcome Promo for new customers',
    type: 'percentage',
    value: 20,
    minOrderAmount: 50,
    maxDiscount: 300,
    usageLimit: null,
    perUserLimit: 1,
    isActive: true
  },
  {
    code: 'LAUNDRY20',
    description: '20% off Laundry & Dry Cleaning Services',
    type: 'percentage',
    value: 20,
    minOrderAmount: 50,
    maxDiscount: 300,
    usageLimit: null,
    perUserLimit: 5,
    isActive: true
  },
  {
    code: 'SAVE10',
    description: '10% Instant Savings on all orders',
    type: 'percentage',
    value: 10,
    minOrderAmount: 50,
    maxDiscount: 150,
    usageLimit: null,
    perUserLimit: 10,
    isActive: true
  },
  {
    code: 'FLAT100',
    description: '₹100 off on orders above ₹500',
    type: 'flat',
    value: 100,
    minOrderAmount: 500,
    usageLimit: null,
    perUserLimit: 3,
    isActive: true
  }
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri);
  console.log(`Connected to database: ${mongoose.connection.db.databaseName}`);

  let upserts = 0;
  for (const c of COUPONS) {
    const result = await Coupon.updateOne(
      { code: c.code },
      { $set: c, $setOnInsert: { usageCount: 0, createdAt: new Date() } },
      { upsert: true }
    );
    if (result.upsertedCount) console.log(`  + created ${c.code}`);
    else console.log(`  ~ updated ${c.code}`);
    upserts += 1;
  }
  console.log(`\n✅ Done! ${upserts} coupons successfully seeded in MongoDB.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Error seeding coupons:', err);
  process.exit(1);
});
