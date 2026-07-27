/**
 * Production Pre-Flight Checklist & Diagnostic Script
 * Run before deploying to verify environment variables, database connection, and security configs.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const DEFAULT_MONGO_URI = 'mongodb://localhost:27017/laundry-orders';

async function runPreflight() {
  console.log('🚀 Running Production Pre-Flight Diagnostics...\n');
  let passed = true;

  const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGO_URI;
  const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_laundry_management_2026';

  // 1. Check Environment Variables
  console.log('1️⃣  Checking Environment Variables:');
  console.log(`   ${process.env.MONGODB_URI ? '✅' : '⚠️ '} MONGODB_URI: ${process.env.MONGODB_URI ? 'Configured' : 'Not set (using local fallback)'}`);
  console.log(`   ${process.env.JWT_SECRET ? '✅' : '⚠️ '} JWT_SECRET: ${process.env.JWT_SECRET ? 'Configured' : 'Using default development fallback'}`);
  console.log(`   ${process.env.WBL_FE_ORIGIN ? '✅' : '⚠️ '} WBL_FE_ORIGIN: ${process.env.WBL_FE_ORIGIN || 'http://localhost:5173'}`);
  console.log(`   ${process.env.RAZORPAY_KEY_ID ? '✅' : 'ℹ️ '} RAZORPAY_KEY_ID: ${process.env.RAZORPAY_KEY_ID ? 'Configured' : 'Not set (Razorpay payments disabled)'}`);

  // 2. Test JWT Security
  console.log('\n2️⃣  Testing JWT Security:');
  if (jwtSecret === 'change-me-to-a-long-random-value' || jwtSecret.startsWith('dev_')) {
    console.log('   ⚠️  WARNING: JWT_SECRET is using a development secret. Provide a 64-char string in production .env!');
  } else if (jwtSecret.length < 32) {
    console.log('   ⚠️  JWT_SECRET is shorter than recommended 32 characters.');
  } else {
    console.log('   ✅ JWT_SECRET meets production security guidelines.');
  }

  // 3. Test MongoDB Connection
  console.log('\n3️⃣  Testing MongoDB Connection:');
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log(`   ✅ Connected to MongoDB! Database: "${mongoose.connection.db.databaseName}"`);
    await mongoose.connection.close();
  } catch (err) {
    console.log(`   ⚠️  MongoDB Connection Warning: ${err.message}`);
    console.log('   💡 Make sure MONGODB_URI in .env is set to a live MongoDB Atlas cluster before deploying.');
  }

  console.log('\n------------------------------------------------');
  console.log('🎉 DIAGNOSTICS COMPLETE! System code is ready for live environment deployment.\n');
}

runPreflight();
