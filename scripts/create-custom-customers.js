/**
 * Script to create 2 custom customers with specific phone numbers
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('../server/models/Customer');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-laundry-order-management:zJDQFtuf2xbTzoJC@laundry-order-managemen.nvjptop.mongodb.net/laundry-orders?retryWrites=true&w=majority';

// Customer data
const customers = [
  {
    phoneNumber: '+919110948124',
    name: 'Customer One',
    customerId: 'CUST-001',
    email: 'customer1@example.com',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: 'Custom customer created via script',
    status: 'Active'
  },
  {
    phoneNumber: '+918825129867',
    name: 'Customer Two',
    customerId: 'CUST-002',
    email: 'customer2@example.com',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: 'Custom customer created via script',
    status: 'Active'
  }
];

async function createCustomers() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Create customers
    console.log('📝 Creating customers...\n');
    
    for (const customerData of customers) {
      try {
        // Check if customer already exists
        const existingCustomer = await Customer.findOne({ 
          phoneNumber: customerData.phoneNumber 
        });

        if (existingCustomer) {
          console.log(`⚠️  Customer with phone ${customerData.phoneNumber} already exists:`);
          console.log(`   Name: ${existingCustomer.name}`);
          console.log(`   Customer ID: ${existingCustomer.customerId || 'N/A'}`);
          console.log(`   Status: ${existingCustomer.status}\n`);
        } else {
          // Create new customer
          const customer = await Customer.create(customerData);
          console.log(`✅ Created customer:`);
          console.log(`   Phone: ${customer.phoneNumber}`);
          console.log(`   Name: ${customer.name}`);
          console.log(`   Customer ID: ${customer.customerId}`);
          console.log(`   Status: ${customer.status}\n`);
        }
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  Duplicate entry for phone ${customerData.phoneNumber}`);
          console.log(`   Error: ${error.message}\n`);
        } else {
          console.error(`❌ Error creating customer ${customerData.phoneNumber}:`, error.message);
          console.log('');
        }
      }
    }

    console.log('🎉 Customer creation process completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
createCustomers();

