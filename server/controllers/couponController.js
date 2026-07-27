const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const couponService = require('../services/couponService');

// POST /api/coupons/validate  { code }
// Preview validation against the caller's current cart. Does not mutate.
exports.validate = async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ success: false, error: 'Coupon code required' });

    let cart = null;
    if (req.customer) cart = await Cart.findOne({ customerId: req.customer._id });
    else {
      const sessionId = req.headers['x-cart-session'];
      if (sessionId) cart = await Cart.findOne({ sessionId, customerId: null });
    }
    if (!cart) return res.status(400).json({ success: false, error: 'No active cart' });

    const { coupon, discountAmount } = await couponService.validateForCart({
      code,
      cart,
      customer: req.customer
    });

    return res.json({
      success: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        description: coupon.description
      },
      discountAmount,
      newTotal: Math.max(0, cart.subtotal - discountAmount - (cart.walletApplied || 0))
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message, code: error.code });
    }
    console.error('coupon validate error:', error);
    return res.status(500).json({ success: false, error: 'Failed to validate coupon' });
  }
};

// GET /api/coupons  (admin)
exports.list = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: coupons });
  } catch (error) {
    console.error('list coupons error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list coupons' });
  }
};

// GET /api/coupons/:code  (admin)
exports.get = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase() });
    if (!coupon) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: coupon });
  } catch (error) {
    console.error('get coupon error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch coupon' });
  }
};

// POST /api/coupons  (admin)
exports.create = async (req, res) => {
  try {
    const coupon = await Coupon.create({
      ...req.body,
      code: String(req.body.code || '').toUpperCase().trim()
    });
    return res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    console.error('create coupon error:', error);
    return res.status(400).json({ success: false, error: error.message });
  }
};

// PATCH /api/coupons/:code  (admin)
exports.update = async (req, res) => {
  try {
    const update = { ...req.body };
    delete update.code;
    delete update.usageCount; // usage tracked internally
    const coupon = await Coupon.findOneAndUpdate(
      { code: req.params.code.toUpperCase() },
      update,
      { new: true }
    );
    if (!coupon) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: coupon });
  } catch (error) {
    console.error('update coupon error:', error);
    return res.status(400).json({ success: false, error: error.message });
  }
};

// DELETE /api/coupons/:code  (admin)
exports.remove = async (req, res) => {
  try {
    const coupon = await Coupon.findOneAndUpdate(
      { code: req.params.code.toUpperCase() },
      { isActive: false },
      { new: true }
    );
    if (!coupon) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: coupon });
  } catch (error) {
    console.error('remove coupon error:', error);
    return res.status(500).json({ success: false, error: 'Failed to deactivate' });
  }
};
