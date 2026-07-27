const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const { validateEnv } = require('./config/env');
const mongoSanitize = require('./middleware/sanitize');
const logger = require('./utils/logger');

// Validate critical environment variables
validateEnv();

const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const productRoutes = require('./routes/productRoutes');
const publicRoutes = require('./routes/publicRoutes');
const customerAuthRoutes = require('./routes/customerAuthRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const couponRoutes = require('./routes/couponRoutes');
const walletRoutes = require('./routes/walletRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const customerOrderRoutes = require('./routes/customerOrderRoutes');
const leadRoutes = require('./routes/leadRoutes');
const { registerOrderListeners } = require('./events/orderListeners');
const { protect } = require('./middleware/auth');
const subscriptionCron = require('./services/subscriptionCron');
const walletReconciliationCron = require('./services/walletReconciliationCron');

// Register domain event listeners (Decoupled Event-Driven Architecture)
registerOrderListeners();

const app = express();
const PORT = process.env.PORT || 5001;

// Static origin allowlist. Includes the admin app's own Vercel URL so its
// same-project fetches (which Chrome sends with an Origin header for POST)
// aren't rejected by the CORS middleware.
const allowedOrigins = [
  'https://laundryman.pro',
  'https://www.laundryman.pro',
  'https://laundry-order-management.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.WBL_FE_ORIGIN,
  process.env.ADMIN_APP_ORIGIN
].filter(Boolean);

// Also allow Vercel preview deployments of this same project (URLs look like
// `laundry-order-management-<hash>-<user>.vercel.app`). Kept behind a regex so
// arbitrary *.vercel.app apps can't hit the API.
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/laundry-order-management(?:-[a-z0-9-]+)?\.vercel\.app$/i,
  /^https:\/\/laundryman-fe(?:-[a-z0-9-]+)?\.vercel\.app$/i
];

function isOriginAllowed(origin) {
  if (!origin) return true;                        // curl, mobile apps, server-to-server
  if (allowedOrigins.includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((rx) => rx.test(origin));
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Public-API-Key', 'X-Cart-Session', 'Accept'],
  credentials: true
}));
app.use(morgan('dev'));

// Webhook routes MUST be mounted before express.json() — Razorpay signature
// verification requires the raw request body bytes.
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize); // Sanitize inputs against NoSQL injection

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
    logger.info('Connected to MongoDB Atlas', {
      db: mongoose.connection.db.databaseName,
      host: mongoose.connection.host
    });
  })
  .catch((err) => {
    logger.error(`MongoDB Atlas connection failed: ${err.message}`);
  });

// Handle connection events
mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected successfully');
});

// Routes — public routes MUST be mounted before protect middleware
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customer/auth', customerAuthRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/customer/orders', customerOrderRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', protect, orderRoutes);
app.use('/api/notifications', protect, notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/products', productRoutes);

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
  logger.error(`Unhandled Request Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Start server only when run directly (not when imported)
let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });

  if (process.env.SUBSCRIPTION_CRON_ENABLED !== 'false') {
    subscriptionCron.start();
  }
  if (process.env.WALLET_RECONCILIATION_ENABLED !== 'false') {
    walletReconciliationCron.start();
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed.');
      process.exit(0);
    });
  } else {
    await mongoose.connection.close(false);
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;


