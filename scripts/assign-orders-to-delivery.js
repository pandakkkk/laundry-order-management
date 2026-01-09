/**
 * Assign Orders to Delivery User Script
 * Assigns some orders to delivery@laundry.com for testing
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-laundry-order-management:zJDQFtuf2xbTzoJC@laundry-order-managemen.nvjptop.mongodb.net/laundry-orders?retryWrites=true&w=majority';

async function assignOrdersToDelivery() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get User and Order collections
    const usersCollection = mongoose.connection.db.collection('users');
    const ordersCollection = mongoose.connection.db.collection('orders');

    // Find the delivery user
    const deliveryUser = await usersCollection.findOne({ email: 'delivery@laundry.com' });
    
    if (!deliveryUser) {
      console.log('❌ User delivery@laundry.com not found!');
      console.log('Creating delivery user...');
      
      // Create the delivery user if doesn't exist
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('delivery123', 10);
      
      const newUser = await usersCollection.insertOne({
        name: 'Delivery Boy',
        email: 'delivery@laundry.com',
        password: hashedPassword,
        role: 'delivery',
        department: 'Delivery',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Created delivery user\n');
      
      // Assign orders to this new user
      await assignOrders(ordersCollection, newUser.insertedId, 'Delivery Boy');
    } else {
      console.log(`✅ Found user: ${deliveryUser.name} (${deliveryUser.email})`);
      console.log(`   ID: ${deliveryUser._id}\n`);
      
      // Assign orders to this user
      await assignOrders(ordersCollection, deliveryUser._id, deliveryUser.name);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function assignOrders(ordersCollection, userId, userName) {
  // Get some orders to assign
  const allOrders = await ordersCollection.find({}).sort({ createdAt: -1 }).limit(20).toArray();
  
  console.log(`📦 Found ${allOrders.length} orders\n`);
  
  if (allOrders.length === 0) {
    console.log('❌ No orders found to assign!');
    return;
  }

  let pickupCount = 0;
  let dropCount = 0;

  for (let i = 0; i < allOrders.length && i < 10; i++) {
    const order = allOrders[i];
    let newStatus;

    // Assign first 5 orders for pickup, next 5 for delivery
    if (i < 5) {
      newStatus = 'Ready for Pickup';
      pickupCount++;
    } else if (i < 10) {
      newStatus = 'Ready for Delivery';
      dropCount++;
    } else {
      continue;
    }

    // Update the order with assignment and status
    // Ensure userId is an ObjectId for proper querying
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    await ordersCollection.updateOne(
      { _id: order._id },
      {
        $set: {
          status: newStatus,
          assignedTo: userObjectId,
          assignedToName: userName,
          assignedAt: new Date()
        }
      }
    );

    console.log(`  ✓ ${order.ticketNumber} → ${newStatus} (assigned to ${userName})`);
  }

  console.log('\n📊 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📥 TO PICK: ${pickupCount} orders assigned`);
  console.log(`📤 TO DROP: ${dropCount} orders assigned`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n✅ Orders assigned to ${userName}!`);
  console.log('\n🔐 Login credentials:');
  console.log('   Email: delivery@laundry.com');
  console.log('   Password: delivery123');
  console.log('\n🚀 Open the Delivery Dashboard to see your assigned orders!\n');
}

assignOrdersToDelivery();

