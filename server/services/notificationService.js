const https = require('https');
const http = require('http');

// ========================================
// GUPSHUP CONFIGURATION
// ========================================

function getGupshupConfig() {
  return {
    // Gupshup WhatsApp API credentials
    apiKey: process.env.GUPSHUP_API_KEY,
    appName: process.env.GUPSHUP_APP_NAME || 'LaundryApp',
    sourceNumber: process.env.GUPSHUP_SOURCE_NUMBER, // Your registered WhatsApp business number
    
    // Gupshup SMS API credentials (if different)
    smsUserId: process.env.GUPSHUP_SMS_USERID || process.env.GUPSHUP_API_KEY,
    smsPassword: process.env.GUPSHUP_SMS_PASSWORD,
    
    // API endpoints
    whatsappApiUrl: 'https://api.gupshup.io/wa/api/v1/msg',
    smsApiUrl: 'https://enterprise.smsgupshup.com/GatewayAPI/rest'
  };
}

// Check if Gupshup is configured
function isGupshupConfigured() {
  const config = getGupshupConfig();
  return !!(config.apiKey && config.sourceNumber);
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

// ========================================
// HELPER FUNCTION - HTTP REQUEST
// ========================================

function makeHttpRequest(url, options, postData) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// ========================================
// FORMAT PHONE NUMBER
// ========================================

function formatPhoneNumber(phone) {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, remove it
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // If doesn't have country code (10 digits for India), add 91
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  // If starts with +, it's already removed by regex above
  // Return without + for Gupshup
  return cleaned;
}

// ========================================
// SEND WHATSAPP VIA GUPSHUP
// ========================================

/**
 * Send WhatsApp notification via Gupshup
 * @param {string} to - Phone number (format: +91XXXXXXXXXX or 91XXXXXXXXXX)
 * @param {string} message - Message to send
 * @returns {Promise<Object>} - Gupshup API response
 */
async function sendWhatsApp(to, message) {
  const config = getGupshupConfig();
  
  if (!config.apiKey) {
    console.warn('⚠️  Gupshup API key not configured. WhatsApp not sent.');
    console.warn('   Set GUPSHUP_API_KEY in .env file');
    return { success: false, error: 'Gupshup API key not configured' };
  }

  if (!config.sourceNumber) {
    console.warn('⚠️  Gupshup source number not configured. WhatsApp not sent.');
    console.warn('   Set GUPSHUP_SOURCE_NUMBER in .env file');
    return { success: false, error: 'Gupshup source number not configured' };
  }

  try {
    const formattedTo = formatPhoneNumber(to);
    const formattedSource = formatPhoneNumber(config.sourceNumber);
    
    // Gupshup WhatsApp API - using URL encoded form data
    const postData = new URLSearchParams({
      channel: 'whatsapp',
      source: formattedSource,
      destination: formattedTo,
      message: JSON.stringify({
        type: 'text',
        text: message
      }),
      'src.name': config.appName
    }).toString();

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apikey': config.apiKey,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`📱 Sending WhatsApp to ${formattedTo} via Gupshup...`);
    
    const response = await makeHttpRequest(config.whatsappApiUrl, options, postData);
    
    if (response.statusCode === 200 || response.statusCode === 202) {
      const messageId = response.data?.messageId || response.data?.id || 'sent';
      console.log(`✅ WhatsApp sent to ${formattedTo}: ${messageId}`);
      return {
        success: true,
        messageId: messageId,
        status: response.data?.status || 'submitted',
        provider: 'gupshup'
      };
    } else {
      console.error(`❌ Gupshup WhatsApp error:`, response.data);
      return {
        success: false,
        error: response.data?.message || response.data?.error || 'Failed to send WhatsApp',
        provider: 'gupshup'
      };
    }
  } catch (error) {
    console.error(`❌ Error sending WhatsApp to ${to}:`, error.message);
    return {
      success: false,
      error: error.message,
      provider: 'gupshup'
    };
  }
}

// ========================================
// SEND SMS VIA GUPSHUP
// ========================================

/**
 * Send SMS notification via Gupshup
 * @param {string} to - Phone number (format: +91XXXXXXXXXX or 91XXXXXXXXXX)
 * @param {string} message - Message to send
 * @returns {Promise<Object>} - Gupshup API response
 */
async function sendSMS(to, message) {
  const config = getGupshupConfig();
  
  if (!config.smsUserId || !config.smsPassword) {
    console.warn('⚠️  Gupshup SMS credentials not configured.');
    console.warn('   Set GUPSHUP_SMS_USERID and GUPSHUP_SMS_PASSWORD in .env file');
    // Try WhatsApp as fallback
    console.log('📱 Falling back to WhatsApp...');
    return sendWhatsApp(to, message);
  }

  try {
    const formattedTo = formatPhoneNumber(to);
    
    // Gupshup SMS API
    const params = new URLSearchParams({
      method: 'SendMessage',
      send_to: formattedTo,
      msg: message,
      msg_type: 'TEXT',
      userid: config.smsUserId,
      auth_scheme: 'plain',
      password: config.smsPassword,
      v: '1.1',
      format: 'json'
    });

    const smsUrl = `${config.smsApiUrl}?${params.toString()}`;
    
    console.log(`📨 Sending SMS to ${formattedTo} via Gupshup...`);
    
    const response = await makeHttpRequest(smsUrl, { method: 'GET' });
    
    if (response.statusCode === 200 && response.data?.response?.status === 'success') {
      const messageId = response.data?.response?.id || 'sent';
      console.log(`✅ SMS sent to ${formattedTo}: ${messageId}`);
      return {
        success: true,
        messageId: messageId,
        status: 'submitted',
        provider: 'gupshup'
      };
    } else {
      console.error(`❌ Gupshup SMS error:`, response.data);
      return {
        success: false,
        error: response.data?.response?.reason || 'Failed to send SMS',
        provider: 'gupshup'
      };
    }
  } catch (error) {
    console.error(`❌ Error sending SMS to ${to}:`, error.message);
    return {
      success: false,
      error: error.message,
      provider: 'gupshup'
    };
  }
}

// ========================================
// SEND NOTIFICATION (SMS/WHATSAPP/BOTH)
// ========================================

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

// ========================================
// SEND ORDER NOTIFICATION
// ========================================

/**
 * Send order notification based on event
 * @param {Object} order - Order object
 * @param {string} event - Event type (confirmation, ready, delivered, statusUpdate, paymentReminder)
 * @param {string} notificationType - sms, whatsapp, or both
 * @param {string} previousStatus - Previous status (for statusUpdate)
 * @returns {Promise<Object>} - Result object
 */
async function sendOrderNotification(order, event, notificationType = 'whatsapp', previousStatus = null) {
  if (!order.phoneNumber) {
    return { success: false, error: 'Order has no phone number' };
  }

  // Check if Gupshup is configured
  if (!isGupshupConfigured()) {
    console.warn('⚠️  Gupshup not configured. Please set GUPSHUP_API_KEY and GUPSHUP_SOURCE_NUMBER in .env');
    return { success: false, error: 'Gupshup not configured' };
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

// ========================================
// SEND BULK NOTIFICATIONS
// ========================================

/**
 * Send bulk notifications for ready orders
 * @param {Array} orders - Array of order objects
 * @param {string} notificationType - sms, whatsapp, or both
 * @returns {Promise<Object>} - Results object with success/failure counts
 */
async function sendBulkNotifications(orders, notificationType = 'whatsapp') {
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
          error: result.sms?.error || result.whatsapp?.error || result.error
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
    
    // Add small delay between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  sendSMS,
  sendWhatsApp,
  sendNotification,
  sendOrderNotification,
  sendBulkNotifications,
  messageTemplates,
  isGupshupConfigured
};
