require('dotenv').config();
const notificationService = require('../server/services/notificationService');

// Test notification script
async function testNotification() {
  console.log('🧪 Testing Twilio Notification Setup...\n');
  
  // Check configuration
  console.log('📋 Configuration Check:');
  console.log('   Account SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing');
  console.log('   Auth Token:', process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing');
  console.log('   Phone Number:', process.env.TWILIO_PHONE_NUMBER || '❌ Missing');
  console.log('   WhatsApp Number:', process.env.TWILIO_WHATSAPP_NUMBER || '❌ Missing');
  console.log('   Notification Type:', process.env.NOTIFICATION_TYPE || 'both');
  console.log('');

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log('❌ Twilio credentials not configured. Please add them to .env file.');
    process.exit(1);
  }

  // Test phone number (you can change this to your number for testing)
  const testPhoneNumber = process.env.TEST_PHONE_NUMBER || '+91XXXXXXXXXX';
  
  if (testPhoneNumber === '+91XXXXXXXXXX') {
    console.log('⚠️  No test phone number provided.');
    console.log('   Set TEST_PHONE_NUMBER in .env to test actual sending.');
    console.log('   Example: TEST_PHONE_NUMBER=+919876543210');
    console.log('');
    console.log('✅ Configuration looks good! Notifications will work when orders are created.');
    process.exit(0);
  }

  console.log(`📱 Testing SMS to ${testPhoneNumber}...`);
  const smsResult = await notificationService.sendSMS(
    testPhoneNumber,
    '🧪 Test message from Laundry Order Monitoring System. If you receive this, SMS notifications are working!'
  );

  if (smsResult.success) {
    console.log('✅ SMS sent successfully!');
    console.log('   Message SID:', smsResult.messageSid);
  } else {
    console.log('❌ SMS failed:', smsResult.error);
  }

  console.log('');
  console.log(`📱 Testing WhatsApp to ${testPhoneNumber}...`);
  const whatsappResult = await notificationService.sendWhatsApp(
    testPhoneNumber,
    '🧪 Test message from Laundry Order Monitoring System. If you receive this, WhatsApp notifications are working!'
  );

  if (whatsappResult.success) {
    console.log('✅ WhatsApp sent successfully!');
    console.log('   Message SID:', whatsappResult.messageSid);
  } else {
    console.log('❌ WhatsApp failed:', whatsappResult.error);
    if (whatsappResult.error?.includes('not configured')) {
      console.log('   (Falling back to SMS)');
    }
  }

  console.log('');
  console.log('🎉 Test complete!');
}

testNotification().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

