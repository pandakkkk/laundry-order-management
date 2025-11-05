import React, { memo, useCallback, useMemo } from 'react';
import './OrderDetails.css';
import { format } from 'date-fns';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../config/permissions';

const OrderDetails = memo(({ order, onClose, onStatusUpdate, onDelete }) => {
  const { can, hasAnyPermission } = usePermissions();
  const formatDate = (date) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusClass = (status) => {
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
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Order Details</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h3>📋 Order Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Ticket Number:</span>
                <span className="detail-value ticket">{order.ticketNumber}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Order Number:</span>
                <span className="detail-value">{order.orderNumber}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className={`status-badge ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Served By:</span>
                <span className="detail-value">{order.servedBy}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>👤 Customer Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Customer ID:</span>
                <span className="detail-value customer-id">{order.customerId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{order.customerName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{order.phoneNumber}</span>
              </div>
              {order.location && (
                <div className="detail-item full-width">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{order.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3>🧺 Items</h3>
            <div className="items-list">
              {order.items.map((item, index) => (
                <div key={index} className="item-row">
                  <span className="item-qty">{item.quantity}x</span>
                  <span className="item-desc">{item.description}</span>
                  <span className="item-price">₹{item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h3>💳 Payment Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Total Amount:</span>
                <span className="detail-value amount">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment Method:</span>
                <span className="detail-value">{order.paymentMethod}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment Status:</span>
                <span className={`payment-badge ${order.paymentStatus.toLowerCase()}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>📅 Timeline</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Order Date:</span>
                <span className="detail-value">{formatDate(order.orderDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Expected Delivery:</span>
                <span className="detail-value">{formatDate(order.expectedDelivery)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">{formatDate(order.updatedAt)}</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="detail-section">
              <h3>📝 Notes</h3>
              <p className="notes-text">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {can(PERMISSIONS.ORDER_STATUS_UPDATE) && (
            <div className="status-update">
              <label htmlFor="status-select">Update Status:</label>
              <select
                id="status-select"
                value={order.status}
                onChange={(e) => onStatusUpdate(order._id, e.target.value)}
                className="status-select-large"
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
          </div>
          )}
          
          <div className="action-buttons">
            {hasAnyPermission(PERMISSIONS.ORDER_DELETE, PERMISSIONS.ORDER_CANCEL) && (
              <button 
                className="btn btn-danger btn-sm" 
                onClick={() => onDelete(order._id)}
              >
                🗑️ Delete
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

OrderDetails.displayName = 'OrderDetails';

export default OrderDetails;

