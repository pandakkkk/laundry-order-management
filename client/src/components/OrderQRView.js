import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './OrderQRView.css';

// All possible order statuses in workflow order
const ORDER_STATUSES = [
  'Received',
  'Sorting',
  'Spotting', 
  'Washing',
  'Dry Cleaning',
  'Drying',
  'Ironing',
  'Quality Check',
  'Packing',
  'Ready for Pickup',
  'Ready for Delivery',
  'Out for Delivery',
  'Delivered',
  'Return',
  'Refund',
  'Cancelled'
];

const OrderQRView = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(null);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Store the intended destination so we can redirect back after login
      sessionStorage.setItem('redirectAfterLogin', `/order/${orderId}`);
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate, orderId]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        // Fetch from protected API (requires auth token)
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 401) {
          sessionStorage.setItem('redirectAfterLogin', `/order/${orderId}`);
          navigate('/login');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Order not found');
        }
        const data = await response.json();
        setOrder(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (orderId && isAuthenticated) {
      fetchOrder();
    }
  }, [orderId, isAuthenticated, navigate]);

  // Function to refetch order data
  const refetchOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrder(data.data);
      }
    } catch (err) {
      console.error('Error refetching order:', err);
    }
  };

  // Update order status
  const handleStatusUpdate = async (newStatus) => {
    if (updating || newStatus === order.status) return;
    
    setUpdating(true);
    setUpdateMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      
      const data = await response.json();
      setOrder(data.data);
      setUpdateMessage({ type: 'success', text: `Status updated to "${newStatus}"` });
      setShowStatusPicker(false);
      
      // Clear message after 3 seconds
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (err) {
      setUpdateMessage({ type: 'error', text: err.message });
      setTimeout(() => setUpdateMessage(null), 5000);
    } finally {
      setUpdating(false);
    }
  };

  // Get next logical status in workflow
  const getNextStatus = () => {
    const currentIndex = ORDER_STATUSES.indexOf(order?.status);
    if (currentIndex === -1 || currentIndex >= ORDER_STATUSES.length - 1) return null;
    // Skip Return, Refund, Cancelled as next status options
    const nextIndex = currentIndex + 1;
    if (nextIndex < ORDER_STATUSES.length - 3) {
      return ORDER_STATUSES[nextIndex];
    }
    return null;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return date;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Received': '#3b82f6',
      'Processing': '#f59e0b',
      'Washing': '#06b6d4',
      'Drying': '#8b5cf6',
      'Ironing': '#ec4899',
      'Ready for Pickup': '#10b981',
      'Ready for Delivery': '#14b8a6',
      'Out for Delivery': '#f97316',
      'Delivered': '#22c55e',
      'Cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Received': '📥',
      'Processing': '⚙️',
      'Washing': '🧼',
      'Drying': '💨',
      'Ironing': '👔',
      'Ready for Pickup': '✅',
      'Ready for Delivery': '📦',
      'Out for Delivery': '🚴',
      'Delivered': '🎉',
      'Cancelled': '❌'
    };
    return icons[status] || '📋';
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="qr-view-container">
        <div className="qr-view-loading">
          <div className="loading-spinner"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return (
      <div className="qr-view-container">
        <div className="qr-view-loading">
          <div className="loading-spinner"></div>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="qr-view-container">
        <div className="qr-view-loading">
          <div className="loading-spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qr-view-container">
        <div className="qr-view-error">
          <span className="error-icon">❌</span>
          <h2>Order Not Found</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="qr-view-container">
        <div className="qr-view-error">
          <span className="error-icon">🔍</span>
          <h2>No Order Data</h2>
          <p>Could not load order information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-view-container">
      <div className="qr-view-card">
        {/* Header */}
        <div className="qr-view-header">
          <div className="brand-logo">🧺</div>
          <h1>Laundry Order</h1>
          <div className="ticket-badge">
            {order.ticket || order.ticketNumber}
          </div>
        </div>

        {/* Status Banner */}
        <div 
          className="status-banner"
          style={{ backgroundColor: getStatusColor(order.status) }}
        >
          <span className="status-icon">{getStatusIcon(order.status)}</span>
          <span className="status-text">{order.status}</span>
        </div>

        {/* Status Update Section */}
        <div className="qr-view-section status-update-section">
          <h3>🔄 Update Status</h3>
          
          {/* Update Message */}
          {updateMessage && (
            <div className={`update-message ${updateMessage.type}`}>
              {updateMessage.type === 'success' ? '✅' : '❌'} {updateMessage.text}
            </div>
          )}
          
          {/* Quick Update - Next Status Button */}
          {getNextStatus() && !showStatusPicker && (
            <button 
              className="next-status-btn"
              onClick={() => handleStatusUpdate(getNextStatus())}
              disabled={updating}
            >
              {updating ? (
                <span>⏳ Updating...</span>
              ) : (
                <span>➡️ Move to: <strong>{getNextStatus()}</strong></span>
              )}
            </button>
          )}
          
          {/* Show All Statuses Button */}
          <button 
            className="show-all-status-btn"
            onClick={() => setShowStatusPicker(!showStatusPicker)}
          >
            {showStatusPicker ? '✕ Close' : '📋 Select Different Status'}
          </button>
          
          {/* Status Picker */}
          {showStatusPicker && (
            <div className="status-picker">
              {ORDER_STATUSES.map((status) => (
                <button
                  key={status}
                  className={`status-option ${status === order.status ? 'current' : ''}`}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updating || status === order.status}
                  style={{ 
                    borderColor: getStatusColor(status),
                    backgroundColor: status === order.status ? getStatusColor(status) : 'transparent',
                    color: status === order.status ? 'white' : getStatusColor(status)
                  }}
                >
                  {getStatusIcon(status)} {status}
                  {status === order.status && ' ✓'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="qr-view-section">
          <h3>👤 Customer Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Name</span>
              <span className="info-value">{order.customer || order.customerName || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone</span>
              <span className="info-value">
                {order.phone || order.customerPhone ? (
                  <a href={`tel:${order.phone || order.customerPhone}`}>
                    📞 {order.phone || order.customerPhone}
                  </a>
                ) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="qr-view-section">
          <h3>👕 Items ({order.items?.length || order.totalItems || 0})</h3>
          <div className="items-list">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <div key={index} className="item-row">
                  <span className="item-name">{item.desc || item.description}</span>
                  <span className="item-qty">×{item.qty || item.quantity}</span>
                  {item.price && <span className="item-price">₹{item.price}</span>}
                </div>
              ))
            ) : (
              <p className="no-items">No items listed</p>
            )}
          </div>
          {(order.total || order.totalAmount) && (
            <div className="total-row">
              <span>Total Amount</span>
              <span className="total-amount">₹{order.total || order.totalAmount}</span>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="qr-view-section">
          <h3>📅 Timeline</h3>
          <div className="timeline">
            <div className="timeline-item">
              <span className="timeline-icon">📥</span>
              <div className="timeline-content">
                <span className="timeline-label">Order Placed</span>
                <span className="timeline-date">
                  {formatDate(order.timeline?.ordered || order.ordered || order.orderDate)}
                </span>
              </div>
            </div>
            <div className="timeline-item">
              <span className="timeline-icon">📆</span>
              <div className="timeline-content">
                <span className="timeline-label">Expected Delivery</span>
                <span className="timeline-date">
                  {formatDate(order.timeline?.expected || order.expected || order.expectedDelivery)}
                </span>
              </div>
            </div>
            {(order.timeline?.completed || order.completedDate) && (
              <div className="timeline-item completed">
                <span className="timeline-icon">✅</span>
                <div className="timeline-content">
                  <span className="timeline-label">Completed</span>
                  <span className="timeline-date">
                    {formatDate(order.timeline?.completed || order.completedDate)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rack Assignment */}
        {(order.rack || order.rackNumber) && (
          <div className="qr-view-section rack-section">
            <h3>📍 Rack Location</h3>
            <div className="rack-badge">
              <span className="rack-icon">🗄️</span>
              <span className="rack-number">{order.rack || order.rackNumber}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="qr-view-footer">
          <p>Thank you for choosing our service! 🙏</p>
          <small>Order ID: {order.id || order._id || orderId}</small>
        </div>
      </div>
    </div>
  );
};

export default OrderQRView;

