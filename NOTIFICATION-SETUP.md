# 📱 SMS/WhatsApp Notifications Setup Guide

This guide will help you set up SMS and WhatsApp notifications for your laundry order monitoring system using Twilio.

## Prerequisites

1. **Twilio Account**: Sign up at [https://www.twilio.com](https://www.twilio.com)
2. **Twilio Phone Number**: Purchase a phone number from Twilio
3. **WhatsApp Business Account** (Optional): For WhatsApp notifications

## Step 1: Get Twilio Credentials

1. Log in to your Twilio Console: [https://console.twilio.com](https://console.twilio.com)
2. Go to **Account** → **API Keys & Tokens**
3. Copy your:
   - **Account SID** (starts with `AC...`)
   - **Auth Token**

## Step 2: Get Twilio Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select a number that supports SMS (and WhatsApp if needed)
3. Copy the phone number (format: `+1234567890`)

## Step 3: Set Up WhatsApp (Optional)

For WhatsApp notifications:

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the setup wizard to get your WhatsApp number
3. The format will be: `whatsapp:+14155238886` (Twilio's sandbox) or your business number

**Note**: For production, you need to:
- Complete Twilio WhatsApp Business verification
- Get approval from WhatsApp
- Use your verified business number

## Step 4: Configure Environment Variables

Add these variables to your `.env` file:

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

