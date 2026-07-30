# 📱 WhatsApp Notifications Setup Guide (WATI)

This guide helps you set up WhatsApp notifications for your laundry order management system using **WATI**.

## Prerequisites

1. **WATI Account**: Active WATI WhatsApp API account (https://www.wati.io)
2. **API Endpoint & Access Token**: Found under WATI Dashboard > **Account Details** > **API Docs**

## Step 1: Get WATI Credentials

1. Log in to your WATI Dashboard.
2. Navigate to **Account Details** → **API Docs**.
3. Copy your:
   - **API Endpoint** (e.g. `https://live-server-xxxx.wati.io` or `https://live-mt-server.wati.io`)
   - **Access Token** (Bearer token)

## Step 2: Configure Environment Variables

Add these variables to your `.env` file:

```env
# WATI WhatsApp Configuration
WATI_API_ENDPOINT=https://live-server-xxxx.wati.io
WATI_AUTH_TOKEN=Bearer eyJhbGciOi...

# Notification Preference
NOTIFICATION_TYPE=whatsapp
```

## Step 5: Test Notifications

### Test via API

```bash
# Send test SMS
curl -X POST http://localhost:5000/api/notifications/custom \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phoneNumber": "+91XXXXXXXXXX",
    "message": "Test message from laundry system",
    "type": "sms"
  }'
```

### Test via Application

1. Create a new order - automatic confirmation notification will be sent
2. Update order status to "Ready for Pickup" - automatic ready notification will be sent
3. Use the notification buttons in the UI (if implemented)

## Notification Types

### Automatic Notifications

1. **Order Confirmation**: Sent when order is created
2. **Order Ready**: Sent when status changes to "Ready for Pickup"
3. **Order Delivered**: Sent when status changes to "Delivered"
4. **Status Updates**: Sent for key processing stages (Sorting, Washing, Ironing, etc.)

### Manual Notifications

1. **Payment Reminder**: Send reminder for pending payments
2. **Bulk Ready Notifications**: Send notifications to all ready orders at once
3. **Custom Notification**: Send custom message to any phone number

## Message Templates

Messages are automatically formatted with order details:

- **Order Confirmation**: Includes ticket number, expected delivery, and total amount
- **Order Ready**: Includes ticket number and total amount
- **Status Updates**: Includes current processing stage
- **Payment Reminder**: Includes order details and pending amount

## Cost Considerations

- **SMS**: ~$0.0075 per message (varies by country)
- **WhatsApp**: ~$0.005 per message (varies by country)
- Check Twilio pricing: [https://www.twilio.com/pricing](https://www.twilio.com/pricing)

## Troubleshooting

### Notifications Not Sending

1. **Check Environment Variables**: Ensure all Twilio credentials are set correctly
2. **Check Phone Number Format**: Must include country code (e.g., `+91` for India)
3. **Check Twilio Console**: Look for error messages in Twilio logs
4. **Check Server Logs**: Look for notification errors in your server console

### Common Errors

- **"Twilio not configured"**: Missing environment variables
- **"Invalid phone number"**: Phone number format incorrect
- **"Unauthorized"**: Wrong Account SID or Auth Token
- **"Unverified number"**: Using Twilio trial account (can only send to verified numbers)

### Testing Without Twilio

If you don't have Twilio credentials yet, the system will:
- Log warning messages instead of sending
- Continue to function normally
- Allow you to test other features

## API Endpoints

### Send Order Notification
```
POST /api/notifications/orders/:orderId
Body: { "event": "ready", "type": "both" }
```

### Send Bulk Ready Notifications
```
POST /api/notifications/orders/ready/bulk
Body: { "type": "both" }
```

### Send Custom Notification
```
POST /api/notifications/custom
Body: { "phoneNumber": "+91XXXXXXXXXX", "message": "Custom message", "type": "sms" }
```

### Send Payment Reminder
```
POST /api/notifications/orders/:orderId/payment-reminder
Body: { "type": "both" }
```

## Next Steps

1. Set up Twilio account and get credentials
2. Add credentials to `.env` file
3. Test with a real phone number
4. Monitor notification delivery in Twilio Console
5. Adjust message templates as needed

For more help, visit [Twilio Documentation](https://www.twilio.com/docs)

