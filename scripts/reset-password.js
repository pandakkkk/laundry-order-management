const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CLOUD_URI = "mongodb+srv://Vercel-Admin-laundry-order-management:YTkHpuE20MEI9ZkK@laundry-order-managemen.nvjptop.mongodb.net/?retryWrites=true&w=majority";

async function resetPassword() {
  try {
    const email = process.argv[2];
    const newPassword = process.argv[3];
    
    if (!email || !newPassword) {
      console.log('❌ Usage: node scripts/reset-password.js <email> <new-password>');
      console.log('\nExample:');
      console.log('  node scripts/reset-password.js sanjeevmurmu761@gmail.com myNewPassword123');
      process.exit(1);
    }
    
    console.log('🔐 Resetting password...\n');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 New Password: ${newPassword}`);
    console.log('');
    
    await mongoose.connect(CLOUD_URI, {
      dbName: 'laundry-orders'
    });
    
    const usersCollection = mongoose.connection.db.collection('users');
    
    // Check if user exists
    const user = await usersCollection.findOne({ email });
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      console.log('\n📋 Available users:');
      const allUsers = await usersCollection.find({}).toArray();
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.name})`);
      });
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.name} (${user.role})`);
    
    // Hash new password
    console.log('🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    console.log('💾 Updating password in database...');
    await usersCollection.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );
    
    console.log('\n✅ Password reset successful!');
    console.log('\n🧪 Test login:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('\n🌐 Login at: http://localhost:3000');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();

