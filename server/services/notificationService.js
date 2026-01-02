const twilio = require('twilio');
const https = require('https');

// Lazy initialization - get credentials when needed
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    return null;
  }
  
  try {
    // Create HTTPS agent that accepts self-signed certificates (for development)
    // In production, you should use proper certificate validation
    const httpsAgent = new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false
    });
    
    return twilio(accountSid, authToken, {
      httpClient: twilio.HttpClient,
      // Use custom agent for HTTPS requests
      httpsAgent: process.env.NODE_ENV !== 'production' ? httpsAgent : undefined
    });
  } catch (error) {
    console.error('❌ Failed to initialize Twilio client:', error.message);
    return null;
  }
}

// Get configuration
function getConfig() {
  return {
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER
  };
}

// Message templates
const messageTemplates = {
  orderConfirmation: (order) => {
    const deliveryDate = new Date(order.expectedDelivery).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `Hi ${order.customerName}, your laundry order #${order.ticketNumber} has been received. Expected delivery: ${deliveryDate}. Total: ₹${order.totalAmount.toLocaleString('en-IN')}. Thank you for choosing us!`;
  },

  orderReady: (order) => {
    return `Hi ${order.customerName}, your order #${order.ticketNumber} is ready for pickup! Please collect from our store. Total: ₹${order.totalAmount.toLocaleString('en-IN')}. Thank you!`;
  },

  orderDelivered: (order) => {
    return `Hi ${order.customerName}, your order #${order.ticketNumber} has been delivered successfully. Thank you for your business!`;
  },

  orderStatusUpdate: (order, previousStatus) => {
    const statusMessages = {
      'Sorting': 'Your order is being sorted',
      'Washing': 'Your order is being washed',
      'Ironing': 'Your order is being ironed',
      'Quality Check': 'Your order is under quality check',
      'Packing': 'Your order is being packed',
      'Out for Delivery': 'Your order is out for delivery'
    };
    
    const message = statusMessages[order.status] || `Your order status has been updated to ${order.status}`;
    return `Hi ${order.customerName}, ${message} for order #${order.ticketNumber}. We'll notify you when it's ready!`;
  },

  paymentReminder: (order) => {
    return `Hi ${order.customerName}, reminder: Payment pending for order #${order.ticketNumber}. Amount: ₹${order.totalAmount.toLocaleString('en-IN')}. Please complete payment when collecting your order.`;
  }
};

/**
 * Send SMS notification
 * @param {string} to - Phone number (format: +91XXXXXXXXXX)
 * @param {string} message - Message to send
 * @returns {Promise<Object>} - Twilio message response
 */
async function sendSMS(to, message) {
  const client = getTwilioClient();
  const config = getConfig();
  
  if (!client) {
    console.warn('⚠️  Twilio client not initialized. SMS not sent.');
    console.warn('   Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
    return { success: false, error: 'Twilio not configured' };
  }

  if (!config.phoneNumber) {
    console.warn('⚠️  TWILIO_PHONE_NUMBER not configured. SMS not sent.');
    return { success: false, error: 'Twilio phone number not configured' };
  }

  try {
    // Format phone number (ensure it starts with +)
    const formattedTo = to.startsWith('+') ? to : `+${to.replace(/\s/g, '')}`;
    
    const result = await client.messages.create({
      body: message,
      from: config.phoneNumber,
      to: formattedTo
    });

    console.log(`✅ SMS sent to ${formattedTo}: ${result.sid}`);
    return {
      success: true,
      messageSid: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error(`❌ Error sending SMS to ${to}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send WhatsApp notification
 * @param {string} to - Phone number (format: +91XXXXXXXXXX)
 * @param {string} message - Message to send
 * @returns {Promise<Object>} - Twilio message response
 */
async function sendWhatsApp(to, message) {
  const client = getTwilioClient();
  const config = getConfig();
  
  if (!client) {
    console.warn('⚠️  Twilio client not initialized. WhatsApp not sent.');
    console.warn('   Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
    return { success: false, error: 'Twilio not configured' };
  }

  if (!config.whatsappNumber) {
    console.warn('⚠️  WhatsApp number not configured. Falling back to SMS.');
    return sendSMS(to, message);
  }

  try {
    // Format phone number for WhatsApp (ensure it starts with +)
    const formattedTo = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+${to.replace(/\s/g, '')}`;
    
    const result = await client.messages.create({
      body: message,
      from: config.whatsappNumber,
      to: formattedTo
    });

    console.log(`✅ WhatsApp sent to ${formattedTo}: ${result.sid}`);
    return {
      success: true,
      messageSid: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error(`❌ Error sending WhatsApp to ${to}:`, error.message);
    // Fallback to SMS if WhatsApp fails
    console.log('📱 Falling back to SMS...');
    return sendSMS(to, message);
  }
}

/**
 * Send notification based on type
 * @param {string} type - Notification type (sms, whatsapp, both)
 * @param {string} to - Phone number
 * @param {string} message - Message to send
 * @returns {Promise<Object>} - Result object
 */
async function sendNotification(type, to, message) {
  const results = {
    sms: null,
    whatsapp: null
  };

  if (type === 'sms' || type === 'both') {
    results.sms = await sendSMS(to, message);
  }

  if (type === 'whatsapp' || type === 'both') {
    results.whatsapp = await sendWhatsApp(to, message);
  }

  return results;
}

/**
 * Send order notification based on event
 * @param {Object} order - Order object
 * @param {string} event - Event type (confirmation, ready, delivered, statusUpdate, paymentReminder)
 * @param {string} notificationType - sms, whatsapp, or both
 * @param {string} previousStatus - Previous status (for statusUpdate)
 * @returns {Promise<Object>} - Result object
 */
async function sendOrderNotification(order, event, notificationType = 'both', previousStatus = null) {
  if (!order.phoneNumber) {
    return { success: false, error: 'Order has no phone number' };
  }

  let message;
  switch (event) {
    case 'confirmation':
      message = messageTemplates.orderConfirmation(order);
      break;
    case 'ready':
      message = messageTemplates.orderReady(order);
      break;
    case 'delivered':
      message = messageTemplates.orderDelivered(order);
      break;
    case 'statusUpdate':
      message = messageTemplates.orderStatusUpdate(order, previousStatus);
      break;
    case 'paymentReminder':
      message = messageTemplates.paymentReminder(order);
      break;
    default:
      return { success: false, error: 'Unknown notification event' };
  }

  return await sendNotification(notificationType, order.phoneNumber, message);
}

/**
 * Send bulk notifications for ready orders
 * @param {Array} orders - Array of order objects
 * @param {string} notificationType - sms, whatsapp, or both
 * @returns {Promise<Object>} - Results object with success/failure counts
 */
async function sendBulkNotifications(orders, notificationType = 'both') {
  const results = {
    total: orders.length,
    success: 0,
    failed: 0,
    details: []
  };

  for (const order of orders) {
    try {
      const result = await sendOrderNotification(order, 'ready', notificationType);
      if (result.sms?.success || result.whatsapp?.success) {
        results.success++;
        results.details.push({
          orderId: order._id,
          ticketNumber: order.ticketNumber,
          phoneNumber: order.phoneNumber,
          status: 'success'
        });
      } else {
        results.failed++;
        results.details.push({
          orderId: order._id,
          ticketNumber: order.ticketNumber,
          phoneNumber: order.phoneNumber,
          status: 'failed',
          error: result.sms?.error || result.whatsapp?.error
        });
      }
    } catch (error) {
      results.failed++;
      results.details.push({
        orderId: order._id,
        ticketNumber: order.ticketNumber,
        phoneNumber: order.phoneNumber,
        status: 'failed',
        error: error.message
      });
    }
  }

  return results;
}

module.exports = {
  sendSMS,
  sendWhatsApp,
  sendNotification,
  sendOrderNotification,
  sendBulkNotifications,
  messageTemplates
};

