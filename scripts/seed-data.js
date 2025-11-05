const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import Order model
const Order = require('../server/models/Order');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry-orders';

async function seedData() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Read sample data
    const sampleDataPath = path.join(__dirname, '../sample-data.json');
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));

    // Clear existing data (optional)
    console.log('Clearing existing orders...');
    await Order.deleteMany({});
    console.log('✅ Cleared existing orders');

    // Insert sample data
    console.log('Inserting sample orders...');
    const orders = await Order.insertMany(sampleData);
    console.log(`✅ Successfully inserted ${orders.length} orders`);

    // Display summary
    console.log('\n📊 Sample Orders Summary:');
    orders.forEach(order => {
      console.log(`   - ${order.ticketNumber}: ${order.customerName} (${order.status})`);
    });

    console.log('\n✨ Database seeded successfully!');
    console.log('🚀 You can now start the application with: npm run dev\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedData();

