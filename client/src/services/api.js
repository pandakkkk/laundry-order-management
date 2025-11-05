import axios from 'axios';

// Use relative path in production (Vercel), localhost in development
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

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
    const response = await axios.get(`${API_BASE_URL}/orders/stats/summary`);
    return response.data;
  },

  // Search orders
  searchOrders: async (query, field = 'all') => {
    const response = await axios.get(`${API_BASE_URL}/orders/search/query`, {
      params: { q: query, field: field }
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
    const response = await axios.get(`${API_BASE_URL}/customers/stats`);
    return response.data;
  },

  // Bulk import customers
  bulkImportCustomers: async (customers) => {
    const response = await axios.post(`${API_BASE_URL}/customers/bulk-import`, { customers });
    return response.data;
  }
};

export default api;

