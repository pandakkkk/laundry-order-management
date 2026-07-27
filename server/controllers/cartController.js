const crypto = require('crypto');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const couponService = require('../services/couponService');
const walletService = require('../services/walletService');
const subscriptionService = require('../services/subscriptionService');

function newSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

// Locate an existing cart for the caller. Priority:
//   1. authenticated customer -> customerId
//   2. sessionId header
// Never returns null; if none found, returns { cart: null, sessionId }
async function findCart(req) {
  if (req.customer) {
    const cart = await Cart.findOne({ customerId: req.customer._id });
    return { cart, sessionId: null, ownerFilter: { customerId: req.customer._id } };
  }
  const sessionId = req.headers['x-cart-session'];
  if (sessionId) {
    const cart = await Cart.findOne({ sessionId, customerId: null });
    return { cart, sessionId, ownerFilter: { sessionId, customerId: null } };
  }
  return { cart: null, sessionId: null, ownerFilter: null };
}

function serialiseCart(cart, extra = {}) {
  if (!cart) {
    return {
      items: [], subtotal: 0, discountAmount: 0, walletApplied: 0,
      subscriptionCovered: 0, subscriptionCoverage: null, total: 0,
      ...extra
    };
  }
  return {
    id: cart._id,
    items: cart.items,
    couponCode: cart.couponCode,
    discountAmount: cart.discountAmount,
    walletApplied: cart.walletApplied,
    subscriptionCovered: cart.subscriptionCovered || 0,
    subscriptionCoverage: cart.subscriptionCoverage || null,
    subtotal: cart.subtotal,
    total: cart.total,
    pickupSlot: cart.pickupSlot,
    updatedAt: cart.updatedAt,
    expiresAt: cart.expiresAt,
    ...extra
  };
}

// Recompute subscription coverage against the customer's active subscription. Also clamps
// walletApplied to the new max so previous customer-toggled state stays consistent.
async function refreshSubscriptionCoverage(cart, customer) {
  if (!customer) {
    cart.subscriptionCovered = 0;
    cart.subscriptionCoverage = { subscriptionId: null, breakdown: [], computedAt: new Date() };
    return;
  }
  const preview = await subscriptionService.previewCoverage(customer, cart);
  cart.subscriptionCovered = preview.covered;
  cart.subscriptionCoverage = {
    subscriptionId: preview.subscriptionId,
    breakdown: preview.breakdown,
    computedAt: new Date()
  };
}

// Re-run the full pipeline: coverage → recomputeTotals → clamp wallet to new max.
async function recomputeAll(cart, customer) {
  await refreshSubscriptionCoverage(cart, customer);
  cart.recomputeTotals();
  const maxWallet = Math.max(0, cart.subtotal - cart.subscriptionCovered - cart.discountAmount);
  if (cart.walletApplied > maxWallet) {
    cart.walletApplied = maxWallet;
    cart.recomputeTotals();
  }
}

async function getOrCreateCart(req) {
  const { cart, sessionId, ownerFilter } = await findCart(req);
  if (cart) return { cart, sessionId, isNew: false };

  const doc = { items: [] };
  if (req.customer) {
    doc.customerId = req.customer._id;
  } else {
    doc.sessionId = sessionId || newSessionId();
  }
  const created = await Cart.create(doc);
  return { cart: created, sessionId: doc.sessionId || null, isNew: true };
}

// Resolve authoritative price for a line item. Prefer Product master; fall back to client price
// only when no productId is supplied (support ad-hoc items during MVP).
function sameOptions(a, b) {
  const aObj = a instanceof Map ? Object.fromEntries(a) : (a || {});
  const bObj = b instanceof Map ? Object.fromEntries(b) : (b || {});
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => aObj[k] === bObj[k]);
}

function priceForOptions(product, selectedOptions) {
  if (!product.hasOptions || !product.options || !selectedOptions) return 0;
  let extra = 0;
  for (const [key, value] of Object.entries(selectedOptions)) {
    const bucket = product.options[key];
    if (!Array.isArray(bucket)) continue;
    const match = bucket.find((o) => o.value === value);
    if (match && typeof match.price === 'number') extra += match.price;
  }
  return extra;
}

async function resolvePrice(item) {
  if (item.productId) {
    let product = await Product.findOne({ productId: item.productId, isActive: true });
    if (!product) {
      product = await Product.create({
        productId: item.productId,
        name: item.description || item.productId,
        category: 'others',
        basePrice: item.price || 149,
        isActive: true
      }).catch(() => null);
    }
    const basePrice = (typeof item.price === 'number' && item.price > 0)
      ? item.price
      : (product ? product.basePrice : 149);
    const optionsPrice = product ? priceForOptions(product, item.selectedOptions) : 0;
    return {
      price: basePrice + optionsPrice,
      description: item.description || (product ? product.name : item.productId)
    };
  }
  if (typeof item.price !== 'number' || item.price < 0) {
    const err = new Error('price required for ad-hoc items');
    err.status = 400;
    throw err;
  }
  return { price: item.price, description: item.description };
}

exports.getCart = async (req, res) => {
  try {
    const { cart, sessionId } = await findCart(req);
    if (cart) {
      await recomputeAll(cart, req.customer);
      await cart.save();
    }
    return res.json({
      success: true,
      cart: serialiseCart(cart),
      sessionId: sessionId || undefined
    });
  } catch (error) {
    console.error('getCart error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch cart' });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { productId, description, quantity, price, selectedOptions } = req.body;
    if (!description && !productId) {
      return res.status(400).json({ success: false, error: 'productId or description required' });
    }
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    const resolved = await resolvePrice({ productId, description, price, selectedOptions });
    const { cart, sessionId } = await getOrCreateCart(req);

    const existing = productId
      ? cart.items.find(
          (line) =>
            line.productId === productId &&
            line.description === resolved.description &&
            sameOptions(line.selectedOptions, selectedOptions)
        )
      : null;

    if (existing) {
      existing.quantity += qty;
    } else {
      cart.items.push({
        productId: productId || undefined,
        description: resolved.description,
        quantity: qty,
        price: resolved.price,
        selectedOptions: selectedOptions || undefined
      });
    }
    await recomputeAll(cart, req.customer);
    await cart.save();

    return res.json({ success: true, cart: serialiseCart(cart), sessionId: sessionId || undefined });
  } catch (error) {
    const status = error.status || 500;
    console.error('addItem error:', error);
    return res.status(status).json({ success: false, error: error.message || 'Failed to add item' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity, selectedOptions } = req.body;

    const { cart } = await findCart(req);
    if (!cart) return res.status(404).json({ success: false, error: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });

    if (quantity !== undefined) {
      const qty = parseInt(quantity, 10);
      if (!Number.isFinite(qty) || qty < 1) {
        return res.status(400).json({ success: false, error: 'quantity must be >= 1' });
      }
      item.quantity = qty;
    }
    if (selectedOptions !== undefined) {
      item.selectedOptions = selectedOptions;
      if (item.productId) {
        const resolved = await resolvePrice({
          productId: item.productId,
          description: item.description,
          selectedOptions
        });
        item.price = resolved.price;
      }
    }
    await recomputeAll(cart, req.customer);
    await cart.save();

    return res.json({ success: true, cart: serialiseCart(cart) });
  } catch (error) {
    console.error('updateItem error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update item' });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { cart } = await findCart(req);
    if (!cart) return res.status(404).json({ success: false, error: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });

    item.deleteOne();
    await recomputeAll(cart, req.customer);
    await cart.save();

    return res.json({ success: true, cart: serialiseCart(cart) });
  } catch (error) {
    console.error('removeItem error:', error);
    return res.status(500).json({ success: false, error: 'Failed to remove item' });
  }
};

exports.setPickupSlot = async (req, res) => {
  try {
    const { date, timeWindow, address, city, pincode, landmark } = req.body;
    const { cart, sessionId } = await getOrCreateCart(req);

    cart.pickupSlot = {
      date: date ? new Date(date) : undefined,
      timeWindow,
      address,
      city,
      pincode,
      landmark
    };
    cart.recomputeTotals();
    await cart.save();

    return res.json({ success: true, cart: serialiseCart(cart), sessionId: sessionId || undefined });
  } catch (error) {
    console.error('setPickupSlot error:', error);
    return res.status(500).json({ success: false, error: 'Failed to set pickup slot' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const { cart } = await findCart(req);
    if (!cart) return res.json({ success: true, cart: serialiseCart(null) });

    await cart.deleteOne();
    return res.json({ success: true, cart: serialiseCart(null) });
  } catch (error) {
    console.error('clearCart error:', error);
    return res.status(500).json({ success: false, error: 'Failed to clear cart' });
  }
};

// POST /api/cart/apply-coupon { code }
exports.applyCoupon = async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ success: false, error: 'Coupon code required' });

    const { cart, sessionId } = await getOrCreateCart(req);
    if (!cart.items.length) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }
    // Refresh coverage first — coupon is discountable-value-aware.
    await refreshSubscriptionCoverage(cart, req.customer);
    cart.recomputeTotals();

    const { coupon, discountAmount } = await couponService.validateForCart({
      code,
      cart,
      customer: req.customer
    });

    cart.couponCode = coupon.code;
    cart.discountAmount = discountAmount;
    await recomputeAll(cart, req.customer);
    await cart.save();

    return res.json({ success: true, cart: serialiseCart(cart), sessionId: sessionId || undefined });
  } catch (error) {
    const status = error.status || 500;
    if (error.status) {
      return res.status(status).json({ success: false, error: error.message, code: error.code });
    }
    console.error('applyCoupon error:', error);
    return res.status(500).json({ success: false, error: 'Failed to apply coupon' });
  }
};

// DELETE /api/cart/coupon
exports.removeCoupon = async (req, res) => {
  try {
    const { cart } = await findCart(req);
    if (!cart) return res.json({ success: true, cart: serialiseCart(null) });
    cart.couponCode = null;
    cart.discountAmount = 0;
    await recomputeAll(cart, req.customer);
    await cart.save();
    return res.json({ success: true, cart: serialiseCart(cart) });
  } catch (error) {
    console.error('removeCoupon error:', error);
    return res.status(500).json({ success: false, error: 'Failed to remove coupon' });
  }
};

// POST /api/cart/apply-wallet { amount? }  — omit amount to apply the max applicable.
exports.applyWallet = async (req, res) => {
  try {
    if (!req.customer) {
      return res.status(401).json({ success: false, error: 'Login required to use wallet' });
    }
    const { cart } = await getOrCreateCart(req);
    if (!cart.items.length) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }
    await refreshSubscriptionCoverage(cart, req.customer);
    cart.recomputeTotals();

    const balance = await walletService.getBalance(req.customer._id);
    const maxWallet = Math.max(0, cart.subtotal - cart.subscriptionCovered - cart.discountAmount);
    const requested = req.body?.amount != null ? Number(req.body.amount) : Math.min(balance, maxWallet);
    if (!Number.isFinite(requested) || requested < 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    const applied = Math.max(0, Math.min(requested, balance, maxWallet));
    cart.walletApplied = Math.floor(applied);
    cart.recomputeTotals();
    await cart.save();

    return res.json({
      success: true,
      cart: serialiseCart(cart),
      walletBalance: balance,
      applied: cart.walletApplied
    });
  } catch (error) {
    console.error('applyWallet error:', error);
    return res.status(500).json({ success: false, error: 'Failed to apply wallet' });
  }
};

// DELETE /api/cart/wallet
exports.removeWallet = async (req, res) => {
  try {
    const { cart } = await findCart(req);
    if (!cart) return res.json({ success: true, cart: serialiseCart(null) });
    cart.walletApplied = 0;
    await recomputeAll(cart, req.customer);
    await cart.save();
    return res.json({ success: true, cart: serialiseCart(cart) });
  } catch (error) {
    console.error('removeWallet error:', error);
    return res.status(500).json({ success: false, error: 'Failed to remove wallet' });
  }
};

// Guest cart -> authenticated customer migration. Called after login if the client held a sessionId.
exports.mergeGuestCart = async (req, res) => {
  try {
    if (!req.customer) {
      return res.status(401).json({ success: false, error: 'Login required' });
    }
    const sessionId = req.body.sessionId || req.headers['x-cart-session'];
    if (!sessionId) return res.json({ success: true, cart: serialiseCart(null) });

    const guestCart = await Cart.findOne({ sessionId, customerId: null });
    if (!guestCart) return res.json({ success: true, cart: serialiseCart(null) });

    let userCart = await Cart.findOne({ customerId: req.customer._id });
    if (!userCart) {
      guestCart.customerId = req.customer._id;
      guestCart.sessionId = undefined;
      await recomputeAll(guestCart, req.customer);
      await guestCart.save();
      return res.json({ success: true, cart: serialiseCart(guestCart) });
    }

    for (const item of guestCart.items) {
      userCart.items.push(item.toObject());
    }
    await recomputeAll(userCart, req.customer);
    await userCart.save();
    await guestCart.deleteOne();

    return res.json({ success: true, cart: serialiseCart(userCart) });
  } catch (error) {
    console.error('mergeGuestCart error:', error);
    return res.status(500).json({ success: false, error: 'Failed to merge cart' });
  }
};
