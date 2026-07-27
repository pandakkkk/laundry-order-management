const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const Otp = require('../models/Otp');
const { generateCustomerToken } = require('../middleware/auth');
const { sendSMS } = require('../services/notificationService');

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_LENGTH = 6;
const BCRYPT_ROUNDS = 10;

function normalisePhone(raw) {
  let cleaned = String(raw || '').replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  if (cleaned.length === 10) cleaned = '91' + cleaned;
  return cleaned;
}

function generateOtpCode() {
  const max = 10 ** OTP_LENGTH;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(OTP_LENGTH, '0');
}

exports.requestOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const phone = normalisePhone(req.body.phoneNumber);
    if (phone.length !== 12) {
      return res.status(400).json({ success: false, error: 'Invalid phone number' });
    }

    // Invalidate any prior unconsumed OTPs for this phone
    await Otp.deleteMany({ phoneNumber: phone, consumedAt: null });

    const code = generateOtpCode();
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);

    await Otp.create({
      phoneNumber: phone,
      codeHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MS)
    });

    const message = `Your Laundryman verification code is ${code}. Valid for 10 minutes. Do not share this code with anyone.`;
    const smsResult = await sendSMS(phone, message);

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[DEV] OTP for ${phone}: ${code}`);
    }

    return res.json({
      success: true,
      message: 'OTP sent',
      expiresInSeconds: OTP_TTL_MS / 1000,
      delivery: smsResult?.success ? 'sms' : 'attempted'
    });
  } catch (error) {
    console.error('requestOtp error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const phone = normalisePhone(req.body.phoneNumber);
    const submittedCode = String(req.body.code || '').trim();
    const referralCode = req.body.referralCode
      ? String(req.body.referralCode).trim().toUpperCase()
      : null;

    if (!phone || !submittedCode) {
      return res.status(400).json({ success: false, error: 'Phone and code required' });
    }

    const otp = await Otp.findOne({
      phoneNumber: phone,
      consumedAt: null,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!otp) {
      return res.status(400).json({ success: false, error: 'OTP expired or not found' });
    }

    if (otp.attempts >= otp.maxAttempts) {
      return res.status(429).json({ success: false, error: 'Too many attempts, request a new OTP' });
    }

    const match = await bcrypt.compare(submittedCode, otp.codeHash);
    if (!match) {
      otp.attempts += 1;
      await otp.save();
      return res.status(400).json({ success: false, error: 'Invalid code' });
    }

    otp.consumedAt = new Date();
    await otp.save();

    let customer = await Customer.findOne({ phoneNumber: phone });
    let isNewCustomer = false;

    if (!customer) {
      let referrer = null;
      if (referralCode) {
        referrer = await Customer.findOne({ referralCode, status: 'Active' });
      }
      customer = await Customer.create({
        phoneNumber: phone,
        authProvider: 'otp',
        referredBy: referrer ? referrer._id : null
      });
      isNewCustomer = true;
    } else if (customer.authProvider === 'staff_created') {
      customer.authProvider = 'otp';
    }

    customer.lastLoginAt = new Date();
    await customer.save();

    const token = generateCustomerToken(customer._id);

    return res.json({
      success: true,
      token,
      isNewCustomer,
      customer: {
        id: customer._id,
        phoneNumber: customer.phoneNumber,
        name: customer.name,
        email: customer.email,
        referralCode: customer.referralCode
      }
    });
  } catch (error) {
    console.error('verifyOtp error:', error);
    return res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const customer = req.customer;
    return res.json({
      success: true,
      customer: {
        id: customer._id,
        phoneNumber: customer.phoneNumber,
        name: customer.name,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        referralCode: customer.referralCode,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent
      }
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const customer = req.customer;
    const allowed = ['name', 'email', 'address', 'city', 'state', 'pincode'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        customer[key] = req.body[key];
      }
    }
    await customer.save();
    return res.json({ success: true, customer });
  } catch (error) {
    console.error('updateMe error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};
