# 📱 SMS/WhatsApp Notifications Feature Guide

## Overview

The SMS/WhatsApp notification system automatically sends messages to customers at key points in the order lifecycle, reducing customer calls and improving satisfaction.

## Features Implemented

### ✅ Automatic Notifications

1. **Order Confirmation** 📥
   - Sent automatically when a new order is created
   - Includes: Ticket number, expected delivery date, total amount

2. **Order Ready** ✅
   - Sent automatically when order status changes to "Ready for Pickup"
   - Includes: Ticket number, total amount, pickup instructions

3. **Order Delivered** ✨
   - Sent automatically when order status changes to "Delivered"
   - Confirmation message

4. **Status Updates** 🔄
   - Sent for key processing stages:
     - Sorting
     - Washing
     - Ironing
     - Quality Check
     - Packing
     - Out for Delivery

### ✅ Manual Notifications

1. **Send Ready Notification** 📱
   - Button in Order Details modal
   - Manually send ready notification even if status isn't "Ready for Pickup"

2. **Payment Reminder** 💰
   - Button in Order Details modal (only shown for pending payments)
   - Reminds customer about pending payment

3. **Bulk Ready Notifications** 📨
   - API endpoint to send notifications to all ready orders at once
   - Useful for end-of-day notifications

4. **Custom Notification** ✉️
   - API endpoint to send custom messages
   - Can be used for special announcements

## Setup Instructions

### 1. Get Twilio Credentials

1. Sign up at [https://www.twilio.com](https://www.twilio.com)
2. Get your Account SID and Auth Token from the Twilio Console
3. Purchase a phone number that supports SMS
4. (Optional) Set up WhatsApp Business API

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Notification Preferences
NOTIFICATION_TYPE=both
# Options: 'sms', 'whatsapp', or 'both'
```

### 3. Test the Setup

```bash
# Test via API
curl -X POST http://localhost:5000/api/notifications/custom \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phoneNumber": "+91XXXXXXXXXX",
    "message": "Test message",
    "type": "sms"
  }'
```

## Usage

### Automatic Notifications

No action needed! Notifications are sent automatically:
- When you create an order → Confirmation sent
- When you update status to "Ready for Pickup" → Ready notification sent
- When you update status to "Delivered" → Delivered notification sent
- When you update to processing stages → Status update sent

### Manual Notifications

#### From Order Details Modal:

1. Open any order details
2. Click **"📱 Notify Ready"** to send ready notification
3. Click **"💰 Payment Reminder"** to send payment reminder (only for pending payments)

#### Via API:

```javascript
// Send ready notification
await api.sendOrderNotification(orderId, 'ready', 'both');

// Send payment reminder
await api.sendPaymentReminder(orderId, 'both');

// Send bulk ready notifications
await api.sendBulkReadyNotifications('both');
```

## Message Templates

All messages are automatically formatted with order details:

**Order Confirmation:**
```
Hi {customerName}, your laundry order #{ticketNumber} has been received. 
Expected delivery: {expectedDelivery}. Total: ₹{totalAmount}. 
Thank you for choosing us!
```

**Order Ready:**
```
Hi {customerName}, your order #{ticketNumber} is ready for pickup! 
Please collect from our store. Total: ₹{totalAmount}. Thank you!
```

**Status Update:**
```
Hi {customerName}, {statusMessage} for order #{ticketNumber}. 
We'll notify you when it's ready!
```

## API Endpoints

### POST `/api/notifications/orders/:orderId`
Send notification for a specific order.

**Body:**
```json
{
  "event": "ready",  // confirmation, ready, delivered, statusUpdate, paymentReminder
  "type": "both"     // sms, whatsapp, or both
}
```

### POST `/api/notifications/orders/ready/bulk`
Send notifications to all ready orders.

**Body:**
```json
{
  "type": "both"
}
```

### POST `/api/notifications/custom`
Send custom notification.

**Body:**
```json
{
  "phoneNumber": "+91XXXXXXXXXX",
  "message": "Custom message here",
  "type": "sms"
}
```

### POST `/api/notifications/orders/:orderId/payment-reminder`
Send payment reminder for an order.

**Body:**
```json
{
  "type": "both"
}
```

## Testing Without Twilio

If Twilio is not configured:
- System will log warning messages instead of sending
- All other features continue to work normally
- No errors will occur

## Troubleshooting

### Notifications Not Sending

1. Check environment variables are set correctly
2. Verify phone number format (must include country code: +91XXXXXXXXXX)
3. Check Twilio Console for error messages
4. Check server logs for notification errors

### Common Issues

- **"Twilio not configured"**: Add credentials to `.env` file
- **"Invalid phone number"**: Ensure format is `+91XXXXXXXXXX`
- **"Unauthorized"**: Check Account SID and Auth Token
- **Trial account limits**: Twilio trial accounts can only send to verified numbers

## Cost Information

- **SMS**: ~$0.0075 per message (varies by country)
- **WhatsApp**: ~$0.005 per message (varies by country)

Check current pricing: [Twilio Pricing](https://www.twilio.com/pricing)

## Next Steps

1. Set up Twilio account
2. Add credentials to `.env`
3. Test with a real phone number
4. Monitor delivery in Twilio Console
5. Customize message templates as needed

For detailed setup instructions, see `NOTIFICATION-SETUP.md`

