const mongoose = require('mongoose');

const CLOUD_URI = "mongodb+srv://Vercel-Admin-laundry-order-management:YTkHpuE20MEI9ZkK@laundry-order-managemen.nvjptop.mongodb.net/?retryWrites=true&w=majority";

async function listUsers() {
  try {
    console.log('🔍 Checking users in MongoDB Atlas...\n');
    
    await mongoose.connect(CLOUD_URI, {
      dbName: 'laundry-orders'
    });
    
    const usersCollection = mongoose.connection.db.collection('users');
    const users = await usersCollection.find({}).toArray();
    
    console.log(`📊 Found ${users.length} users in cloud database:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Has Password: ${user.password ? 'Yes (' + user.password.substring(0, 20) + '...)' : 'No'}`);
      console.log('');
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listUsers();

