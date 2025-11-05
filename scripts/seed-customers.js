const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry-orders';

const customerSchema = new mongoose.Schema({
  phoneNumber: String,
  name: String,
  email: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  customerId: String,
  notes: String,
  status: String,
  totalOrders: Number,
  totalSpent: Number,
  lastOrderDate: Date,
  createdAt: Date,
  updatedAt: Date
});

const Customer = mongoose.model('Customer', customerSchema);

const sampleCustomers = [
  {
    phoneNumber: '+91 9876543210',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@example.com',
    address: '123 MG Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
    customerId: 'CUST001',
    notes: 'VIP Customer - Prefers express delivery',
    status: 'Active',
    totalOrders: 15,
    totalSpent: 4500,
    lastOrderDate: new Date('2025-11-03')
  },
  {
    phoneNumber: '+91 9876543211',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    address: '456 Brigade Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560025',
    customerId: 'CUST002',
    notes: 'Regular customer',
    status: 'Active',
    totalOrders: 8,
    totalSpent: 2400,
    lastOrderDate: new Date('2025-11-04')
  },
  {
    phoneNumber: '+91 9876543212',
    name: 'Amit Patel',
    email: 'amit.patel@example.com',
    address: '789 Indiranagar',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560038',
    customerId: 'CUST003',
    status: 'Active',
    totalOrders: 12,
    totalSpent: 3600,
    lastOrderDate: new Date('2025-11-02')
  },
  {
    phoneNumber: '+91 9876543213',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@example.com',
    address: '321 Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560034',
    customerId: 'CUST004',
    notes: 'Prefers eco-friendly detergent',
    status: 'Active',
    totalOrders: 20,
    totalSpent: 6000,
    lastOrderDate: new Date('2025-11-05')
  },
  {
    phoneNumber: '+91 9876543214',
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    address: '654 Whitefield',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560066',
    customerId: 'CUST005',
    status: 'Active',
    totalOrders: 5,
    totalSpent: 1500,
    lastOrderDate: new Date('2025-10-28')
  },
  {
    phoneNumber: '+91 9876543215',
    name: 'Anjali Desai',
    email: 'anjali.desai@example.com',
    address: '987 Jayanagar',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560011',
    customerId: 'CUST006',
    notes: 'Corporate account',
    status: 'Active',
    totalOrders: 30,
    totalSpent: 9000,
    lastOrderDate: new Date('2025-11-04')
  },
  {
    phoneNumber: '+91 9876543216',
    name: 'Rahul Verma',
    email: 'rahul.verma@example.com',
    address: '147 HSR Layout',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560102',
    status: 'Active',
    totalOrders: 7,
    totalSpent: 2100,
    lastOrderDate: new Date('2025-11-01')
  },
  {
    phoneNumber: '+91 9876543217',
    name: 'Deepika Nair',
    email: 'deepika.nair@example.com',
    address: '258 BTM Layout',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560076',
    customerId: 'CUST007',
    status: 'Active',
    totalOrders: 10,
    totalSpent: 3000,
    lastOrderDate: new Date('2025-10-30')
  },
  {
    phoneNumber: '+91 9876543218',
    name: 'Karthik Iyer',
    email: 'karthik.iyer@example.com',
    address: '369 Marathahalli',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560037',
    status: 'Active',
    totalOrders: 6,
    totalSpent: 1800,
    lastOrderDate: new Date('2025-10-25')
  },
  {
    phoneNumber: '+91 9876543219',
    name: 'Pooja Gupta',
    email: 'pooja.gupta@example.com',
    address: '741 Electronic City',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560100',
    customerId: 'CUST008',
    notes: 'Allergic to fabric softener',
    status: 'Active',
    totalOrders: 14,
    totalSpent: 4200,
    lastOrderDate: new Date('2025-11-03')
  },
  {
    phoneNumber: '+91 9876543220',
    name: 'Suresh Rao',
    email: 'suresh.rao@example.com',
    address: '852 Yelahanka',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560064',
    status: 'Active',
    totalOrders: 9,
    totalSpent: 2700,
    lastOrderDate: new Date('2025-10-29')
  },
  {
    phoneNumber: '+91 9876543221',
    name: 'Meera Krishnan',
    email: 'meera.k@example.com',
    address: '963 Malleshwaram',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560003',
    customerId: 'CUST009',
    status: 'Active',
    totalOrders: 18,
    totalSpent: 5400,
    lastOrderDate: new Date('2025-11-05')
  },
  {
    phoneNumber: '+91 9876543222',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@example.com',
    address: '159 Bannerghatta Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560076',
    status: 'Active',
    totalOrders: 4,
    totalSpent: 1200,
    lastOrderDate: new Date('2025-10-20')
  },
  {
    phoneNumber: '+91 9876543223',
    name: 'Lakshmi Menon',
    email: 'lakshmi.m@example.com',
    address: '357 JP Nagar',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560078',
    customerId: 'CUST010',
    notes: 'Weekly pickup',
    status: 'Active',
    totalOrders: 25,
    totalSpent: 7500,
    lastOrderDate: new Date('2025-11-04')
  },
  {
    phoneNumber: '+91 9876543224',
    name: 'Naveen Kumar',
    email: 'naveen.kumar@example.com',
    address: '468 Sarjapur Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560035',
    status: 'Inactive',
    totalOrders: 3,
    totalSpent: 900,
    lastOrderDate: new Date('2025-09-15')
  },
  {
    phoneNumber: '+91 9876543225',
    name: 'Divya Bhat',
    email: 'divya.bhat@example.com',
    address: '579 Basavanagudi',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560004',
    customerId: 'CUST011',
    status: 'Active',
    totalOrders: 11,
    totalSpent: 3300,
    lastOrderDate: new Date('2025-11-02')
  },
  {
    phoneNumber: '+91 9876543226',
    name: 'Aditya Joshi',
    email: 'aditya.joshi@example.com',
    address: '680 RT Nagar',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560032',
    status: 'Active',
    totalOrders: 13,
    totalSpent: 3900,
    lastOrderDate: new Date('2025-11-01')
  },
  {
    phoneNumber: '+91 9876543227',
    name: 'Kavya Shetty',
    email: 'kavya.shetty@example.com',
    address: '791 Rajajinagar',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560010',
    customerId: 'CUST012',
    notes: 'Cash on delivery only',
    status: 'Active',
    totalOrders: 16,
    totalSpent: 4800,
    lastOrderDate: new Date('2025-11-05')
  },
  {
    phoneNumber: '+91 9876543228',
    name: 'Rohan Das',
    email: 'rohan.das@example.com',
    address: '802 Hebbal',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560024',
    status: 'Inactive',
    totalOrders: 2,
    totalSpent: 600,
    lastOrderDate: new Date('2025-08-10')
  },
  {
    phoneNumber: '+91 9876543229',
    name: 'Sonia Kapoor',
    email: 'sonia.kapoor@example.com',
    address: '913 Bellandur',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560103',
    customerId: 'CUST013',
    notes: 'Premium customer - Same day delivery',
    status: 'Active',
    totalOrders: 22,
    totalSpent: 6600,
    lastOrderDate: new Date('2025-11-05')
  }
];

async function seedCustomers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing customers
    console.log('🗑️  Clearing existing customers...');
    await Customer.deleteMany({});

    // Insert sample customers
    console.log('📝 Adding 20 sample customers...');
    await Customer.insertMany(sampleCustomers);

    console.log('✅ Successfully added 20 sample customers!');
    console.log('\n📊 Sample customers added:');
    sampleCustomers.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.name} - ${customer.phoneNumber}`);
    });

    console.log('\n🎉 Database seeding complete!');
    console.log('🌐 Go to: http://localhost:3000/customers');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding customers:', error);
    process.exit(1);
  }
}

seedCustomers();

