import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import useOrderNotifications from '../hooks/useOrderNotifications';
import NotificationBell from './NotificationBell';
import './OperationsDashboard.css';
import './NotificationStyles.css';

const OperationsDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verifiedItems, setVerifiedItems] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('readyforprocessing'); // readyforprocessing, sorting, or spotting
  const [stats, setStats] = useState({
    readyforprocessing: 0,
    sorting: 0,
    spotting: 0
  });

  // ========================================
  // NOTIFICATION SYSTEM
  // ========================================
  const notificationFetch = useCallback(async () => {
    try {
      // Fetch Ready for Processing orders (main entry point for Operations)
      const response = await api.getOrders({ status: 'Ready for Processing', limit: 100 });
      return response.data || [];
    } catch (error) {
      console.error('Notification fetch error:', error);
      return [];
    }
  }, []);

  const {
    notifications,
    showToast,
    latestNotification,
    unreadCount,
    showPanel,
    bellShaking,
    notificationPermission,
    markAsRead,
    clearAll,
    dismissToast,
    togglePanel,
    requestNotificationPermission
  } = useOrderNotifications({
    fetchOrders: notificationFetch,
    dashboardName: 'Operations',
    pollInterval: 15000,
    notificationIcon: '⚙️'
  });

  // Fetch orders based on active tab
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const statusMap = {
        'readyforprocessing': 'Ready for Processing',
        'sorting': 'Sorting',
        'spotting': 'Spotting'
      };
      const status = statusMap[activeTab];
      const response = await api.getOrders({ status, limit: 100 });
      if (response.success) {
        setOrders(response.data || []);
      }
      
      // Always fetch stats
      const statsResponse = await api.getOrderStats();
      if (statsResponse.success) {
        setStats({
          readyforprocessing: statsResponse.data.readyForProcessingOrders || 0,
          sorting: statsResponse.data.sortingOrders || 0,
          spotting: statsResponse.data.spottingOrders || 0
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle order selection
  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setVerifiedItems({});
  };

  // Toggle item verification
  const toggleItemVerified = (index) => {
    setVerifiedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Check if all items are verified
  const allItemsVerified = () => {
    if (!selectedOrder?.items?.length) return true;
    return selectedOrder.items.every((_, index) => verifiedItems[index]);
  };

  // Get verified items count
  const getVerifiedCount = () => {
    return Object.values(verifiedItems).filter(Boolean).length;
  };

  // Get target status based on current tab
  const getTargetStatus = () => {
    return activeTab === 'readyforprocessing' ? 'Sorting' : 'Spotting';
  };

  // Confirm status update
  const confirmStatusUpdate = async () => {
    if (!selectedOrder || !allItemsVerified()) return;
    
    const targetStatus = getTargetStatus();
    
    try {
      setUpdateLoading(true);
      await api.updateOrderStatus(selectedOrder._id, targetStatus);
      
      // Update tracking fields based on stage
      const updateData = activeTab === 'received' 
        ? { sortedAt: new Date(), sortedBy: 'Operations Manager' }
        : { spottedAt: new Date(), spottedBy: 'Operations Manager' };
      
      await api.updateOrder(selectedOrder._id, updateData);
      fetchOrders();
      setSelectedOrder(null);
      setVerifiedItems({});
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle Return order (from sorting phase)
  const handleReturnOrder = async () => {
    if (!selectedOrder) return;
    
    const confirmReturn = window.confirm(
      `Are you sure you want to mark order ${selectedOrder.ticketNumber} for RETURN?\n\nThis will send it to Frontdesk for delivery assignment.`
    );
    
    if (!confirmReturn) return;
    
    try {
      setUpdateLoading(true);
      await api.updateOrderStatus(selectedOrder._id, 'Return');
      await api.updateOrder(selectedOrder._id, {
        returnMarkedAt: new Date(),
        returnMarkedBy: 'Operations Manager',
        notes: (selectedOrder.notes || '') + '\n[Return marked from Sorting by Operations Manager]'
      });
      fetchOrders();
      setSelectedOrder(null);
      setVerifiedItems({});
    } catch (error) {
      alert('Failed to mark as return: ' + error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'Ready for Processing': '#8b5cf6',
      'Sorting': '#64748b',
      'Spotting': '#f59e0b'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div className="operations-dashboard">
      {/* Notification Bell Component */}
      <NotificationBell
        notifications={notifications}
        showToast={showToast}
        latestNotification={latestNotification}
        unreadCount={unreadCount}
        showPanel={showPanel}
        bellShaking={bellShaking}
        notificationPermission={notificationPermission}
        onTogglePanel={togglePanel}
        onDismissToast={dismissToast}
        onMarkAsRead={markAsRead}
        onClearAll={clearAll}
        onRequestPermission={requestNotificationPermission}
        dashboardIcon="⚙️"
        toastTitle="New Order for Processing!"
      />

      {/* Header */}
      <div className="ops-header">
        <div className="ops-header-top">
          <h1>🏭 Operations Dashboard</h1>
          <div className="ops-header-actions">
            <button
              className={`btn-notification ${bellShaking ? 'shaking' : ''} ${unreadCount > 0 ? 'has-notifications' : ''}`}
              onClick={togglePanel}
            >
              <span className="bell-icon">🔔</span>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            <button className="btn-refresh" onClick={fetchOrders}>
              🔄
            </button>
          </div>
        </div>
        
        {/* Stats Cards / Tabs */}
        <div className="ops-stats">
          <div 
            className={`ops-stat-card readyforprocessing ${activeTab === 'readyforprocessing' ? 'active' : ''}`}
            onClick={() => setActiveTab('readyforprocessing')}
          >
            <span className="stat-icon">✅</span>
            <span className="stat-value">{stats.readyforprocessing}</span>
            <span className="stat-label">Ready</span>
          </div>
          <div className="ops-flow-arrow">→</div>
          <div 
            className={`ops-stat-card sorting ${activeTab === 'sorting' ? 'active' : ''}`}
            onClick={() => setActiveTab('sorting')}
          >
            <span className="stat-icon">📦</span>
            <span className="stat-value">{stats.sorting}</span>
            <span className="stat-label">Sorting</span>
          </div>
          <div className="ops-flow-arrow">→</div>
          <div 
            className={`ops-stat-card spotting ${activeTab === 'spotting' ? 'active' : ''}`}
            onClick={() => setActiveTab('spotting')}
          >
            <span className="stat-icon">🔍</span>
            <span className="stat-value">{stats.spotting}</span>
            <span className="stat-label">Spotting</span>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="ops-content">
        <div className="ops-section-header">
          <h2>
            {activeTab === 'readyforprocessing' ? '✅ Ready for Processing' : 
             activeTab === 'sorting' ? '📦 Sorting Orders' : 
             '🔍 Spotting Orders'} ({orders.length})
          </h2>
          <p>
            {activeTab === 'readyforprocessing' 
              ? 'Orders from Back Office - Verify items and move to Sorting' 
              : activeTab === 'sorting'
              ? 'Verify items and move to Spotting'
              : 'View orders in spotting stage'}
          </p>
        </div>

        {loading ? (
          <div className="ops-loading">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="ops-empty">
            <span className="empty-icon">✅</span>
            <h3>All Clear!</h3>
            <p>No orders pending for processing</p>
          </div>
        ) : (
          <div className="ops-orders-grid">
            {orders.map((order) => (
              <div 
                key={order._id} 
                className="ops-order-card"
                onClick={() => handleOrderSelect(order)}
              >
                <div className="order-card-header">
                  <span className="ticket-number">{order.ticketNumber}</span>
                  <span className="order-date">
                    {new Date(order.orderDate).toLocaleDateString('en-IN', { 
                      day: '2-digit', 
                      month: 'short' 
                    })}
                  </span>
                </div>
                
                <div className="order-card-body">
                  <h3>{order.customerName}</h3>
                  <p className="phone">📱 {order.phoneNumber}</p>
                  <div className="order-summary">
                    <span className="items-count">📦 {order.items?.length || 0} items</span>
                    <span className="amount">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="order-card-footer">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {activeTab === 'received' ? '📥' : activeTab === 'sorting' ? '📦' : '🔍'} {order.status}
                  </span>
                  {activeTab !== 'spotting' && (
                    <button className="btn-process">
                      Process →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Processing Modal */}
      {selectedOrder && (
        <div className="ops-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="ops-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-icon">📋</span>
                <div>
                  <h2>{selectedOrder.ticketNumber}</h2>
                  <p>{activeTab === 'spotting' ? 'Order Details' : 'Process Order'}</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Customer Info */}
              <div className="customer-info-card">
                <h3>👤 {selectedOrder.customerName}</h3>
                <p className="phone">📱 {selectedOrder.phoneNumber}</p>
                <div className="order-meta">
                  <span className="meta-item">
                    <span className="label">Order Date:</span>
                    <span className="value">{new Date(selectedOrder.orderDate).toLocaleDateString('en-IN')}</span>
                  </span>
                  <span className="meta-item">
                    <span className="label">Amount:</span>
                    <span className="value amount">₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</span>
                  </span>
                </div>
              </div>

              {/* Items Verification / View */}
              <div className="items-verification-section">
                <div className="section-header">
                  <h4>{activeTab === 'spotting' ? '🧺 Items' : '🧺 Verify Items'}</h4>
                  {activeTab !== 'spotting' && (
                    <span className="verification-progress">
                      {getVerifiedCount()}/{selectedOrder.items?.length || 0} verified
                    </span>
                  )}
                  {activeTab === 'spotting' && (
                    <span className="verification-progress">
                      {selectedOrder.items?.length || 0} items
                    </span>
                  )}
                </div>
                
                <div className="items-list">
                  {selectedOrder.items?.map((item, index) => (
                    <div 
                      key={index}
                      className={`verification-item ${activeTab !== 'spotting' && verifiedItems[index] ? 'verified' : ''} ${activeTab === 'spotting' ? 'view-only' : ''}`}
                      onClick={() => activeTab !== 'spotting' && toggleItemVerified(index)}
                    >
                      {activeTab !== 'spotting' && (
                        <div className="item-checkbox">
                          {verifiedItems[index] ? (
                            <span className="checkbox-checked">✓</span>
                          ) : (
                            <span className="checkbox-unchecked"></span>
                          )}
                        </div>
                      )}
                      <div className="item-details">
                        <span className="item-name">{item.description || item.name}</span>
                        <span className="item-type">{item.productId || 'General'}</span>
                      </div>
                      <div className="item-quantity">
                        <span className="qty-label">Qty:</span>
                        <span className="qty-value">{item.quantity}</span>
                      </div>
                      <div className="item-price">
                        ₹{item.price?.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Verification Message - only for received/sorting */}
                {activeTab !== 'spotting' && (
                  <div className={`verification-message ${allItemsVerified() ? 'complete' : 'pending'}`}>
                    {allItemsVerified() ? (
                      <>✅ All items verified! Select target status and confirm.</>
                    ) : (
                      <>⏳ Tap each item to verify count before processing</>
                    )}
                  </div>
                )}
              </div>

              {/* Next Status Info - only for received/sorting */}
              {activeTab !== 'spotting' && (
                <div className="next-status-info">
                  <span className="label">Will move to:</span>
                  <span className="next-status">
                    {activeTab === 'received' ? '📦 Sorting' : '🔍 Spotting'}
                  </span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {activeTab === 'spotting' ? (
                <button 
                  className="btn-close-full"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </button>
              ) : activeTab === 'sorting' ? (
                /* Sorting tab - Two options: Spotting or Return */
                <>
                  <button 
                    className="btn-cancel"
                    onClick={() => setSelectedOrder(null)}
                    disabled={updateLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-return"
                    onClick={handleReturnOrder}
                    disabled={updateLoading}
                  >
                    {updateLoading ? '...' : '↩️ Return'}
                  </button>
                  <button 
                    className={`btn-confirm ${!allItemsVerified() ? 'disabled' : ''}`}
                    onClick={confirmStatusUpdate}
                    disabled={!allItemsVerified() || updateLoading}
                  >
                    {updateLoading ? (
                      <>
                        <span className="spinner-small"></span>
                        Processing...
                      </>
                    ) : (
                      <>🔍 Move to Spotting</>
                    )}
                  </button>
                </>
              ) : (
                /* Ready for Processing tab - Only Sorting option */
                <>
                  <button 
                    className="btn-cancel"
                    onClick={() => setSelectedOrder(null)}
                    disabled={updateLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    className={`btn-confirm ${!allItemsVerified() ? 'disabled' : ''}`}
                    onClick={confirmStatusUpdate}
                    disabled={!allItemsVerified() || updateLoading}
                  >
                    {updateLoading ? (
                      <>
                        <span className="spinner-small"></span>
                        Processing...
                      </>
                    ) : (
                      <>✓ Move to {getTargetStatus()}</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsDashboard;

