const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { checkPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

// Send notification for a specific order
router.post('/orders/:orderId', 
  checkPermission(PERMISSIONS.ORDER_VIEW), 
  notificationController.sendOrderNotification
);

// Send bulk notifications for ready orders
router.post('/orders/ready/bulk', 
  checkPermission(PERMISSIONS.ORDER_VIEW), 
  notificationController.sendBulkReadyNotifications
);

// Send custom notification
router.post('/custom', 
  checkPermission(PERMISSIONS.ORDER_VIEW), 
  notificationController.sendCustomNotification
);

// Send payment reminder
router.post('/orders/:orderId/payment-reminder', 
  checkPermission(PERMISSIONS.ORDER_VIEW), 
  notificationController.sendPaymentReminder
);

module.exports = router;

