import React, { memo, useCallback, useMemo } from 'react';
import './OrderTable.css';
import { format } from 'date-fns';
import Pagination from './Pagination';

const OrderTable = memo(({ orders, loading, pagination, currentPage, onOrderSelect, onPageChange }) => {
  
  const getStatusClass = useCallback((status) => {
    const statusClasses = {
      'Received': 'status-received',
      'Received in Workshop': 'status-workshop',
      'Tag Printed': 'status-tagged',
      'Ready for Processing': 'status-processing',
      'Sorting': 'status-sorting',
      'Spotting': 'status-spotting',
      'Washing': 'status-washing',
      'Dry Cleaning': 'status-drycleaning',
      'Drying': 'status-drying',
      'Ironing': 'status-ironing',
      'Quality Check': 'status-quality',
      'Packing': 'status-packing',
      'Ready for Pickup': 'status-ready',
      'Ready for Delivery': 'status-ready-delivery',
      'Out for Delivery': 'status-delivery',
      'Delivered': 'status-delivered',
      'Return': 'status-return',
      'Refund': 'status-refund',
      'Cancelled': 'status-cancelled'
    };
    return statusClasses[status] || '';
  }, []);

  const formatDate = useCallback((date) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  }, []);

  const isOverdue = useCallback((expectedDelivery, status) => {
    const nonOverdueStatuses = ['Delivered', 'Cancelled', 'Return', 'Refund', 'Received', 'Received in Workshop'];
    if (nonOverdueStatuses.includes(status)) return false;
    return new Date(expectedDelivery) < new Date();
  }, []);

  const getStatusIcon = useCallback((status) => {
    const icons = {
      'Received': '📥',
      'Received in Workshop': '🏭',
      'Tag Printed': '🏷️',
      'Ready for Processing': '✅',
      'Sorting': '📦',
      'Spotting': '🔍',
      'Washing': '🧼',
      'Dry Cleaning': '🧴',
      'Drying': '💨',
      'Ironing': '👔',
      'Quality Check': '✔️',
      'Packing': '📦',
      'Ready for Pickup': '✅',
      'Out for Delivery': '🚚',
      'Delivered': '✨',
      'Return': '↩️',
      'Refund': '💸',
      'Cancelled': '❌'
    };
    return icons[status] || '';
  }, []);

  const getPaymentStatusClass = useCallback((status) => {
    const classes = {
      'Paid': 'payment-paid',
      'Pending': 'payment-pending',
      'Partial': 'payment-partial'
    };
    return classes[status] || 'payment-pending';
  }, []);

  const getPaymentStatusIcon = useCallback((status) => {
    const icons = {
      'Paid': '✅',
      'Pending': '⏳',
      'Partial': '🔄'
    };
    return icons[status] || '⏳';
  }, []);

  const getPaymentMethodIcon = useCallback((method) => {
    const icons = {
      'Cash': '💵',
      'Card': '💳',
      'UPI': '📱',
      'Online': '🌐',
      'Wallet': '👛',
      'Credit': '📝'
    };
    return icons[method] || '💰';
  }, []);

  // Memoize the loading state
  const loadingContent = useMemo(() => {
    if (!loading) return null;
    return (
      <div className="table-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }, [loading]);

  // Memoize the empty state
  const emptyContent = useMemo(() => {
    if (loading || orders.length > 0) return null;
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No orders found</h3>
          <p>Start by creating a new order or adjust your search criteria.</p>
        </div>
      </div>
    );
  }, [loading, orders.length]);

  if (loading) {
    return loadingContent;
  }

  if (orders.length === 0) {
    return emptyContent;
  }

  return (
    <div className="table-container">
      <div className="table-wrapper">
        <table className="order-table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Order Date</th>
              <th>Expected Delivery</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr 
                key={order._id} 
                className={isOverdue(order.expectedDelivery, order.status) ? 'overdue' : ''}
              >
                <td className="ticket-number" onClick={() => onOrderSelect(order)}>
                  {order.ticketNumber}
                  {isOverdue(order.expectedDelivery, order.status) && (
                    <span className="overdue-badge">⚠️</span>
                  )}
                </td>
                <td>{order.customerName}</td>
                <td>{order.phoneNumber}</td>
                <td>{order.items.length} item(s)</td>
                <td className="amount">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                <td className="payment-cell">
                  <div className="payment-info">
                    <span className={`payment-badge ${getPaymentStatusClass(order.paymentStatus)}`}>
                      {getPaymentStatusIcon(order.paymentStatus)} {order.paymentStatus || 'Pending'}
                    </span>
                    <span className="payment-method">
                      {getPaymentMethodIcon(order.paymentMethod)} {order.paymentMethod || 'Cash'}
                    </span>
                  </div>
                </td>
                <td>{formatDate(order.orderDate)}</td>
                <td>{formatDate(order.expectedDelivery)}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {getStatusIcon(order.status)} {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {pagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.pages}
          totalRecords={pagination.total}
          onPageChange={onPageChange}
        />
      )}
      
      {!pagination && (
        <div className="table-footer">
          <p>Showing all {orders.length} result(s)</p>
        </div>
      )}
    </div>
  );
});

OrderTable.displayName = 'OrderTable';

export default OrderTable;

