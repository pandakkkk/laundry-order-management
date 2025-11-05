const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

const User = require('../server/models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry-orders';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('\n🔐 Create Admin User\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = await question('Email: ');
    const name = await question('Name: ');
    const password = await question('Password (min 6 characters): ');

    // Validate
    if (!email || !name || !password) {
      console.error('❌ All fields are required');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters long');
      process.exit(1);
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error('❌ User with this email already exists');
      process.exit(1);
    }

    // Create admin user
    const user = await User.create({
      email,
      name,
      password,
      role: 'admin'
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`\n👤 User Details:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`\n🚀 You can now login at http://localhost:3000/login\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdmin();

