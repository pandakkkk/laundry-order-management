const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const receiptController = require('../controllers/receiptController');
const { checkPermission, checkAnyPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

// PUBLIC ROUTE - Get order details for QR code scanning (no auth required)
router.get('/:id/public', orderController.getPublicOrderById);

// Get orders statistics (check first to avoid conflict with /:id)
router.get('/stats/summary', checkPermission(PERMISSIONS.ORDER_VIEW), orderController.getOrderStats);

// Search orders
router.get('/search/query', checkPermission(PERMISSIONS.ORDER_VIEW), orderController.searchOrders);

// Get orders assigned to current user (delivery dashboard)
router.get('/my-assigned', checkPermission(PERMISSIONS.ORDER_VIEW), orderController.getMyAssignedOrders);

// Get delivery personnel list
router.get('/delivery-personnel', checkPermission(PERMISSIONS.ORDER_VIEW), orderController.getDeliveryPersonnel);

// Get all orders
router.get('/', checkPermission(PERMISSIONS.ORDER_VIEW), orderController.getAllOrders);

// Get order by ticket number
router.get('/ticket/:ticketNumber', checkPermission(PERMISSIONS.ORDER_VIEW), orderController.getOrderByTicketNumber);

// Generate receipt (must be before /:id route)
router.get('/:id/receipt', checkPermission(PERMISSIONS.ORDER_VIEW), receiptController.generateReceipt);

// Get order by ID
router.get('/:id', checkPermission(PERMISSIONS.ORDER_VIEW), orderController.getOrderById);

// Create new order
router.post('/', checkPermission(PERMISSIONS.ORDER_CREATE), orderController.createOrder);

// Update order status
router.patch('/:id/status', checkPermission(PERMISSIONS.ORDER_STATUS_UPDATE), orderController.updateOrderStatus);

// Assign order to delivery person
router.patch('/:id/assign', checkPermission(PERMISSIONS.ORDER_UPDATE), orderController.assignOrder);

// Unassign order
router.patch('/:id/unassign', checkPermission(PERMISSIONS.ORDER_UPDATE), orderController.unassignOrder);

// Update order
router.put('/:id', checkPermission(PERMISSIONS.ORDER_UPDATE), orderController.updateOrder);

// Delete order
router.delete('/:id', checkAnyPermission(PERMISSIONS.ORDER_DELETE, PERMISSIONS.ORDER_CANCEL), orderController.deleteOrder);

module.exports = router;

