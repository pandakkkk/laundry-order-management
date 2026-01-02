const mongoose = require('mongoose');

// Check what the server is using
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-laundry-order-management:zJDQFtuf2xbTzoJC@laundry-order-managemen.nvjptop.mongodb.net/laundry-orders?retryWrites=true&w=majority';

async function debugConnection() {
  try {
    console.log('🔍 Debugging Database Connection...\n');
    console.log('📍 Connection String:', MONGODB_URI.substring(0, 50) + '...\n');
    
    await mongoose.connect(MONGODB_URI, {
      dbName: 'laundry-orders'
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database Name:', mongoose.connection.db.databaseName);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('');
    
    // Check collections and counts
    const collections = ['users', 'orders', 'customers'];
    
    for (const collectionName of collections) {
      const collection = mongoose.connection.db.collection(collectionName);
      const count = await collection.countDocuments();
      console.log(`📦 ${collectionName}: ${count} documents`);
    }
    
    // Show actual data
    console.log('\n📋 Sample Data:');
    const ordersCollection = mongoose.connection.db.collection('orders');
    const sampleOrder = await ordersCollection.findOne({});
    if (sampleOrder) {
      console.log('\n   Sample Order:');
      console.log(`   - Ticket: ${sampleOrder.ticketNumber}`);
      console.log(`   - Customer: ${sampleOrder.customerName}`);
      console.log(`   - Status: ${sampleOrder.status}`);
    } else {
      console.log('   ❌ No orders found!');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugConnection();

