/**
 * Seed B2B Business products directly into the database
 * Run: npm run seed-b2b
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../server/models/Product');
const { DEFAULT_PRODUCTS } = require('../server/config/defaultProducts');

const B2B_PRODUCTS = DEFAULT_PRODUCTS.filter(p => p.category === 'b2b_business');

async function seedB2BProducts() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-laundry-order-management:zJDQFtuf2xbTzoJC@laundry-order-managemen.nvjptop.mongodb.net/laundry-orders?retryWrites=true&w=majority';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log(`🏢 Adding ${B2B_PRODUCTS.length} B2B products...\n`);

    for (const product of B2B_PRODUCTS) {
      await Product.findOneAndUpdate(
        { productId: product.id },
        {
          productId: product.id,
          name: product.name,
          category: product.category,
          basePrice: product.basePrice,
          hasOptions: product.hasOptions || false,
          options: product.options || null,
          isActive: true,
          updatedAt: Date.now(),
          updatedBy: 'seed-b2b-script'
        },
        { upsert: true, runValidators: true }
      );
      console.log(`   ✓ ${product.name} (₹${product.basePrice})`);
    }

    console.log('\n📊 Summary:');
    console.log(`   Total: ${B2B_PRODUCTS.length} B2B products`);
    console.log('\n✅ B2B products ready! Check the B2B Business tab in New Order.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedB2BProducts();
