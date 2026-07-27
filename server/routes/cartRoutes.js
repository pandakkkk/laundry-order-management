const express = require('express');
const cartController = require('../controllers/cartController');
const { attachCustomer, protectCustomer } = require('../middleware/auth');

const router = express.Router();

// All cart routes tolerate anonymous sessions via X-Cart-Session header, so we use attachCustomer
// (optional auth) rather than protectCustomer. The merge endpoint requires auth.
router.use(attachCustomer);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.patch('/items/:itemId', cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.put('/pickup-slot', cartController.setPickupSlot);
router.post('/apply-coupon', cartController.applyCoupon);
router.delete('/coupon', cartController.removeCoupon);
router.post('/apply-wallet', cartController.applyWallet);
router.delete('/wallet', cartController.removeWallet);
router.delete('/', cartController.clearCart);
router.post('/merge', protectCustomer, cartController.mergeGuestCart);

module.exports = router;
