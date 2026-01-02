// Business Information Configuration
// Update these details with your actual business information

module.exports = {
  name: process.env.BUSINESS_NAME || 'Laundry Service',
  address: process.env.BUSINESS_ADDRESS || '123 Main Street',
  city: process.env.BUSINESS_CITY || 'City',
  state: process.env.BUSINESS_STATE || 'State',
  pincode: process.env.BUSINESS_PINCODE || '123456',
  phone: process.env.BUSINESS_PHONE || '+91 98765 43210',
  email: process.env.BUSINESS_EMAIL || 'info@laundry.com',
  gstin: process.env.BUSINESS_GSTIN || '', // Optional GST number
  website: process.env.BUSINESS_WEBSITE || '',
  terms: process.env.BUSINESS_TERMS || 'Items must be collected within 7 days. We are not responsible for items left beyond 30 days.',
  footer: process.env.BUSINESS_FOOTER || 'Thank you for your business!'
};

