import axios from 'axios';

// Use relative path in production (Vercel), localhost in development
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

const api = {
  // Get all orders
  getOrders: async (params = {}) => {
    const response = await axios.get(`${API_BASE_URL}/orders`, { params });
    return response.data;
  },

  // Get order by ID
  getOrderById: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/orders/${id}`);
    return response.data;
  },

  // Get order by ticket number
  getOrderByTicketNumber: async (ticketNumber) => {
    const response = await axios.get(`${API_BASE_URL}/orders/ticket/${ticketNumber}`);
    return response.data;
  },

  // Create new order
  createOrder: async (orderData) => {
    const response = await axios.post(`${API_BASE_URL}/orders`, orderData);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (id, status) => {
    const response = await axios.patch(`${API_BASE_URL}/orders/${id}/status`, { status });
    return response.data;
  },

  // Update order
  updateOrder: async (id, orderData) => {
    const response = await axios.put(`${API_BASE_URL}/orders/${id}`, orderData);
    return response.data;
  },

  // Delete order
  deleteOrder: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/orders/${id}`);
    return response.data;
  },

  // Get order statistics
  getOrderStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/orders/stats/summary`, {
      headers: {
        'Cache-Control': 'no-cache'
      },
      params: {
        _t: Date.now() // Cache busting parameter
      }
    });
    return response.data;
  },

  // Search orders
  searchOrders: async (query, field = 'all') => {
    const response = await axios.get(`${API_BASE_URL}/orders/search/query`, {
      params: { q: query, field: field }
    });
    return response.data;
  },

  // Generate and download receipt
  generateReceipt: async (orderId) => {
    const response = await axios.get(`${API_BASE_URL}/orders/${orderId}/receipt`, {
      responseType: 'blob' // Important for PDF download
    });
    return response.data;
  },

  // Customer Management APIs
  
  // Get all customers
  getCustomers: async (params = {}) => {
    const response = await axios.get(`${API_BASE_URL}/customers`, { params });
    return response.data;
  },

  // Get customer by ID or phone
  getCustomer: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/customers/${id}`);
    return response.data;
  },

  // Search customers by phone
  searchCustomersByPhone: async (phone) => {
    const response = await axios.get(`${API_BASE_URL}/customers/search`, {
      params: { phone }
    });
    return response.data;
  },

  // Search customers (general search)
  searchCustomers: async (query, field = 'phoneNumber', page = 1) => {
    const response = await axios.get(`${API_BASE_URL}/customers/search/query`, {
      params: { q: query, field: field, page, limit: 20 }
    });
    return response.data;
  },

  // Create new customer
  createCustomer: async (customerData) => {
    const response = await axios.post(`${API_BASE_URL}/customers`, customerData);
    return response.data;
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    const response = await axios.put(`${API_BASE_URL}/customers/${id}`, customerData);
    return response.data;
  },

  // Delete customer
  deleteCustomer: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/customers/${id}`);
    return response.data;
  },

  // Get customer statistics
  getCustomerStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/customers/stats`, {
      headers: {
        'Cache-Control': 'no-cache'
      },
      params: {
        _t: Date.now() // Cache busting parameter
      }
    });
    return response.data;
  },

  // Bulk import customers
  bulkImportCustomers: async (customers) => {
    const response = await axios.post(`${API_BASE_URL}/customers/bulk-import`, { customers });
    return response.data;
  },

  // Get customer order history
  getCustomerOrderHistory: async (customerId, params = {}) => {
    const response = await axios.get(`${API_BASE_URL}/customers/${customerId}/orders`, { params });
    return response.data;
  },

  // Get customer analytics
  getCustomerAnalytics: async (customerId) => {
    const response = await axios.get(`${API_BASE_URL}/customers/${customerId}/analytics`);
    return response.data;
  },

  // Notification APIs
  sendOrderNotification: async (orderId, event, type = 'both') => {
    const response = await axios.post(`${API_BASE_URL}/notifications/orders/${orderId}`, {
      event,
      type
    });
    return response.data;
  },

  sendBulkReadyNotifications: async (type = 'both') => {
    const response = await axios.post(`${API_BASE_URL}/notifications/orders/ready/bulk`, {
      type
    });
    return response.data;
  },

  sendCustomNotification: async (phoneNumber, message, type = 'both') => {
    const response = await axios.post(`${API_BASE_URL}/notifications/custom`, {
      phoneNumber,
      message,
      type
    });
    return response.data;
  },

  sendPaymentReminder: async (orderId, type = 'both') => {
    const response = await axios.post(`${API_BASE_URL}/notifications/orders/${orderId}/payment-reminder`, {
      type
    });
    return response.data;
  },

  // ============================================
  // User Management APIs
  // ============================================

  // Get all users
  getUsers: async (params = {}) => {
    const response = await axios.get(`${API_BASE_URL}/users`, { params });
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/users/${id}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData) => {
    const response = await axios.post(`${API_BASE_URL}/users`, userData);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await axios.put(`${API_BASE_URL}/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/users/${id}`);
    return response.data;
  },

  // Reset user password
  resetUserPassword: async (id, newPassword) => {
    const response = await axios.post(`${API_BASE_URL}/users/${id}/reset-password`, { newPassword });
    return response.data;
  },

  // Toggle user status
  toggleUserStatus: async (id) => {
    const response = await axios.post(`${API_BASE_URL}/users/${id}/toggle-status`);
    return response.data;
  },

  // Get available roles
  getRoles: async () => {
    const response = await axios.get(`${API_BASE_URL}/users/roles`);
    return response.data;
  },

  // Get user stats
  getUserStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/users/stats/summary`);
    return response.data;
  }
};

export default api;

