const mongoose = require('mongoose');
require('dotenv').config();

// Import Order model
const Order = require('../server/models/Order');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry-orders';

// Helper function needed by generateCustomers
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Sample data for generating realistic orders
// Each customer object has a unique ID and name (note: some names are duplicated intentionally)
function generateCustomers() {
  const firstNames = [
    'Rajesh', 'Priya', 'Amit', 'Sunita', 'Ravi', 'Neha', 'Vikram', 'Anita', 'Sanjay', 'Pooja',
    'Manoj', 'Rekha', 'Suresh', 'Kavita', 'Deepak', 'Meena', 'Ramesh', 'Sneha', 'Arun', 'Geeta',
    'Ajay', 'Shweta', 'Rakesh', 'Sapna', 'Dinesh', 'Sumit', 'Rani', 'Rohit', 'Anjali', 'Vijay',
    'Kiran', 'Naveen', 'Pankaj', 'Seema', 'Vikas', 'Nisha', 'Ashok', 'Madhuri', 'Rahul', 'Divya',
    'Sachin', 'Poonam', 'Mukesh', 'Sangeeta', 'Nitin', 'Swati', 'Kamal', 'Varsha', 'Manish', 'Jyoti'
  ];
  
  const lastNames = [
    'Kumar', 'Singh', 'Sharma', 'Devi', 'Verma', 'Patel', 'Gupta', 'Prasad', 'Kumari', 'Chandra',
    'Rao', 'Mishra', 'Joshi', 'Reddy', 'Nair', 'Das', 'Mehta', 'Iyer', 'Agarwal', 'Saxena',
    'Pandey', 'Trivedi', 'Desai', 'Shah', 'Jain', 'Chauhan', 'Yadav', 'Sinha', 'Malhotra', 'Pillai'
  ];
  
  const customers = [];
  const phoneBase = [
    '98765', '87654', '91234', '99887', '88776', '77665', '96543', '85432', '94321', '83210',
    '72109', '61098', '79036', '90123', '81234', '92345', '93456', '84567', '95678', '86789'
  ];
  
  for (let i = 1; i <= 150; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const phonePrefix = phoneBase[i % phoneBase.length];
    const phoneSuffix = String(10000 + i).padStart(5, '0');
    
    customers.push({
      id: `CUST${String(i).padStart(3, '0')}`,
      name: `${firstName} ${lastName}`,
      phone: `+91 ${phonePrefix} ${phoneSuffix}`
    });
  }
  
  return customers;
}

const customers = generateCustomers();

const locations = [
  'Near Kanchan Petrolium, Ranchi, JH',
  'Main Street, Block A, Ranchi',
  'Doranda, Near Post Office',
  'HEC Colony, Ranchi',
  'Lalpur, Near Railway Station',
  'Hinoo, Main Market',
  'Kanke Road, Near DAV School',
  'Ratu Road, Block B',
  'Bariatu, Housing Colony',
  'Morabadi, Near Stadium',
  'Argora, Sector 3',
  'Harmu, Near Police Station',
  'Ashok Nagar, Main Road',
  'Ranchi University Area',
  'Circular Road, Market Complex',
  'Kokar, Industrial Area',
  'Dhurwa, Near Dam',
  'Namkum, Main Bazaar',
  'Hatia, Station Road',
  'Booty More, Ranchi'
];

const staffMembers = [
  'Neha Kr', 'Priya Singh', 'Amit Kumar', 'Ravi Sharma', 'Sunita Devi',
  'Mohan Lal', 'Sita Ram', 'Radha Krishna'
];

const items = [
  { desc: 'Shirt (male, white, fullsleeves)', priceRange: [40, 60] },
  { desc: 'Shirt (male, colored, fullsleeves)', priceRange: [45, 65] },
  { desc: 'T-shirt (cotton, medium)', priceRange: [30, 45] },
  { desc: 'T-shirt (cotton, large)', priceRange: [35, 50] },
  { desc: 'Jeans (blue, regular)', priceRange: [70, 100] },
  { desc: 'Jeans (black, slim fit)', priceRange: [80, 110] },
  { desc: 'Trouser (formal, black)', priceRange: [90, 120] },
  { desc: 'Trouser (formal, grey)', priceRange: [85, 115] },
  { desc: 'Saree (cotton)', priceRange: [100, 150] },
  { desc: 'Saree (silk)', priceRange: [150, 250] },
  { desc: 'Kurta (cotton)', priceRange: [50, 80] },
  { desc: 'Kurta (silk)', priceRange: [90, 130] },
  { desc: 'Blazer (formal, black)', priceRange: [180, 250] },
  { desc: 'Blazer (formal, blue)', priceRange: [190, 260] },
  { desc: 'Suit (2-piece)', priceRange: [250, 400] },
  { desc: 'Suit (3-piece)', priceRange: [350, 500] },
  { desc: 'Dress (casual, cotton)', priceRange: [60, 90] },
  { desc: 'Dress (formal, silk)', priceRange: [120, 180] },
  { desc: 'Blouse (cotton)', priceRange: [35, 50] },
  { desc: 'Blouse (silk)', priceRange: [45, 70] },
  { desc: 'Shoes (Casual, white)', priceRange: [150, 200] },
  { desc: 'Shoes (Formal, black)', priceRange: [180, 250] },
  { desc: 'Bedsheet (single)', priceRange: [60, 90] },
  { desc: 'Bedsheet (double)', priceRange: [90, 130] },
  { desc: 'Blanket (single)', priceRange: [120, 180] },
  { desc: 'Blanket (double)', priceRange: [180, 250] },
  { desc: 'Curtain (per panel)', priceRange: [80, 120] },
  { desc: 'Table cloth', priceRange: [40, 60] },
  { desc: 'Pillow cover', priceRange: [20, 35] },
  { desc: 'Jacket (winter)', priceRange: [150, 220] }
];

const statuses = [
  'Received', 'Sorting', 'Spotting', 'Washing', 'Dry Cleaning', 
  'Drying', 'Ironing', 'Quality Check', 'Packing', 
  'Ready for Pickup', 'Out for Delivery', 'Delivered'
];
const paymentMethods = ['Cash', 'UPI', 'Card', 'Online'];
const paymentStatuses = ['Paid', 'Pending', 'Partial'];

const notes = [
  'Handle with care',
  'Urgent - needed by evening',
  'Regular customer',
  'Stain removal required',
  'Dry clean only',
  'Iron with low heat',
  'Wedding on next week',
  'Party dress - handle carefully',
  'Express service requested',
  'Premium quality expected',
  'First time customer',
  'VIP customer',
  'Payment will be done on delivery',
  'Call before delivery',
  'Delivery between 5-7 PM',
  ''
];

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPrice(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTicketNumber(orderNum) {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}-${day}3-${String(orderNum).padStart(5, '0')}`;
}

function generateOrderDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(getRandomNumber(8, 20), getRandomNumber(0, 59), 0, 0);
  return date;
}

function generateExpectedDelivery(orderDate, daysToAdd) {
  const date = new Date(orderDate);
  date.setDate(date.getDate() + daysToAdd);
  date.setHours(18, 0, 0, 0);
  return date;
}

function generateOrderItems() {
  const numItems = getRandomNumber(1, 5);
  const orderItems = [];
  
  for (let i = 0; i < numItems; i++) {
    const item = getRandomElement(items);
    const quantity = getRandomNumber(1, 3);
    const price = getRandomPrice(item.priceRange[0], item.priceRange[1]);
    
    orderItems.push({
      description: item.desc,
      quantity: quantity,
      price: price
    });
  }
  
  return orderItems;
}

function generateOrder(orderNum) {
  const daysAgo = getRandomNumber(0, 30);
  const orderDate = generateOrderDate(daysAgo);
  const deliveryDays = getRandomNumber(2, 5);
  const expectedDelivery = generateExpectedDelivery(orderDate, deliveryDays);
  
  const orderItems = generateOrderItems();
  const totalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  
  // Select a customer (with potential duplicates to show customer ID importance)
  const customer = getRandomElement(customers);
  
  // Determine status based on how old the order is - simulating realistic workflow
  let status;
  if (daysAgo === 0) {
    status = getRandomElement(['Received', 'Sorting']);
  } else if (daysAgo === 1) {
    status = getRandomElement(['Sorting', 'Spotting', 'Washing', 'Dry Cleaning']);
  } else if (daysAgo === 2) {
    status = getRandomElement(['Washing', 'Dry Cleaning', 'Drying', 'Ironing']);
  } else if (daysAgo <= 3) {
    status = getRandomElement(['Ironing', 'Quality Check', 'Packing']);
  } else if (daysAgo <= 4) {
    status = getRandomElement(['Packing', 'Ready for Pickup', 'Out for Delivery']);
  } else {
    status = getRandomElement(['Ready for Pickup', 'Out for Delivery', 'Delivered']);
    // Small chance of return or refund for older orders
    if (Math.random() < 0.05) {
      status = getRandomElement(['Return', 'Refund']);
    }
  }
  
  const paymentStatus = status === 'Delivered' ? 'Paid' : getRandomElement(paymentStatuses);
  
  return {
    ticketNumber: generateTicketNumber(orderNum),
    orderNumber: String(orderNum).padStart(3, '0'),
    customerId: customer.id,
    customerName: customer.name,
    phoneNumber: customer.phone,
    orderDate: orderDate.toISOString(),
    expectedDelivery: expectedDelivery.toISOString(),
    servedBy: getRandomElement(staffMembers),
    items: orderItems,
    totalAmount: totalAmount,
    paymentMethod: getRandomElement(paymentMethods),
    paymentStatus: paymentStatus,
    status: status,
    location: getRandomElement(locations),
    notes: getRandomElement(notes)
  };
}

async function seedOrders() {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing orders...');
    await Order.deleteMany({});
    console.log('✅ Cleared existing orders\n');

    // Generate 150 orders
    console.log('🔄 Generating 150 orders...');
    const orders = [];
    for (let i = 1; i <= 150; i++) {
      orders.push(generateOrder(i));
    }
    console.log('✅ Generated 150 orders\n');

    // Insert orders
    console.log('🔄 Inserting orders into database...');
    const insertedOrders = await Order.insertMany(orders);
    console.log(`✅ Successfully inserted ${insertedOrders.length} orders\n`);

    // Display statistics
    const stats = {
      Received: await Order.countDocuments({ status: 'Received' }),
      'In Progress': await Order.countDocuments({ status: 'In Progress' }),
      Ready: await Order.countDocuments({ status: 'Ready' }),
      Delivered: await Order.countDocuments({ status: 'Delivered' })
    };

    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    console.log('📊 Order Statistics:');
    console.log(`   • Total Orders: ${insertedOrders.length}`);
    console.log(`   • Received: ${stats.Received}`);
    console.log(`   • In Progress: ${stats['In Progress']}`);
    console.log(`   • Ready: ${stats.Ready}`);
    console.log(`   • Delivered: ${stats.Delivered}`);
    console.log(`   • Total Revenue: ₹${totalRevenue[0]?.total.toLocaleString('en-IN') || 0}\n`);

    console.log('✨ Database seeded successfully with 150 orders!');
    console.log('🚀 Refresh your dashboard at http://localhost:3000\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedOrders();

