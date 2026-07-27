const express = require('express');
const webhookController = require('../controllers/webhookController');

const router = express.Router();

// Raw body is REQUIRED — signature is HMAC over the exact bytes Razorpay sent.
// Do NOT mount express.json() before this handler.
router.post(
  '/razorpay',
  express.raw({ type: 'application/json', limit: '1mb' }),
  webhookController.razorpay
);

module.exports = router;
