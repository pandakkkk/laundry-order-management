const mongoose = require('mongoose');
require('dotenv').config();

// Import Customer model
const Customer = require('../server/models/Customer');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-laundry-order-management:zJDQFtuf2xbTzoJC@laundry-order-managemen.nvjptop.mongodb.net/laundry-orders?retryWrites=true&w=majority';

// Sample data for generating customers
const firstNames = [
  'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rahul', 'Deepika', 'Karthik', 'Pooja',
  'Suresh', 'Meera', 'Arjun', 'Lakshmi', 'Naveen', 'Divya', 'Aditya', 'Kavya', 'Rohan', 'Sonia',
  'Ravi', 'Shreya', 'Manish', 'Neha', 'Vivek', 'Kriti', 'Siddharth', 'Ananya', 'Gaurav', 'Isha',
  'Yash', 'Tanvi', 'Harsh', 'Riya', 'Abhishek', 'Pooja', 'Varun', 'Swati', 'Rohit', 'Nisha',
  'Kunal', 'Aishwarya', 'Sagar', 'Preeti', 'Nikhil', 'Jyoti', 'Akash', 'Madhuri', 'Pranav', 'Sapna'
];

const lastNames = [
  'Kumar', 'Sharma', 'Patel', 'Reddy', 'Singh', 'Desai', 'Verma', 'Nair', 'Iyer', 'Gupta',
  'Rao', 'Krishnan', 'Bhat', 'Joshi', 'Shetty', 'Das', 'Kapoor', 'Malhotra', 'Chopra', 'Agarwal',
  'Mehta', 'Shah', 'Jain', 'Gandhi', 'Pandey', 'Tiwari', 'Yadav', 'Mishra', 'Dubey', 'Saxena',
  'Agarwal', 'Bansal', 'Goyal', 'Khanna', 'Arora', 'Bhatia', 'Chadha', 'Dutta', 'Ganguly', 'Hegde',
  'Jha', 'Kulkarni', 'Lal', 'Menon', 'Narayan', 'Ojha', 'Pillai', 'Qureshi', 'Raman', 'Seth'
];

const cities = [
  'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'
];

const states = [
  'Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Gujarat', 'Rajasthan', 'Punjab', 'Haryana'
];

const statuses = ['Active', 'Active', 'Active', 'Active', 'Inactive']; // 80% Active, 20% Inactive

// Generate random customer data
function generateCustomer(index) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${firstName} ${lastName}`;
  const city = cities[Math.floor(Math.random() * cities.length)];
  const state = states[Math.floor(Math.random() * states.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  // Generate unique phone number
  const phoneBase = 9876000000;
  const phoneNumber = `+91 ${phoneBase + index}`;
  
  // Generate email
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`;
  
  // Generate customer ID (not all customers have one)
  const customerId = index <= 50 ? `CUST${String(index).padStart(3, '0')}` : undefined;
  
  // Generate random stats
  const totalOrders = Math.floor(Math.random() * 30) + 1;
  const totalSpent = Math.floor(Math.random() * 10000) + 500;
  
  // Generate last order date (within last 90 days)
  const daysAgo = Math.floor(Math.random() * 90);
  const lastOrderDate = new Date();
  lastOrderDate.setDate(lastOrderDate.getDate() - daysAgo);
  
  // Generate address
  const streetNumber = Math.floor(Math.random() * 999) + 1;
  const areas = ['MG Road', 'Brigade Road', 'Indiranagar', 'Koramangala', 'Whitefield', 
                 'Jayanagar', 'HSR Layout', 'BTM Layout', 'Marathahalli', 'Electronic City'];
  const area = areas[Math.floor(Math.random() * areas.length)];
  const address = `${streetNumber} ${area}`;
  
  // Generate pincode (random 6-digit)
  const pincode = String(Math.floor(Math.random() * 900000) + 100000);
  
  // Some customers have notes
  const notesOptions = [
    'VIP Customer',
    'Regular customer',
    'Prefers express delivery',
    'Corporate account',
    'Weekly pickup',
    'Cash on delivery only',
    'Allergic to fabric softener',
    'Premium customer - Same day delivery',
    null,
    null,
    null // 70% chance of no notes
  ];
  const notes = notesOptions[Math.floor(Math.random() * notesOptions.length)];

  return {
    phoneNumber,
    name,
    email,
    address,
    city,
    state,
    pincode,
    customerId,
    notes,
    status,
    totalOrders,
    totalSpent,
    lastOrderDate,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000), // Random date within last year
    updatedAt: new Date()
  };
}

async function generateCustomers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000
    });
    console.log('✅ Connected to MongoDB\n');

    // Check if customers already exist
    const existingCount = await Customer.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing customers in database.`);
      console.log('   This script will ADD 100 new customers (not replace existing ones).\n');
    }

    // Generate 100 customers
    console.log('📝 Generating 100 sample customers...');
    const customers = [];
    for (let i = 1; i <= 100; i++) {
      customers.push(generateCustomer(i));
    }

    // Insert customers
    console.log('💾 Inserting customers into database...');
    await Customer.insertMany(customers, { ordered: false });

    // Get final count
    const finalCount = await Customer.countDocuments();
    const activeCount = await Customer.countDocuments({ status: 'Active' });
    const inactiveCount = await Customer.countDocuments({ status: 'Inactive' });

    console.log('\n✅ Successfully added 100 sample customers!');
    console.log('\n📊 Customer Statistics:');
    console.log(`   Total Customers: ${finalCount}`);
    console.log(`   Active: ${activeCount}`);
    console.log(`   Inactive: ${inactiveCount}`);
    console.log('\n🎉 Database seeding complete!');
    console.log('🌐 Go to: http://localhost:3000/customers to view customers');
    console.log('   (Use pagination to navigate through all customers)\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating customers:', error);
    if (error.code === 11000) {
      console.error('   Duplicate key error - some phone numbers or customer IDs may already exist');
    }
    process.exit(1);
  }
}

generateCustomers();

