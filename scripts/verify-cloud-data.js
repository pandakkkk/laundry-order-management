const mongoose = require('mongoose');

const CLOUD_URI = "mongodb+srv://Vercel-Admin-laundry-order-management:zJDQFtuf2xbTzoJC@laundry-order-managemen.nvjptop.mongodb.net/laundry-orders?retryWrites=true&w=majority";

async function verifyData() {
  try {
    console.log('🔍 Verifying Cloud Database Data...\n');
    
    await mongoose.connect(CLOUD_URI, {
      dbName: 'laundry-orders'
    });
    
    // Check each collection
    const collections = ['users', 'orders', 'customers'];
    
    for (const collectionName of collections) {
      const collection = mongoose.connection.db.collection(collectionName);
      const count = await collection.countDocuments();
      const sample = await collection.findOne({});
      
      console.log(`📦 ${collectionName.toUpperCase()}:`);
      console.log(`   Count: ${count} documents`);
      
      if (sample) {
        console.log(`   Sample: ${JSON.stringify(sample, null, 2).substring(0, 200)}...`);
      }
      console.log('');
    }
    
    console.log('✅ All data verified in MongoDB Atlas!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyData();

