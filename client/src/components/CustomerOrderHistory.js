import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import './CustomerOrderHistory.css';
import api from '../services/api';
import Pagination from './Pagination';

const CustomerOrderHistory = ({ customer, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (customer) {
      fetchOrderHistory(1);
    }
  }, [customer]);

  const fetchOrderHistory = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.getCustomerOrderHistory(customer._id || customer.id, {
        page,
        limit: 10
      });
      setOrders(response.data.orders);
      setPagination(response.data.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching order history:', error);
      alert('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (date) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      'Received': 'status-received',
      'Delivered': 'status-delivered',
      'Ready for Pickup': 'status-ready',
      'Cancelled': 'status-cancelled'
    };
    return statusClasses[status] || 'status-default';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="customer-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>📊 Customer Order History</h2>
            <p className="customer-info">
              {customer.name} {customer.customerId && `(${customer.customerId})`}
            </p>
            <p className="customer-phone">{customer.phoneNumber}</p>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="orders-tab">
              {loading ? (
                <div className="loading">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="empty-state">
                  <p>No orders found for this customer.</p>
                </div>
              ) : (
                <>
                  <div className="orders-list">
                    {orders.map((order) => (
                      <div key={order._id} className="order-card">
                        <div className="order-header">
                          <div className="order-ticket">
                            <span className="ticket-label">Ticket:</span>
                            <span className="ticket-number">{order.ticketNumber}</span>
                          </div>
                          <span className={`status-badge ${getStatusClass(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="order-details">
                          <div className="detail-row">
                            <span className="detail-label">Date:</span>
                            <span className="detail-value">{formatDate(order.orderDate)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Items:</span>
                            <span className="detail-value">{order.items.length} item(s)</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Amount:</span>
                            <span className="detail-value amount">{formatCurrency(order.totalAmount)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Payment:</span>
                            <span className="detail-value">{order.paymentMethod} - {order.paymentStatus}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {pagination && pagination.pages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={pagination.pages}
                      onPageChange={fetchOrderHistory}
                    />
                  )}
                </>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderHistory;

