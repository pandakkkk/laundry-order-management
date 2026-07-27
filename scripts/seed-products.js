/**
 * Seed all product catalog items into MongoDB Atlas.
 * Usage: node scripts/seed-products.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../server/models/Product');

const PRODUCTS = [
  { productId: 'shirt', name: 'Shirt', category: 'upper_body', basePrice: 149 },
  { productId: 'white_shirt', name: 'White Shirt', category: 'upper_body', basePrice: 149 },
  { productId: 'tshirt', name: 'T-Shirt', category: 'upper_body', basePrice: 149 },
  { productId: 'jeans', name: 'Trouser / Jeans', category: 'lower_body', basePrice: 130 },
  { productId: 'kurta', name: 'Kurta', category: 'upper_body', basePrice: 140 },
  { productId: 'blazer_coat', name: 'Blazer / Coat', category: 'combination', basePrice: 250 },
  { productId: 'sherwani', name: 'Sherwani', category: 'combination', basePrice: 350 },
  { productId: 'suit_pc', name: 'Suit 2pc', category: 'combination', basePrice: 200 },
  { productId: 'kurti', name: 'Kurti / Kameez', category: 'upper_body', basePrice: 150 },
  { productId: 'saree', name: 'Saree', category: 'others', basePrice: 200 },
  { productId: 'lehenga', name: 'Lehenga Heavy', category: 'others', basePrice: 450 },
  { productId: 'pant', name: 'Trouser / Leggings', category: 'lower_body', basePrice: 130 },
  { productId: 'frock_dress', name: 'Skirt / Frock', category: 'others', basePrice: 120 },
  { productId: 'dress_fancy', name: 'Dress Fancy', category: 'others', basePrice: 180 },
  { productId: 'bedsheet', name: 'Bedsheet (Single)', category: 'household', basePrice: 150 },
  { productId: 'bed_cover', name: 'Bedsheet (Double)', category: 'household', basePrice: 250 },
  { productId: 'blanket', name: 'Blanket', category: 'household', basePrice: 300 },
  { productId: 'carpet_per_sqft', name: 'Carpet (per sq ft)', category: 'household', basePrice: 25 }
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri);
  console.log(`Connected to database: ${mongoose.connection.db.databaseName}`);

  let upserts = 0;
  for (const p of PRODUCTS) {
    const result = await Product.updateOne(
      { productId: p.productId },
      { $set: { ...p, isActive: true }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    if (result.upsertedCount) console.log(`  + created ${p.name} (${p.productId})`);
    else console.log(`  ~ updated ${p.name} (${p.productId})`);
    upserts += 1;
  }
  console.log(`\n✅ Done! ${upserts} product catalog items successfully seeded in MongoDB.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Error seeding products:', err);
  process.exit(1);
});
