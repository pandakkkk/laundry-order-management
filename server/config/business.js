// Business Information Configuration
// Update these details with your actual business information

module.exports = {
  name: process.env.BUSINESS_NAME || 'LAUNDRYMAN',
  address: process.env.BUSINESS_ADDRESS || '209A, Near NH39, Daladili',
  city: process.env.BUSINESS_CITY || 'Ranchi',
  state: process.env.BUSINESS_STATE || 'Jharkhand',
  pincode: process.env.BUSINESS_PINCODE || '835222',
  phone: process.env.BUSINESS_PHONE || '+91 9006468666',
  email: process.env.BUSINESS_EMAIL || 'support@laundryman.pro',
  gstin: process.env.BUSINESS_GSTIN || '', // Optional GST number
  website: process.env.BUSINESS_WEBSITE || 'laundryman.pro',
  terms: process.env.BUSINESS_TERMS || 'Items must be collected within 7 days. We are not responsible for items left beyond 30 days.',
  footer: process.env.BUSINESS_FOOTER || 'Thank you for choosing Laundryman!'
};

