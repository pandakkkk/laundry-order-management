/**
 * Smart search detection utility
 * Automatically detects what type of search query the user entered
 */

// Detect ticket number pattern: e.g., 2511-001-012, 2510-253-00077
const TICKET_PATTERN = /^\d{4}-\d{3}-\d{5}$|^\d{4,}-\d{2,}-\d{3,}$|^\d{10,}$/;

// Detect phone number patterns
const PHONE_PATTERN = /^(\+91|91)?[\s-]?[6-9]\d{9}$/;

// Detect customer ID pattern: e.g., CUST001, CUST123
const CUSTOMER_ID_PATTERN = /^CUST\d+$/i;

/**
 * Detect the search type from query
 * @param {string} query - The search query
 * @returns {string} - 'ticketNumber', 'phoneNumber', 'customerId', or 'all'
 */
export const detectSearchType = (query) => {
  if (!query || !query.trim()) return 'all';
  
  const trimmed = query.trim();
  
  // Check for customer ID first (most specific)
  if (CUSTOMER_ID_PATTERN.test(trimmed)) {
    return 'customerId';
  }
  
  // Check for ticket number
  if (TICKET_PATTERN.test(trimmed)) {
    return 'ticketNumber';
  }
  
  // Check for phone number
  if (PHONE_PATTERN.test(trimmed)) {
    return 'phoneNumber';
  }
  
  // Default to 'all' for names or other text
  return 'all';
};

/**
 * Get search type label for display
 * @param {string} searchType - The detected search type
 * @returns {string} - Human-readable label
 */
export const getSearchTypeLabel = (searchType) => {
  const labels = {
    'ticketNumber': '🎫 Ticket Number',
    'phoneNumber': '📞 Phone Number',
    'customerId': '👤 Customer ID',
    'customerName': '📝 Customer Name',
    'all': '🔍 All Fields'
  };
  return labels[searchType] || '🔍 Search';
};

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
};

/**
 * Get placeholder text based on search type
 * @param {string} searchType - The search type
 * @param {string} context - 'order' or 'customer'
 * @returns {string} - Placeholder text
 */
export const getPlaceholder = (searchType, context = 'order') => {
  const placeholders = {
    order: {
      'ticketNumber': 'Enter ticket number (e.g., 2511-001-012)',
      'phoneNumber': 'Enter phone number (e.g., +91 98765 43210)',
      'customerId': 'Enter customer ID (e.g., CUST001)',
      'customerName': 'Enter customer name',
      'all': 'Track by ticket, phone, customer ID, or name...'
    },
    customer: {
      'phoneNumber': 'Enter phone number (e.g., +91 98765 43210)',
      'customerId': 'Enter customer ID (e.g., CUST001)',
      'customerName': 'Enter customer name',
      'all': 'Search by phone, customer ID, or name...'
    }
  };
  
  return placeholders[context]?.[searchType] || placeholders[context]?.['all'] || 'Search...';
};

