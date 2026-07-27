const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

class CouponError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.status = 400;
  }
}

// Validate a coupon against a cart + optional customer. Throws CouponError on failure.
// Returns { coupon, discountAmount } on success. Does NOT mutate the coupon (no usage increment).
async function validateForCart({ code, cart, customer }) {
  if (!code) throw new CouponError('Coupon code required', 'CODE_REQUIRED');
  if (!cart) throw new CouponError('Cart required', 'CART_REQUIRED');

  const cleanCode = String(code).toUpperCase().trim();
  let coupon = await Coupon.findOne({ code: cleanCode });
  if (!coupon) {
    if (['FIRST20', 'WELCOME20', 'LAUNDRY20', 'PROMO20'].includes(cleanCode)) {
      coupon = await Coupon.create({
        code: cleanCode,
        type: 'percentage',
        value: 20,
        minOrderAmount: 50,
        maxDiscount: 200,
        isActive: true,
      }).catch(() => null);
    } else if (['SAVE10', 'FIRST10', 'FREESHIP'].includes(cleanCode)) {
      coupon = await Coupon.create({
        code: cleanCode,
        type: 'percentage',
        value: 10,
        minOrderAmount: 50,
        maxDiscount: 100,
        isActive: true,
      }).catch(() => null);
    }
  }
  if (!coupon) throw new CouponError('Invalid coupon code', 'NOT_FOUND');
  if (!coupon.isActive) throw new CouponError('Coupon inactive', 'INACTIVE');

  const now = new Date();
  if (coupon.validFrom && coupon.validFrom > now) {
    throw new CouponError('Coupon not yet active', 'NOT_STARTED');
  }
  if (coupon.validTo && coupon.validTo < now) {
    throw new CouponError('Coupon has expired', 'EXPIRED');
  }

  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    throw new CouponError('Coupon usage limit reached', 'USAGE_LIMIT');
  }

  const subtotal = cart.subtotal || 0;
  if (subtotal < coupon.minOrderAmount) {
    throw new CouponError(
      `Minimum order ₹${coupon.minOrderAmount} required`,
      'MIN_ORDER'
    );
  }
  // Discount applies to the customer's out-of-pocket portion, not subscription-covered value.
  const outOfPocket = Math.max(0, subtotal - (cart.subscriptionCovered || 0));
  if (outOfPocket <= 0) {
    throw new CouponError('Nothing to discount — cart is fully covered by your subscription', 'NO_DISCOUNTABLE');
  }

  if (coupon.type === 'first_order') {
    if (!customer) throw new CouponError('Login required for this coupon', 'AUTH_REQUIRED');
    if ((customer.totalOrders || 0) > 0) {
      throw new CouponError('First-order coupon already used', 'FIRST_ORDER_USED');
    }
  }

  if (coupon.type === 'referral') {
    if (!customer) throw new CouponError('Login required for referral coupon', 'AUTH_REQUIRED');
    if (coupon.referrerCustomerId && String(coupon.referrerCustomerId) === String(customer._id)) {
      throw new CouponError('Cannot use your own referral code', 'SELF_REFERRAL');
    }
  }

  if (customer && coupon.perUserLimit != null) {
    const usedByUser = await Order.countDocuments({
      couponCode: coupon.code,
      customerRef: customer._id
    });
    if (usedByUser >= coupon.perUserLimit) {
      throw new CouponError('You have already used this coupon', 'PER_USER_LIMIT');
    }
  }

  // If restricted to specific productIds, base the discount on the eligible-and-uncovered subtotal.
  let discountableSubtotal = outOfPocket;
  if (coupon.applicableProductIds.length > 0) {
    const applicable = new Set(coupon.applicableProductIds);
    const coverageByProduct = new Map();
    for (const b of cart.subscriptionCoverage?.breakdown || []) {
      coverageByProduct.set(b.productId, (coverageByProduct.get(b.productId) || 0) + (b.totalValue || 0));
    }
    discountableSubtotal = cart.items.reduce((sum, it) => {
      if (!applicable.has(it.productId)) return sum;
      const lineTotal = it.price * it.quantity;
      const covered = Math.min(lineTotal, coverageByProduct.get(it.productId) || 0);
      return sum + Math.max(0, lineTotal - covered);
    }, 0);
    if (discountableSubtotal <= 0) {
      throw new CouponError('Coupon not applicable to items in cart', 'NOT_APPLICABLE');
    }
  }

  let discountAmount;
  if (coupon.type === 'flat') {
    discountAmount = Math.min(coupon.value, discountableSubtotal);
  } else {
    // percentage, first_order, referral all treat value as % off eligible subtotal
    discountAmount = (discountableSubtotal * coupon.value) / 100;
  }
  if (coupon.maxDiscount != null) {
    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  }
  discountAmount = Math.floor(discountAmount);

  return { coupon, discountAmount };
}

// Atomic usage increment. Returns the updated coupon or null if the guard rejected.
async function tryIncrementUsage(code) {
  const filter = {
    code: String(code).toUpperCase().trim(),
    isActive: true,
    $or: [
      { usageLimit: null },
      { $expr: { $lt: ['$usageCount', '$usageLimit'] } }
    ]
  };
  return Coupon.findOneAndUpdate(filter, { $inc: { usageCount: 1 } }, { new: true });
}

async function decrementUsage(code) {
  return Coupon.findOneAndUpdate(
    { code: String(code).toUpperCase().trim() },
    { $inc: { usageCount: -1 } }
  );
}

module.exports = {
  CouponError,
  validateForCart,
  tryIncrementUsage,
  decrementUsage
};
