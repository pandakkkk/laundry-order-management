/**
 * Smart search detection utility
 * Automatically detects what type of search query the user entered
 */

// Detect ticket number pattern: e.g., 2511-001-012, 2510-253-00077
const TICKET_PATTERN = /^\d{4}-\d{3}-\d{5}$|^\d{4,}-\d{2,}-\d{3,}$|^\d{10,}$/;

// Detect phone number patterns
const PHONE_PATTERN = /^(\+91|91)?[\s-]?[6-9]\d{9}$/;

// Detect tag number pattern: e.g., GT-0109-001, GT-1225-00012
const TAG_NUMBER_PATTERN = /^GT-\d{4}-\d{3,5}$/i;

/**
 * Detect the search type from query
 * @param {string} query - The search query
 * @returns {string} - 'ticketNumber', 'phoneNumber', 'tagNumber', or 'all'
 */
export const detectSearchType = (query) => {
  if (!query || !query.trim()) return 'all';
  
  const trimmed = query.trim();
  
  // Check for tag number first (GT-MMDD-SEQ format)
  if (TAG_NUMBER_PATTERN.test(trimmed)) {
    return 'tagNumber';
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
 * Convert tag number to ticket number search pattern
 * Tag format: GT-MMDD-SEQ (e.g., GT-0109-001)
 * Ticket format: YYMMDD-001-NNNNN (e.g., 260109-001-00001)
 * @param {string} tagNumber - The tag number to convert
 * @returns {string} - Partial ticket number pattern for search
 */
export const tagNumberToTicketPattern = (tagNumber) => {
  if (!tagNumber) return '';
  
  const match = tagNumber.toUpperCase().match(/^GT-(\d{4})-(\d{3,5})$/);
  if (!match) return tagNumber;
  
  const mmdd = match[1]; // e.g., "0109"
  const seq = match[2];   // e.g., "001"
  
  // Return pattern: MMDD portion and sequence (padded to 5 digits)
  // This will match tickets like "260109-001-00001"
  const paddedSeq = seq.padStart(5, '0');
  return `${mmdd}-001-${paddedSeq}`;
};

/**
 * Get search type label for display
 * @param {string} searchType - The detected search type
 * @returns {string} - Human-readable label
 */
export const getSearchTypeLabel = (searchType) => {
  const labels = {
    'ticketNumber': '🎫 Ticket Number',
    'tagNumber': '🏷️ Tag Number',
    'phoneNumber': '📞 Phone Number',
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
      'tagNumber': 'Enter tag number (e.g., GT-0109-001)',
      'phoneNumber': 'Enter phone number (e.g., +91 98765 43210)',
      'customerName': 'Enter customer name',
      'all': 'Track by ticket, tag, phone, or name...'
    },
    customer: {
      'phoneNumber': 'Enter phone number (e.g., +91 98765 43210)',
      'customerName': 'Enter customer name',
      'all': 'Search by phone or name...'
    }
  };
  
  return placeholders[context]?.[searchType] || placeholders[context]?.['all'] || 'Search...';
};

