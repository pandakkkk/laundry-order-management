const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  updateProductPrice,
  deleteProduct,
  bulkUpdatePrices,
  resetToDefaults
} = require('../controllers/productController');
const { protect, authorize, checkPermission } = require('../middleware/auth');

// Public routes (for fetching products - anyone can view)
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected routes (admin/manager only for modifications)
router.post('/', protect, authorize('admin', 'manager'), createProduct);
router.put('/:id', protect, authorize('admin', 'manager'), updateProduct);
router.patch('/:id/price', protect, authorize('admin', 'manager'), updateProductPrice);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

// Bulk operations (admin only)
router.post('/bulk/update-prices', protect, authorize('admin', 'manager'), bulkUpdatePrices);
router.post('/reset-defaults', protect, authorize('admin'), resetToDefaults);

module.exports = router;
