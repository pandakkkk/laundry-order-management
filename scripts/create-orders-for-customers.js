/**
 * Script to update customer names and create orders for them
 * - Update Customer One to "Sanjeev"
 * - Update Customer Two to "Anand"
 * - Create sample orders for both customers
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('../server/models/Customer');
const Order = require('../server/models/Order');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-laundry-order-management:zJDQFtuf2xbTzoJC@laundry-order-managemen.nvjptop.mongodb.net/laundry-orders?retryWrites=true&w=majority';

// Customer phone numbers
const customerPhones = {
  sanjeev: '+919110948124',
  anand: '+918825129867'
};

// Sample order items
const sampleItems = [
  [
    { description: 'Shirts - Regular Wash', quantity: 5, price: 50 },
    { description: 'Pants - Regular Wash', quantity: 3, price: 60 },
    { description: 'Ironing Service', quantity: 8, price: 10 }
  ],
  [
    { description: 'Sarees - Dry Clean', quantity: 2, price: 200 },
    { description: 'Suits - Dry Clean', quantity: 1, price: 300 },
    { description: 'Ironing Service', quantity: 3, price: 15 }
  ],
  [
    { description: 'Bedsheets - Regular Wash', quantity: 2, price: 80 },
    { description: 'Curtains - Regular Wash', quantity: 1, price: 150 },
    { description: 'Pillow Covers - Regular Wash', quantity: 4, price: 30 }
  ],
  [
    { description: 'T-Shirts - Regular Wash', quantity: 10, price: 40 },
    { description: 'Jeans - Regular Wash', quantity: 4, price: 70 },
    { description: 'Ironing Service', quantity: 14, price: 10 }
  ],
  [
    { description: 'Formal Shirts - Dry Clean', quantity: 6, price: 120 },
    { description: 'Trousers - Dry Clean', quantity: 4, price: 140 },
    { description: 'Ironing Service', quantity: 10, price: 12 }
  ]
];

// Order statuses to use
const orderStatuses = [
  'Received',
  'Sorting',
  'Washing',
  'Ironing',
  'Quality Check',
  'Packing',
  'Ready for Pickup',
  'Delivered'
];

// Payment statuses
const paymentStatuses = ['Pending', 'Paid', 'Partial'];

// Payment methods
const paymentMethods = ['Cash', 'Card', 'UPI', 'Online'];

function generateTicketNumber(index, customerId) {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const orderNum = String(index).padStart(3, '0');
  return `${year}${month}${day}-${customerId}-${orderNum}`;
}

function generateOrderNumber(index) {
  return String(index).padStart(3, '0');
}

async function createOrdersForCustomers() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Update customer names
    console.log('📝 Updating customer names...\n');
    
    const sanjeev = await Customer.findOneAndUpdate(
      { phoneNumber: customerPhones.sanjeev },
      { name: 'Sanjeev' },
      { new: true }
    );
    
    const anand = await Customer.findOneAndUpdate(
      { phoneNumber: customerPhones.anand },
      { name: 'Anand' },
      { new: true }
    );

    if (sanjeev) {
      console.log(`✅ Updated customer: ${sanjeev.name} - ${sanjeev.phoneNumber}`);
      if (sanjeev.customerId) {
        console.log(`   Customer ID: ${sanjeev.customerId}`);
      }
    } else {
      console.log(`⚠️  Customer with phone ${customerPhones.sanjeev} not found`);
    }

    if (anand) {
      console.log(`✅ Updated customer: ${anand.name} - ${anand.phoneNumber}`);
      if (anand.customerId) {
        console.log(`   Customer ID: ${anand.customerId}`);
      }
    } else {
      console.log(`⚠️  Customer with phone ${customerPhones.anand} not found`);
    }

    console.log('\n📦 Creating orders...\n');

    // Create orders for Sanjeev
    if (sanjeev) {
      console.log(`📋 Creating orders for ${sanjeev.name}...`);
      const sanjeevOrders = [];
      
      for (let i = 1; i <= 5; i++) {
        const items = sampleItems[i - 1] || sampleItems[0];
        const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - (i * 2)); // Spread orders over last 10 days
        
        const expectedDelivery = new Date(orderDate);
        expectedDelivery.setDate(expectedDelivery.getDate() + 2); // 2 days delivery
        
        const status = orderStatuses[Math.min(i - 1, orderStatuses.length - 1)];
        const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        const customerIdValue = sanjeev.customerId || `CUST-${sanjeev.phoneNumber.slice(-4)}`;
        
        sanjeevOrders.push({
          ticketNumber: generateTicketNumber(i, customerIdValue.split('-')[1] || '001'),
          orderNumber: generateOrderNumber(i),
          customerId: customerIdValue,
          customerName: sanjeev.name,
          phoneNumber: sanjeev.phoneNumber,
          orderDate: orderDate,
          expectedDelivery: expectedDelivery,
          servedBy: 'Staff Member',
          items: items,
          totalAmount: totalAmount,
          paymentMethod: paymentMethod,
          paymentStatus: paymentStatus,
          status: status,
          location: '',
          notes: `Order for ${sanjeev.name}`,
          createdAt: orderDate,
          updatedAt: orderDate
        });
      }

      try {
        await Order.insertMany(sanjeevOrders);
        console.log(`   ✅ Created ${sanjeevOrders.length} orders for ${sanjeev.name}`);
        sanjeevOrders.forEach((order, idx) => {
          console.log(`      ${idx + 1}. ${order.ticketNumber} - ₹${order.totalAmount} - ${order.status}`);
        });
      } catch (error) {
        console.error(`   ❌ Error creating orders for ${sanjeev.name}:`, error.message);
      }
    }

    console.log('');

    // Create orders for Anand
    if (anand) {
      console.log(`📋 Creating orders for ${anand.name}...`);
      const anandOrders = [];
      
      for (let i = 1; i <= 5; i++) {
        const items = sampleItems[i - 1] || sampleItems[0];
        const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - (i * 2)); // Spread orders over last 10 days
        
        const expectedDelivery = new Date(orderDate);
        expectedDelivery.setDate(expectedDelivery.getDate() + 2); // 2 days delivery
        
        const status = orderStatuses[Math.min(i + 1, orderStatuses.length - 1)];
        const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        const customerIdValue = anand.customerId || `CUST-${anand.phoneNumber.slice(-4)}`;
        
        anandOrders.push({
          ticketNumber: generateTicketNumber(i, customerIdValue.split('-')[1] || '002'),
          orderNumber: generateOrderNumber(i),
          customerId: customerIdValue,
          customerName: anand.name,
          phoneNumber: anand.phoneNumber,
          orderDate: orderDate,
          expectedDelivery: expectedDelivery,
          servedBy: 'Staff Member',
          items: items,
          totalAmount: totalAmount,
          paymentMethod: paymentMethod,
          paymentStatus: paymentStatus,
          status: status,
          location: '',
          notes: `Order for ${anand.name}`,
          createdAt: orderDate,
          updatedAt: orderDate
        });
      }

      try {
        await Order.insertMany(anandOrders);
        console.log(`   ✅ Created ${anandOrders.length} orders for ${anand.name}`);
        anandOrders.forEach((order, idx) => {
          console.log(`      ${idx + 1}. ${order.ticketNumber} - ₹${order.totalAmount} - ${order.status}`);
        });
      } catch (error) {
        console.error(`   ❌ Error creating orders for ${anand.name}:`, error.message);
      }
    }

    console.log('\n🎉 Order creation process completed!');
    console.log('\n📊 Summary:');
    const sanjeevOrderCount = await Order.countDocuments({ phoneNumber: customerPhones.sanjeev });
    const anandOrderCount = await Order.countDocuments({ phoneNumber: customerPhones.anand });
    console.log(`   ${sanjeev?.name || 'Sanjeev'}: ${sanjeevOrderCount} orders`);
    console.log(`   ${anand?.name || 'Anand'}: ${anandOrderCount} orders`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - some ticket numbers may already exist');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
createOrdersForCustomers();

