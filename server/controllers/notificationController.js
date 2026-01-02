const notificationService = require('../services/notificationService');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

/**
 * Send notification for a specific order
 */
exports.sendOrderNotification = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { event, type = 'both' } = req.body;

    if (!event) {
      return res.status(400).json({
        success: false,
        error: 'Event type is required (confirmation, ready, delivered, statusUpdate, paymentReminder)'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const result = await notificationService.sendOrderNotification(order, event, type);
    
    res.json({
      success: result.sms?.success || result.whatsapp?.success || false,
      data: result
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Send bulk notifications for ready orders
 */
exports.sendBulkReadyNotifications = async (req, res) => {
  try {
    const { type = 'both' } = req.body;

    // Find all orders that are ready for pickup
    const readyOrders = await Order.find({ status: 'Ready for Pickup' });

    if (readyOrders.length === 0) {
      return res.json({
        success: true,
        message: 'No ready orders found',
        data: {
          total: 0,
          success: 0,
          failed: 0,
          details: []
        }
      });
    }

    const results = await notificationService.sendBulkNotifications(readyOrders, type);

    res.json({
      success: true,
      message: `Sent ${results.success} notifications, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Send custom notification
 */
exports.sendCustomNotification = async (req, res) => {
  try {
    const { phoneNumber, message, type = 'both' } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }

    const result = await notificationService.sendNotification(type, phoneNumber, message);

    res.json({
      success: result.sms?.success || result.whatsapp?.success || false,
      data: result
    });
  } catch (error) {
    console.error('Error sending custom notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Send payment reminder for an order
 */
exports.sendPaymentReminder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { type = 'both' } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        error: 'Order is already paid'
      });
    }

    const result = await notificationService.sendOrderNotification(order, 'paymentReminder', type);

    res.json({
      success: result.sms?.success || result.whatsapp?.success || false,
      data: result
    });
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

