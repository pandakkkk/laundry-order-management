/**
 * Centralized Phone Number Utilities (DRY Principle)
 * Standardizes cleaning, validation, and +91 country code formatting.
 */

function normalizeIndianPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return '91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

function isValidIndianPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
}

function formatDisplayPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  const tenDigits = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  if (tenDigits.length === 10) {
    return `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`;
  }
  return phone;
}

module.exports = {
  normalizeIndianPhone,
  isValidIndianPhone,
  formatDisplayPhone
};
