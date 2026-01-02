/**
 * Search history management using localStorage
 */

const STORAGE_KEYS = {
  ORDER_SEARCHES: 'order_search_history',
  CUSTOMER_SEARCHES: 'customer_search_history'
};

const MAX_HISTORY_ITEMS = 5;

/**
 * Get search history
 * @param {string} type - 'order' or 'customer'
 * @returns {Array} - Array of search queries
 */
export const getSearchHistory = (type = 'order') => {
  try {
    const key = type === 'customer' ? STORAGE_KEYS.CUSTOMER_SEARCHES : STORAGE_KEYS.ORDER_SEARCHES;
    const history = localStorage.getItem(key);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error reading search history:', error);
    return [];
  }
};

/**
 * Add search to history
 * @param {string} query - Search query
 * @param {string} type - 'order' or 'customer'
 */
export const addToSearchHistory = (query, type = 'order') => {
  if (!query || !query.trim()) return;
  
  try {
    const key = type === 'customer' ? STORAGE_KEYS.CUSTOMER_SEARCHES : STORAGE_KEYS.ORDER_SEARCHES;
    let history = getSearchHistory(type);
    
    // Remove if already exists
    history = history.filter(item => item !== query.trim());
    
    // Add to beginning
    history.unshift(query.trim());
    
    // Keep only last MAX_HISTORY_ITEMS
    history = history.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(key, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
};

/**
 * Clear search history
 * @param {string} type - 'order' or 'customer'
 */
export const clearSearchHistory = (type = 'order') => {
  try {
    const key = type === 'customer' ? STORAGE_KEYS.CUSTOMER_SEARCHES : STORAGE_KEYS.ORDER_SEARCHES;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
};

