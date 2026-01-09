const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { protect } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-laundry-order-management:zJDQFtuf2xbTzoJC@laundry-order-managemen.nvjptop.mongodb.net/laundry-orders?retryWrites=true&w=majority';

// Connect to MongoDB Atlas
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10
})
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🌐 Cluster: ${mongoose.connection.host}`);
  })
  .catch((err) => {
    console.log('⚠️  MongoDB Atlas connection failed.');
    console.log('Error:', err.message);
    if (err.message.includes('authentication')) {
      console.log('💡 Tip: Check MongoDB Atlas Network Access - your IP may need to be whitelisted');
      console.log('   Go to: https://cloud.mongodb.com/ → Network Access → Add IP Address');
    }
    console.log('🔄 Server will continue, but database operations will fail until connection is established.');
  });

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', protect, orderRoutes);
app.use('/api/notifications', protect, notificationRoutes);
app.use('/api/reports', reportRoutes);

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Laundry Management System is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Start server only when run directly (not when imported)
if (require.main === module) {
  // Start server immediately (MongoDB will connect in background)
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
  });
}

module.exports = app;

