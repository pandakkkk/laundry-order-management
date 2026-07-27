const express = require('express');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { body } = require('express-validator');
const customerAuth = require('../controllers/customerAuthController');
const { protectCustomer } = require('../middleware/auth');

const router = express.Router();

const phoneOrIpKey = (req, res) => {
  const phone = req.body?.phoneNumber;
  return phone ? `phone:${String(phone)}` : `ip:${ipKeyGenerator(req, res)}`;
};

const requestOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: phoneOrIpKey,
  message: { success: false, error: 'Too many OTP requests, try again later' }
});

const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: phoneOrIpKey,
  message: { success: false, error: 'Too many verification attempts' }
});

router.post(
  '/request-otp',
  requestOtpLimiter,
  [body('phoneNumber').isString().notEmpty().withMessage('phoneNumber required')],
  customerAuth.requestOtp
);

router.post(
  '/verify-otp',
  verifyOtpLimiter,
  [
    body('phoneNumber').isString().notEmpty(),
    body('code').isString().isLength({ min: 4, max: 8 })
  ],
  customerAuth.verifyOtp
);

router.get('/me', protectCustomer, customerAuth.getMe);
router.patch('/me', protectCustomer, customerAuth.updateMe);

module.exports = router;
