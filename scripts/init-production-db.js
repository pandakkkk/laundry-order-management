/**
 * Production Database Initialization Script
 * Builds collection indexes and initializes the primary Super Admin user.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../server/models/User');
const Order = require('../server/models/Order');
const Customer = require('../server/models/Customer');

async function initProdDb() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI environment variable is missing.');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas');

    console.log('⏳ Building database indexes...');
    await User.createIndexes();
    await Order.createIndexes();
    await Customer.createIndexes();
    console.log('✅ Indexes created successfully');

    // Check if admin user exists
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.log('⚠️  No Admin user found. Creating initial production admin...');
      const adminUser = new User({
        name: 'System Admin',
        email: process.env.PROD_ADMIN_EMAIL || 'admin@laundryman.pro',
        password: process.env.PROD_ADMIN_PASSWORD || 'Admin@Laundryman2026!',
        role: 'admin',
        phone: '9006463666',
        isActive: true
      });
      await adminUser.save();
      console.log(`✅ Production Admin created: ${adminUser.email}`);
      console.log(`⚠️  Temporary Password: ${process.env.PROD_ADMIN_PASSWORD || 'Admin@Laundryman2026!'}`);
      console.log('🔒 PLEASE CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!');
    } else {
      console.log(`ℹ️  Found ${adminCount} existing admin user(s). Skipping default creation.`);
    }

    console.log('\n🎉 Production Database Initialization Complete!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Database Initialization Failed:', err.message);
    process.exit(1);
  }
}

initProdDb();
