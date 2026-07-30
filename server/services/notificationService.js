const https = require('https');
const http = require('http');

// ========================================
// WATI CONFIGURATION
// ========================================

function getWatiConfig() {
  let endpoint = process.env.WATI_API_ENDPOINT || '';
  // Remove trailing slash if present
  if (endpoint.endsWith('/')) {
    endpoint = endpoint.slice(0, -1);
  }

  return {
    endpoint: endpoint,
    authToken: process.env.WATI_AUTH_TOKEN || ''
  };
}

// Check if WATI is configured
function isWatiConfigured() {
  const config = getWatiConfig();
  return !!(config.endpoint && config.authToken);
}

// Alias for backward compatibility
const isGupshupConfigured = isWatiConfigured;

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
  
  return cleaned;
}

// ========================================
// SEND WHATSAPP VIA WATI
// ========================================

/**
 * Send WhatsApp notification via WATI API
 * @param {string} to - Phone number (format: +91XXXXXXXXXX or 91XXXXXXXXXX)
 * @param {string} message - Message to send
 * @returns {Promise<Object>} - WATI API response
 */
async function sendWhatsApp(to, message) {
  const config = getWatiConfig();
  
  if (!config.endpoint || !config.authToken) {
    console.warn('⚠️  WATI API credentials not configured. WhatsApp not sent.');
    console.warn('   Set WATI_API_ENDPOINT and WATI_AUTH_TOKEN in .env file');
    return { success: false, error: 'WATI credentials not configured' };
  }

  try {
    const formattedTo = formatPhoneNumber(to);
    const tokenHeader = config.authToken.startsWith('Bearer ')
      ? config.authToken
      : `Bearer ${config.authToken}`;
    
    // WATI Session Message API endpoint
    const url = `${config.endpoint}/api/v1/sendSessionMessage/${formattedTo}?messageText=${encodeURIComponent(message)}`;

    const options = {
      method: 'POST',
      headers: {
        'Authorization': tokenHeader,
        'Content-Type': 'application/json'
      }
    };

    console.log(`📱 Sending WhatsApp to ${formattedTo} via WATI...`);
    
    const response = await makeHttpRequest(url, options);
    
    if (response.statusCode === 200 || response.statusCode === 202) {
      const isResultValid = response.data?.result === true || response.data?.result === 'true' || response.data?.valid === true || !response.data?.result;
      if (isResultValid) {
        const messageId = response.data?.ticketId || response.data?.id || 'sent';
        console.log(`✅ WhatsApp sent to ${formattedTo} via WATI`);
        return {
          success: true,
          messageId: messageId,
          status: 'submitted',
          provider: 'wati'
        };
      }
    }

    console.error(`❌ WATI WhatsApp error:`, response.data);
    return {
      success: false,
      error: response.data?.info || response.data?.message || response.data?.error || 'Failed to send WhatsApp via WATI',
      provider: 'wati'
    };
  } catch (error) {
    console.error(`❌ Error sending WhatsApp to ${to} via WATI:`, error.message);
    return {
      success: false,
      error: error.message,
      provider: 'wati'
    };
  }
}

// ========================================
// SEND SMS (FALLBACK TO WATSAPP VIA WATI)
// ========================================

/**
 * Send SMS notification (Delegated to WATI WhatsApp)
 * @param {string} to - Phone number
 * @param {string} message - Message to send
 * @returns {Promise<Object>} - WATI WhatsApp API response
 */
async function sendSMS(to, message) {
  console.log('📱 Sending notification via WATI WhatsApp...');
  return sendWhatsApp(to, message);
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

  // Check if WATI is configured
  if (!isWatiConfigured()) {
    console.warn('⚠️  WATI not configured. Please set WATI_API_ENDPOINT and WATI_AUTH_TOKEN in .env');
    return { success: false, error: 'WATI not configured' };
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
  isWatiConfigured,
  isGupshupConfigured
};
