import React, { memo, useCallback, useMemo } from 'react';
import './OrderTable.css';
import { format } from 'date-fns';
import { usePermissions } from '../context/PermissionsContext';
import { PERMISSIONS } from '../config/permissions';
import Pagination from './Pagination';

const OrderTable = memo(({ orders, loading, pagination, currentPage, onOrderSelect, onStatusUpdate, onPageChange }) => {
  const { can } = usePermissions();
  
  const getStatusClass = useCallback((status) => {
    const statusClasses = {
      'Received': 'status-received',
      'Sorting': 'status-sorting',
      'Spotting': 'status-spotting',
      'Washing': 'status-washing',
      'Dry Cleaning': 'status-drycleaning',
      'Drying': 'status-drying',
      'Ironing': 'status-ironing',
      'Quality Check': 'status-quality',
      'Packing': 'status-packing',
      'Ready for Pickup': 'status-ready',
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
    if (status === 'Delivered' || status === 'Cancelled' || status === 'Return' || status === 'Refund') return false;
    return new Date(expectedDelivery) < new Date();
  }, []);

  const getStatusIcon = useCallback((status) => {
    const icons = {
      'Received': '📥',
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
              <th>Customer ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Order Date</th>
              <th>Expected Delivery</th>
              <th>Status</th>
              <th>Actions</th>
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
                <td className="customer-id">{order.customerId}</td>
                <td>{order.customerName}</td>
                <td>{order.phoneNumber}</td>
                <td>{order.items.length} item(s)</td>
                <td className="amount">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                <td>{formatDate(order.orderDate)}</td>
                <td>{formatDate(order.expectedDelivery)}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {getStatusIcon(order.status)} {order.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => onOrderSelect(order)}
                      className="btn-icon"
                      title="View details"
                    >
                      👁️
                    </button>
                    {can(PERMISSIONS.ORDER_STATUS_UPDATE) && order.status !== 'Delivered' && order.status !== 'Cancelled' && order.status !== 'Return' && order.status !== 'Refund' && (
                      <select
                        value={order.status}
                        onChange={(e) => onStatusUpdate(order._id, e.target.value)}
                        className="status-select"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="Received">📥 Received</option>
                        <option value="Sorting">📦 Sorting</option>
                        <option value="Spotting">🔍 Spotting</option>
                        <option value="Washing">🧼 Washing</option>
                        <option value="Dry Cleaning">🧴 Dry Cleaning</option>
                        <option value="Drying">💨 Drying</option>
                        <option value="Ironing">👔 Ironing</option>
                        <option value="Quality Check">✔️ Quality Check</option>
                        <option value="Packing">📦 Packing</option>
                        <option value="Ready for Pickup">✅ Ready for Pickup</option>
                        <option value="Out for Delivery">🚚 Out for Delivery</option>
                        <option value="Delivered">✨ Delivered</option>
                        <option value="Return">↩️ Return</option>
                        <option value="Refund">💸 Refund</option>
                        <option value="Cancelled">❌ Cancelled</option>
                      </select>
                    )}
                  </div>
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

