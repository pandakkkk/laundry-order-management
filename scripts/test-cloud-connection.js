const mongoose = require('mongoose');

// MongoDB Atlas Connection String
const CLOUD_URI = "mongodb+srv://Vercel-Admin-laundry-order-management:YTkHpuE20MEI9ZkK@laundry-order-managemen.nvjptop.mongodb.net/?retryWrites=true&w=majority";

async function testConnection() {
  try {
    console.log('🔗 Testing connection to MongoDB Atlas...');
    console.log('📍 Cluster: laundry-order-managemen.nvjptop.mongodb.net');
    
    await mongoose.connect(CLOUD_URI, {
      dbName: 'laundry-orders'
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📊 Database name:', mongoose.connection.db.databaseName);
    
    // Test write access
    console.log('\n🧪 Testing write access...');
    const testCollection = mongoose.connection.db.collection('connection_test');
    await testCollection.insertOne({ 
      test: 'connection', 
      timestamp: new Date(),
      message: 'Connection test successful!' 
    });
    console.log('✅ Write access confirmed!');
    
    // Clean up test
    await testCollection.deleteMany({ test: 'connection' });
    console.log('✅ Cleanup complete!');
    
    // Show existing collections
    console.log('\n📋 Existing collections in cloud database:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length === 0) {
      console.log('   (No collections yet - database is empty)');
    } else {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }
    
    console.log('\n🎉 MongoDB Atlas is ready for use!');
    console.log('✅ Connection test passed!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection test failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication')) {
      console.error('\n💡 Tip: Check your username and password');
    } else if (error.message.includes('network')) {
      console.error('\n💡 Tip: Check your internet connection and firewall settings');
    } else if (error.message.includes('IP')) {
      console.error('\n💡 Tip: Add your IP address to MongoDB Atlas Network Access whitelist');
      console.error('   Go to: https://cloud.mongodb.com/');
      console.error('   Navigate to: Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)');
    }
    
    process.exit(1);
  }
}

testConnection();

