const mongoose = require('mongoose');

const CLOUD_URI = "mongodb+srv://Vercel-Admin-laundry-order-management:YTkHpuE20MEI9ZkK@laundry-order-managemen.nvjptop.mongodb.net/?retryWrites=true&w=majority";

async function checkStatuses() {
  try {
    await mongoose.connect(CLOUD_URI, { dbName: 'laundry-orders' });
    
    const ordersCollection = mongoose.connection.db.collection('orders');
    
    // Get unique statuses
    const statuses = await ordersCollection.distinct('status');
    console.log('📊 Unique statuses in database:', statuses);
    
    // Count by status
    console.log('\n📈 Count by status:');
    for (const status of statuses) {
      const count = await ordersCollection.countDocuments({ status });
      console.log(`   ${status}: ${count}`);
    }
    
    // Show a sample order
    const sampleOrder = await ordersCollection.findOne({});
    console.log('\n📋 Sample order:');
    console.log(JSON.stringify(sampleOrder, null, 2));
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkStatuses();

