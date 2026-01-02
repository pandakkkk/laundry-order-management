const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CLOUD_URI = "mongodb+srv://Vercel-Admin-laundry-order-management:zJDQFtuf2xbTzoJC@laundry-order-managemen.nvjptop.mongodb.net/laundry-orders?retryWrites=true&w=majority";

async function seedCloudFresh() {
  try {
    console.log('🚀 Seeding MongoDB Atlas with Fresh Data');
    console.log('═'.repeat(60));
    
    await mongoose.connect(CLOUD_URI, {
      dbName: 'laundry-orders'
    });
    
    console.log('✅ Connected to MongoDB Atlas\n');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await mongoose.connection.db.collection('users').deleteMany({});
    await mongoose.connection.db.collection('orders').deleteMany({});
    await mongoose.connection.db.collection('customers').deleteMany({});
    console.log('✅ Cleared old data\n');
    
    // Seed Users
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const users = [
      {
        email: 'sanjeevmurmu761@gmail.com',
        password: hashedPassword,
        name: 'SANJEEV MURMU',
        role: 'admin',
        createdAt: new Date()
      },
      {
        email: 'admin@laundry.com',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'admin',
        createdAt: new Date()
      },
      {
        email: 'manager@laundry.com',
        password: await bcrypt.hash('manager123', 10),
        name: 'Store Manager',
        role: 'manager',
        createdAt: new Date()
      },
      {
        email: 'staff@laundry.com',
        password: await bcrypt.hash('staff123', 10),
        name: 'Laundry Staff',
        role: 'staff',
        createdAt: new Date()
      }
    ];
    
    await mongoose.connection.db.collection('users').insertMany(users);
    console.log(`✅ Created ${users.length} users\n`);
    
    // Seed Customers
    console.log('👥 Creating customers...');
    const customers = Array.from({ length: 20 }, (_, i) => ({
      phoneNumber: `+91 9876${String(i + 1).padStart(6, '0')}`,
      name: `Customer ${i + 1}`,
      email: `customer${i + 1}@example.com`,
      address: `${i + 1} MG Road`,
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: `56000${i % 10}`,
      customerId: `CUST${String(i + 1).padStart(3, '0')}`,
      status: i % 10 === 0 ? 'Inactive' : 'Active',
      totalOrders: Math.floor(Math.random() * 30) + 1,
      totalSpent: Math.floor(Math.random() * 10000) + 500,
      lastOrderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    await mongoose.connection.db.collection('customers').insertMany(customers);
    console.log(`✅ Created ${customers.length} customers\n`);
    
    // Seed Orders
    console.log('📦 Creating orders...');
    const statuses = ['Received', 'Sorting', 'Washing', 'Dry Cleaning', 'Ironing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Return'];
    const priorities = ['normal', 'urgent', 'express'];
    
    const orders = Array.from({ length: 100 }, (_, i) => {
      const orderNum = String(i + 1).padStart(3, '0');
      const ticketNum = `2511-${String(Math.floor(i / 100) + 1).padStart(3, '0')}-${orderNum}`;
      const custNum = (i % 20) + 1;
      
      return {
        ticketNumber: ticketNum,
        orderNumber: orderNum,
        customerId: `CUST${String(custNum).padStart(3, '0')}`,
        customerName: `Customer ${custNum}`,
        phoneNumber: `+91 9876${String(custNum).padStart(6, '0')}`,
        address: `${custNum} MG Road, Bangalore`,
        items: [
          {
            description: 'Shirt - Wash & Iron',
            quantity: Math.floor(Math.random() * 5) + 1,
            price: 50,
            productId: 'shirt-wash-iron'
          },
          {
            description: 'Pants - Dry Clean',
            quantity: Math.floor(Math.random() * 3) + 1,
            price: 80,
            productId: 'pants-dry-clean'
          }
        ],
        totalAmount: Math.floor(Math.random() * 500) + 100,
        advancePayment: Math.floor(Math.random() * 200),
        paymentStatus: Math.random() > 0.5 ? 'paid' : 'pending',
        status: statuses[i % statuses.length],
        priority: priorities[i % priorities.length],
        orderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        expectedDeliveryDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        createdBy: users[0].email,
        notes: i % 5 === 0 ? 'Handle with care' : '',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      };
    });
    
    await mongoose.connection.db.collection('orders').insertMany(orders);
    console.log(`✅ Created ${orders.length} orders\n`);
    
    // Summary
    console.log('═'.repeat(60));
    console.log('🎉 Seeding Complete!\n');
    console.log('📊 Summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   👥 Customers: ${customers.length}`);
    console.log(`   📦 Orders: ${orders.length}`);
    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   📈 Total: ${users.length + customers.length + orders.length} documents`);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('   Email: sanjeevmurmu761@gmail.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('🌐 Open: http://localhost:3000');
    console.log('═'.repeat(60));
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seedCloudFresh();

