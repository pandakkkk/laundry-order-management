/**
 * Seed sample subscription plans.
 * Usage: node scripts/seed-subscription-plans.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const SubscriptionPlan = require('../server/models/SubscriptionPlan');

const PLANS = [
  {
    slug: 'basic',
    name: 'Basic',
    description: 'Perfect for singles and small households',
    price: 499,
    pickupsPerMonth: 2,
    includedItems: [
      { productId: 'shirt', description: 'Shirt / T-Shirt', quantity: 8 }
    ],
    features: ['2 pickups per month', 'Up to 8 shirts', 'Free pickup + delivery'],
    carryForwardAllowed: false,
    isActive: true
  },
  {
    slug: 'family',
    name: 'Family',
    description: 'Ideal for families of 3–4',
    price: 899,
    pickupsPerMonth: 4,
    includedItems: [
      { productId: 'shirt', description: 'Shirts / T-Shirts', quantity: 12 },
      { productId: 'jeans', description: 'Trousers / Jeans', quantity: 8 }
    ],
    features: ['4 pickups per month', 'Up to 20 garments', 'Priority scheduling'],
    carryForwardAllowed: false,
    isActive: true
  },
  {
    slug: 'premium',
    name: 'Premium',
    description: 'For heavy usage and mixed garment types',
    price: 1499,
    pickupsPerMonth: 8,
    includedItems: [
      { productId: 'shirt', description: 'Shirts / T-Shirts', quantity: 20 },
      { productId: 'jeans', description: 'Trousers / Jeans', quantity: 12 },
      { productId: 'kurta', description: 'Kurtas', quantity: 8 }
    ],
    features: ['8 pickups per month', 'Up to 40 garments', 'Carry forward unused quota', 'Express drying included'],
    carryForwardAllowed: true,
    isActive: true
  }
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri);
  console.log(`Connected to ${mongoose.connection.db.databaseName}`);

  for (const p of PLANS) {
    const result = await SubscriptionPlan.updateOne(
      { slug: p.slug },
      { $set: p, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    console.log(`  ${result.upsertedCount ? '+' : '~'} ${p.slug} — ₹${p.price}/mo`);
  }
  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
