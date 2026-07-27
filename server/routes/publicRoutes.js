const express = require('express');
const rateLimit = require('express-rate-limit');
const { validatePublicApiKey } = require('../middleware/auth');
const { createPublicOrder, getPublicOrderStatus } = require('../controllers/publicOrderController');

const router = express.Router();

const publicOrderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

router.post('/orders', publicOrderLimiter, validatePublicApiKey, createPublicOrder);
router.get('/orders/:ticketNumber', validatePublicApiKey, getPublicOrderStatus);

module.exports = router;
