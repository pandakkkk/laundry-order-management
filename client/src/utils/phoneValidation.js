/**
 * Phone Number Validation Utility
 * Validates and formats Indian phone numbers
 */

// Indian phone number pattern: 10 digits starting with 6-9
// With optional +91 or 91 prefix
const INDIAN_PHONE_REGEX = /^(?:\+91|91)?[6-9]\d{9}$/;
const DIGITS_ONLY_REGEX = /^\d{10}$/;

/**
 * Normalize phone number - remove all non-digit characters except leading +
 * @param {string} phone - Phone number input
 * @returns {string} - Normalized phone number
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove spaces, dashes, parentheses, etc.
  let normalized = phone.replace(/[\s\-().]/g, '');
  
  return normalized;
};

/**
 * Extract just the 10-digit mobile number
 * @param {string} phone - Phone number input
 * @returns {string} - 10 digit phone number or original if invalid
 */
export const extractPhoneDigits = (phone) => {
  if (!phone) return '';
  
  const normalized = normalizePhoneNumber(phone);
  
  // Remove +91 or 91 prefix if present
  if (normalized.startsWith('+91')) {
    return normalized.slice(3);
  }
  if (normalized.startsWith('91') && normalized.length === 12) {
    return normalized.slice(2);
  }
  
  return normalized;
};

/**
 * Validate Indian phone number
 * @param {string} phone - Phone number to validate
 * @returns {object} - { isValid: boolean, error: string|null }
 */
export const validateIndianPhone = (phone) => {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  const normalized = normalizePhoneNumber(phone);
  const digits = extractPhoneDigits(phone);
  
  // Check if it's a valid format
  if (!INDIAN_PHONE_REGEX.test(normalized) && !DIGITS_ONLY_REGEX.test(digits)) {
    // More specific error messages
    if (digits.length < 10) {
      return { 
        isValid: false, 
        error: `Phone number too short (${digits.length}/10 digits)` 
      };
    }
    
    if (digits.length > 10) {
      return { 
        isValid: false, 
        error: `Phone number too long (${digits.length} digits)` 
      };
    }
    
    if (digits.length === 10 && !/^[6-9]/.test(digits)) {
      return { 
        isValid: false, 
        error: 'Indian mobile numbers must start with 6, 7, 8, or 9' 
      };
    }
    
    return { 
      isValid: false, 
      error: 'Invalid phone number format' 
    };
  }
  
  // Final check - must be 10 digits starting with 6-9
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return { isValid: true, error: null };
  }
  
  return { 
    isValid: false, 
    error: 'Invalid Indian mobile number' 
  };
};

/**
 * Format phone number for display
 * @param {string} phone - Phone number to format
 * @param {boolean} includeCountryCode - Whether to include +91
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone, includeCountryCode = true) => {
  if (!phone) return '';
  
  const digits = extractPhoneDigits(phone);
  
  if (digits.length !== 10) {
    return phone; // Return as-is if not valid
  }
  
  // Format as: +91 XXXXX XXXXX or XXXXX XXXXX
  const formatted = `${digits.slice(0, 5)} ${digits.slice(5)}`;
  
  return includeCountryCode ? `+91 ${formatted}` : formatted;
};

/**
 * Format phone number as user types (for input masking)
 * @param {string} phone - Phone number being typed
 * @returns {string} - Formatted phone number
 */
export const formatPhoneOnType = (phone) => {
  if (!phone) return '';
  
  // Allow +91 prefix
  let value = phone;
  let prefix = '';
  
  if (value.startsWith('+91')) {
    prefix = '+91 ';
    value = value.slice(3).trim();
  } else if (value.startsWith('+')) {
    return phone; // Let user continue typing country code
  }
  
  // Remove non-digits from the rest
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limitedDigits = digits.slice(0, 10);
  
  // Format as XXXXX XXXXX
  if (limitedDigits.length <= 5) {
    return prefix + limitedDigits;
  }
  
  return prefix + limitedDigits.slice(0, 5) + ' ' + limitedDigits.slice(5);
};

/**
 * Get validation status class for styling
 * @param {string} phone - Phone number
 * @param {boolean} touched - Whether field has been touched
 * @returns {string} - CSS class name
 */
export const getPhoneValidationClass = (phone, touched = false) => {
  if (!phone || !touched) return '';
  
  const { isValid } = validateIndianPhone(phone);
  return isValid ? 'valid' : 'error';
};

/**
 * Check if phone number is complete (10 digits)
 * @param {string} phone - Phone number
 * @returns {boolean}
 */
export const isPhoneComplete = (phone) => {
  const digits = extractPhoneDigits(phone);
  return digits.length === 10;
};

/**
 * Get helper text based on phone validation state
 * @param {string} phone - Phone number
 * @param {boolean} customerFound - Whether existing customer was found
 * @returns {string} - Helper text
 */
export const getPhoneHelperText = (phone, customerFound = false) => {
  if (!phone) {
    return 'Enter 10-digit Indian mobile number';
  }
  
  const digits = extractPhoneDigits(phone);
  
  if (digits.length < 10) {
    return `Enter ${10 - digits.length} more digit${10 - digits.length > 1 ? 's' : ''}`;
  }
  
  if (customerFound) {
    return 'Existing customer found';
  }
  
  const { isValid } = validateIndianPhone(phone);
  if (isValid) {
    return 'Valid phone number';
  }
  
  return 'Invalid phone number';
};
