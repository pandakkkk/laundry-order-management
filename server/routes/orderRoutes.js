const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { checkPermission, checkAnyPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

// Get orders statistics (check first to avoid conflict with /:id)
router.get('/stats/summary', checkPermission(PERMISSIONS.ORDER_VIEW), orderController.getOrderStats);

// Search orders
router.get('/search/query', checkPermission(PERMISSIONS.ORDER_VIEW), orderController.searchOrders);

// Get all orders
router.get('/', checkPermission(PERMISSIONS.ORDER_VIEW), orderController.getAllOrders);

// Get order by ticket number
router.get('/ticket/:ticketNumber', checkPermission(PERMISSIONS.ORDER_VIEW), orderController.getOrderByTicketNumber);

// Get order by ID
router.get('/:id', checkPermission(PERMISSIONS.ORDER_VIEW), orderController.getOrderById);

// Create new order
router.post('/', checkPermission(PERMISSIONS.ORDER_CREATE), orderController.createOrder);

// Update order status
router.patch('/:id/status', checkPermission(PERMISSIONS.ORDER_STATUS_UPDATE), orderController.updateOrderStatus);

// Update order
router.put('/:id', checkPermission(PERMISSIONS.ORDER_UPDATE), orderController.updateOrder);

// Delete order
router.delete('/:id', checkAnyPermission(PERMISSIONS.ORDER_DELETE, PERMISSIONS.ORDER_CANCEL), orderController.deleteOrder);

module.exports = router;

