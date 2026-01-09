/**
 * Setup Delivery Orders Script
 * Updates existing orders to have pickup and drop statuses for delivery boy testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../server/models/Order');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-laundry-order-management:zJDQFtuf2xbTzoJC@laundry-order-managemen.nvjptop.mongodb.net/laundry-orders?retryWrites=true&w=majority';

async function setupDeliveryOrders() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all orders
    const allOrders = await Order.find({}).sort({ createdAt: -1 });
    console.log(`📦 Found ${allOrders.length} total orders\n`);

    if (allOrders.length === 0) {
      console.log('❌ No orders found. Please create some orders first.');
      process.exit(1);
    }

    // Distribute orders across different statuses for testing
    let pickupCount = 0;
    let pickupInProgressCount = 0;
    let readyForDeliveryCount = 0;
    let outForDeliveryCount = 0;

    for (let i = 0; i < allOrders.length; i++) {
      const order = allOrders[i];
      let newStatus;

      // Distribute orders: 
      // - First 5 -> Ready for Pickup (TO PICK - pending)
      // - Next 3 -> Pickup In Progress (TO PICK - in progress)
      // - Next 5 -> Ready for Delivery (TO DROP - pending)
      // - Next 3 -> Out for Delivery (TO DROP - in progress)
      // - Rest -> Keep original status

      if (i < 5) {
        newStatus = 'Ready for Pickup';
        pickupCount++;
      } else if (i < 8) {
        newStatus = 'Pickup In Progress';
        pickupInProgressCount++;
      } else if (i < 13) {
        newStatus = 'Ready for Delivery';
        readyForDeliveryCount++;
      } else if (i < 16) {
        newStatus = 'Out for Delivery';
        outForDeliveryCount++;
      } else {
        continue; // Keep original status
      }

      await Order.findByIdAndUpdate(order._id, { status: newStatus });
      console.log(`  ✓ ${order.ticketNumber} -> ${newStatus}`);
    }

    console.log('\n📊 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📥 TO PICK Section:`);
    console.log(`   • Ready for Pickup: ${pickupCount} orders`);
    console.log(`   • Pickup In Progress: ${pickupInProgressCount} orders`);
    console.log(`📤 TO DROP Section:`);
    console.log(`   • Ready for Delivery: ${readyForDeliveryCount} orders`);
    console.log(`   • Out for Delivery: ${outForDeliveryCount} orders`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Delivery orders setup complete!');
    console.log('🚀 Open the Delivery Dashboard to see the orders.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupDeliveryOrders();

