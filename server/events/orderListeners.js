const { orderEvents, ORDER_EVENTS } = require('./orderEvents');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

function registerOrderListeners() {
  // Listener for Order Creation
  orderEvents.on(ORDER_EVENTS.CREATED, (order) => {
    logger.info(`[EVENT] Order Created Event Received for Order: ${order._id}`);
    const notificationType = process.env.NOTIFICATION_TYPE || 'both';
    notificationService.sendOrderNotification(order, 'confirmation', notificationType)
      .catch(err => logger.error(`Failed to send order creation notification: ${err.message}`));
  });

  // Listener for Order Status Updates
  orderEvents.on(ORDER_EVENTS.STATUS_UPDATED, ({ order, previousStatus }) => {
    logger.info(`[EVENT] Order Status Updated Event for Order: ${order._id} (${previousStatus} -> ${order.status})`);
    const notificationType = process.env.NOTIFICATION_TYPE || 'both';

    if (order.status === 'Ready for Pickup') {
      notificationService.sendOrderNotification(order, 'ready', notificationType)
        .catch(err => logger.error(`Failed to send ready notification: ${err.message}`));
    } else if (order.status === 'Delivered') {
      notificationService.sendOrderNotification(order, 'delivered', notificationType)
        .catch(err => logger.error(`Failed to send delivered notification: ${err.message}`));
    } else if (['Sorting', 'Washing', 'Ironing', 'Quality Check', 'Packing', 'Out for Delivery'].includes(order.status)) {
      notificationService.sendStatusUpdateNotification(order, order.status, notificationType)
        .catch(err => logger.error(`Failed to send status update notification: ${err.message}`));
    }
  });

  logger.info('✅ Domain Order Event Listeners Registered');
}

module.exports = { registerOrderListeners };
