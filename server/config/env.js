/**
 * Environment Variable Assertion & Validation
 * Ensures mandatory production configurations are present on server launch.
 */

function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const required = [
    'MONGODB_URI',
    'JWT_SECRET'
  ];

  if (isProduction) {
    required.push('RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET');
  }

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    const msg = `❌ CRITICAL ERROR: Missing required environment variables: ${missing.join(', ')}`;
    console.error(msg);
    if (isProduction) {
      console.error('Fatal startup error in production. Exiting process.');
      process.exit(1);
    } else {
      console.warn('⚠️ Development warning: Some production variables are unset. Fallback values will be used where applicable.');
    }
  } else {
    console.log('✅ Environment configuration validated successfully');
  }
}

module.exports = { validateEnv };
