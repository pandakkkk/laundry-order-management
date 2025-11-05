const mongoose = require('mongoose');
const User = require('../server/models/User');
require('dotenv').config();

const testUsers = [
  {
    email: 'admin@laundry.com',
    password: 'admin123',
    name: 'System Administrator',
    role: 'admin'
  },
  {
    email: 'manager@laundry.com',
    password: 'manager123',
    name: 'Store Manager',
    role: 'manager'
  },
  {
    email: 'staff@laundry.com',
    password: 'staff123',
    name: 'Laundry Staff',
    role: 'staff'
  },
  {
    email: 'frontdesk@laundry.com',
    password: 'frontdesk123',
    name: 'Front Desk Agent',
    role: 'frontdesk'
  },
  {
    email: 'delivery@laundry.com',
    password: 'delivery123',
    name: 'Delivery Driver',
    role: 'delivery'
  },
  {
    email: 'accountant@laundry.com',
    password: 'accountant123',
    name: 'Senior Accountant',
    role: 'accountant'
  }
];

const createTestUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry-orders');
    console.log('✅ Connected to MongoDB\n');

    console.log('🔐 Creating test users for all roles...\n');

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`⚠️  User already exists: ${userData.email} (${userData.role})`);
          continue;
        }

        // Create new user
        const user = await User.create(userData);
        console.log(`✅ Created: ${userData.email}`);
        console.log(`   Role: ${userData.role} - ${userData.name}`);
        console.log(`   Password: ${userData.password}\n`);
      } catch (error) {
        console.error(`❌ Error creating ${userData.email}:`, error.message);
      }
    }

    console.log('\n📋 Test Users Summary:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    testUsers.forEach(user => {
      console.log(`${getRoleIcon(user.role)} ${user.role.toUpperCase().padEnd(12)} | ${user.email.padEnd(25)} | ${user.password}`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n🚀 You can now login with any of these accounts!');
    console.log('   Go to: http://localhost:3000/login\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

function getRoleIcon(role) {
  const icons = {
    admin: '👑',
    manager: '📊',
    staff: '🧺',
    frontdesk: '📞',
    delivery: '🚚',
    accountant: '💰'
  };
  return icons[role] || '👤';
}

createTestUsers();

