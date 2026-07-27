const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Validate static API key for public endpoints (timing-safe comparison)
exports.validatePublicApiKey = (req, res, next) => {
  const key = req.headers['x-public-api-key'];
  const expected = process.env.PUBLIC_API_KEY;

  if (!expected) {
    console.error('PUBLIC_API_KEY not set in environment');
    return res.status(500).json({ success: false, error: 'Server misconfiguration' });
  }

  if (!key) {
    return res.status(401).json({ success: false, error: 'API key required' });
  }

  try {
    const keyBuf = Buffer.from(key);
    const expectedBuf = Buffer.from(expected);
    if (keyBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(keyBuf, expectedBuf)) {
      return res.status(401).json({ success: false, error: 'Invalid API key' });
    }
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid API key' });
  }

  next();
};
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Generate JWT token for staff users
exports.generateToken = (userId) => {
  return jwt.sign({ id: userId, type: 'user' }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE
  });
};

// Generate JWT token for customers
exports.generateCustomerToken = (customerId) => {
  return jwt.sign({ id: customerId, type: 'customer' }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE
  });
};

// Verify customer JWT (rejects staff tokens)
exports.protectCustomer = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'customer') {
      return res.status(401).json({ success: false, error: 'Invalid token type' });
    }

    const customer = await Customer.findById(decoded.id);
    if (!customer) {
      return res.status(401).json({ success: false, error: 'Customer not found' });
    }
    if (customer.status === 'Blocked') {
      return res.status(403).json({ success: false, error: 'Account blocked' });
    }

    req.customer = customer;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Not authorized' });
  }
};

// Optional customer auth — attaches req.customer if a valid customer token is present, else continues
exports.attachCustomer = async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    return next();
  }
  const token = req.headers.authorization.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type === 'customer') {
      const customer = await Customer.findById(decoded.id);
      if (customer && customer.status !== 'Blocked') {
        req.customer = customer;
      }
    }
  } catch {
    // ignore invalid token — treat as guest
  }
  next();
};

// Verify JWT token middleware
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User account is deactivated'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check for specific permission
exports.checkPermission = (permission) => {
  const { hasPermission } = require('../config/permissions');
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to perform this action',
        required: permission
      });
    }
    
    next();
  };
};

// Check for any of the permissions
exports.checkAnyPermission = (...permissions) => {
  const { hasAnyPermission } = require('../config/permissions');
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to perform this action',
        required: permissions
      });
    }
    
    next();
  };
};

// Check for all permissions
exports.checkAllPermissions = (...permissions) => {
  const { hasAllPermissions } = require('../config/permissions');
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have all required permissions',
        required: permissions
      });
    }
    
    next();
  };
};

