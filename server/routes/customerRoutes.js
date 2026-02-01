const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const {
  getCustomers,
  getCustomer,
  searchByPhone,
  searchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  bulkImportCustomers,
  getCustomerOrderHistory,
  getCustomerAnalytics,
  getNextCustomerId,
  getCustomerByPhone
} = require('../controllers/customerController');

// All routes require authentication
router.use(protect);

// Get all customers (requires customer:view permission)
router.get('/', 
  checkPermission(PERMISSIONS.CUSTOMER_VIEW),
  getCustomers
);

// Get customer statistics
router.get('/stats',
  checkPermission(PERMISSIONS.CUSTOMER_VIEW),
  getCustomerStats
);

// Get next customer ID (for auto-generation preview)
router.get('/next-id',
  checkPermission(PERMISSIONS.CUSTOMER_VIEW),
  getNextCustomerId
);

// Get customer by exact phone number (for auto-populate)
router.get('/phone/:phone',
  checkPermission(PERMISSIONS.CUSTOMER_VIEW),
  getCustomerByPhone
);

// Search customers by phone
router.get('/search',
  checkPermission(PERMISSIONS.CUSTOMER_VIEW),
  searchByPhone
);

// Search customers by multiple fields
router.get('/search/query',
  checkPermission(PERMISSIONS.CUSTOMER_VIEW),
  searchCustomers
);

// Get customer order history (must be before /:id route)
router.get('/:id/orders',
  checkPermission(PERMISSIONS.CUSTOMER_VIEW),
  getCustomerOrderHistory
);

// Get customer analytics (must be before /:id route)
router.get('/:id/analytics',
  checkPermission(PERMISSIONS.CUSTOMER_VIEW),
  getCustomerAnalytics
);

// Get single customer
router.get('/:id',
  checkPermission(PERMISSIONS.CUSTOMER_VIEW),
  getCustomer
);

// Create new customer
router.post('/',
  checkPermission(PERMISSIONS.CUSTOMER_CREATE),
  createCustomer
);

// Bulk import customers
router.post('/bulk-import',
  checkPermission(PERMISSIONS.CUSTOMER_CREATE),
  bulkImportCustomers
);

// Update customer
router.put('/:id',
  checkPermission(PERMISSIONS.CUSTOMER_UPDATE),
  updateCustomer
);

// Delete customer
router.delete('/:id',
  checkPermission(PERMISSIONS.CUSTOMER_DELETE),
  deleteCustomer
);

module.exports = router;

