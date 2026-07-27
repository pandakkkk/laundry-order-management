const express = require('express');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const couponController = require('../controllers/couponController');
const { protect, attachCustomer } = require('../middleware/auth');

const router = express.Router();

const validateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => `ip:${ipKeyGenerator(req, res)}`,
  message: { success: false, error: 'Too many validation attempts' }
});

// Customer-facing (optional auth — anonymous carts allowed)
router.post('/validate', validateLimiter, attachCustomer, couponController.validate);

// Admin CRUD — staff only. Uses existing protect middleware.
router.get('/', protect, couponController.list);
router.get('/:code', protect, couponController.get);
router.post('/', protect, couponController.create);
router.patch('/:code', protect, couponController.update);
router.delete('/:code', protect, couponController.remove);

module.exports = router;
