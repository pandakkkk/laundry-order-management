/**
 * Environment Variable Assertion & Validation
 * Distinguishes CRITICAL vars (server can't function at all) from RECOMMENDED
 * production vars (specific features degrade, but the server still boots).
 */

function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Hard-required for the server to boot at all.
  const critical = ['MONGODB_URI', 'JWT_SECRET'];
  // Recommended in production — commerce endpoints self-guard via razorpayService.isConfigured().
  // Missing these should NOT kill the process; staff auth + orders continue to work.
  const recommendedProd = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'];

  const missingCritical = critical.filter(k => !process.env[k]);
  const missingRecommended = isProduction
    ? recommendedProd.filter(k => !process.env[k])
    : [];

  if (missingCritical.length > 0) {
    console.error(`❌ CRITICAL: Missing required env vars: ${missingCritical.join(', ')}`);
    if (isProduction) {
      console.error('Fatal startup error in production. Exiting process.');
      process.exit(1);
    } else {
      console.warn('⚠️ Development warning: fallback values will be used.');
    }
  }

  if (missingRecommended.length > 0) {
    console.warn(
      `⚠️ Missing recommended production env vars: ${missingRecommended.join(', ')}. ` +
      `Commerce endpoints that need these will return a 5xx per-request; ` +
      `staff auth, orders, and existing features continue to work.`
    );
  }

  if (missingCritical.length === 0 && missingRecommended.length === 0) {
    console.log('✅ Environment configuration validated successfully');
  }
}

module.exports = { validateEnv };
