import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import QRScanner from './QRScanner';
import useOrderNotifications from '../hooks/useOrderNotifications';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import './OperationsDashboard.css';
import './NotificationStyles.css';

const OperationsDashboard = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';
  const [operationMode, setOperationMode] = useState(isStaff ? 'b2b' : 'operations'); // 'operations' | 'b2b'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verifiedItems, setVerifiedItems] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [activeTab, setActiveTab] = useState('readyforprocessing'); // readyforprocessing, sorting, or spotting
  const [stats, setStats] = useState({
    readyforprocessing: 0,
    sorting: 0,
    spotting: 0,
    b2b: 0
  });
  const [showScanner, setShowScanner] = useState(false);

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

  // Fetch orders based on active tab and operation mode
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      if (operationMode === 'b2b') {
        // Manager: assignedTo=me | Staff: assignedToStaff=me
        const statuses = 'Received in Workshop,Ready for Processing,Sorting,Spotting,Washing,Dry Cleaning,Drying,Ironing,Quality Check,Packing';
        const params = { status: statuses, limit: 100, orderType: 'b2b' };
        if (isStaff) params.assignedToStaff = 'me';
        else params.assignedTo = 'me';
        const response = await api.getOrders(params);
        if (response.success) {
          setOrders(response.data || []);
        }
        const countParams = { status: statuses, limit: 500, orderType: 'b2b' };
        if (isStaff) countParams.assignedToStaff = 'me';
        else countParams.assignedTo = 'me';
        const countRes = await api.getOrders(countParams);
        setStats(prev => ({
          ...prev,
          b2b: (countRes.data || []).length
        }));
      } else {
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
        
        const statsResponse = await api.getOrderStats();
        if (statsResponse.success) {
          const statuses = 'Received in Workshop,Ready for Processing,Sorting,Spotting,Washing,Dry Cleaning,Drying,Ironing,Quality Check,Packing';
          const assignedRes = await api.getOrders({ status: statuses, limit: 500, assignedTo: 'me', orderType: 'b2b' });
          setStats(prev => ({
            ...prev,
            readyforprocessing: statsResponse.data.readyForProcessingOrders || 0,
            sorting: statsResponse.data.sortingOrders || 0,
            spotting: statsResponse.data.spottingOrders || 0,
            b2b: (assignedRes.data || []).length
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, operationMode, isStaff]);

  // Fetch staff for B2B assignment
  const fetchStaff = useCallback(async () => {
    try {
      const response = await api.getStaff();
      if (response.success) setStaff(response.data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    if (operationMode === 'b2b' && !isStaff) fetchStaff();
  }, [fetchOrders, operationMode, fetchStaff, isStaff]);

  // Handle order selection
  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setVerifiedItems({});
    setSelectedStaff(order.assignedToStaff || '');
  };

  // Get effective tab for modal (when in B2B mode, derive from order status)
  const getEffectiveTab = () => {
    if (!selectedOrder) return activeTab;
    if (operationMode === 'b2b') {
      const s = selectedOrder.status;
      if (s === 'Ready for Processing') return 'readyforprocessing';
      if (s === 'Sorting') return 'sorting';
      if (s === 'Spotting') return 'spotting';
      if (['Received in Workshop', 'Tag Printed'].includes(s)) return 'received';
      return 'spotting'; // view-only for other statuses
    }
    return activeTab;
  };
  const effectiveTab = getEffectiveTab();

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

  // Get target status based on current tab (use effectiveTab for modal)
  const getTargetStatus = () => {
    return effectiveTab === 'readyforprocessing' ? 'Sorting' : 'Spotting';
  };

  // Confirm status update
  const confirmStatusUpdate = async () => {
    if (!selectedOrder || !allItemsVerified()) return;
    
    const targetStatus = getTargetStatus();
    
    try {
      setUpdateLoading(true);
      await api.updateOrderStatus(selectedOrder._id, targetStatus);
      
      // Update tracking fields based on stage
      const updateData = effectiveTab === 'readyforprocessing' || effectiveTab === 'received'
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

  // B2B: Assign order to Staff (Manager assigns, not process)
  const assignToStaff = async () => {
    if (!selectedOrder || !selectedStaff) return;
    
    try {
      setUpdateLoading(true);
      const staffMember = staff.find(s => s._id === selectedStaff);
      
      await api.updateOrderStatus(selectedOrder._id, 'Sorting');
      await api.updateOrder(selectedOrder._id, {
        assignedToStaff: selectedStaff,
        assignedToStaffName: staffMember?.name || 'Staff',
        assignedToStaffAt: new Date()
      });
      
      fetchOrders();
      setSelectedOrder(null);
      setSelectedStaff('');
    } catch (error) {
      alert('Failed to assign: ' + error.message);
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
      'Received in Workshop': '#10b981',
      'Tag Printed': '#06b6d4',
      'Ready for Processing': '#8b5cf6',
      'Sorting': '#64748b',
      'Spotting': '#f59e0b',
      'Washing': '#3b82f6',
      'Dry Cleaning': '#8b5cf6',
      'Drying': '#f59e0b',
      'Ironing': '#64748b',
      'Quality Check': '#10b981',
      'Packing': '#06b6d4'
    };
    return colors[status] || '#6b7280';
  };

  // Handle QR scan result
  const handleScanResult = async (scanData) => {
    setShowScanner(false);
    try {
      let order = null;
      if (scanData.orderId) {
        const response = await api.getOrderById(scanData.orderId);
        if (response.success) order = response.data;
      }
      if (!order && scanData.ticketNumber) {
        const response = await api.getOrderByTicketNumber(scanData.ticketNumber);
        if (response.success) order = response.data;
      }
      if (order) {
        setSelectedOrder(order);
      } else {
        alert('Order not found! Please check the QR code or ticket number.');
      }
    } catch (error) {
      console.error('Error finding order:', error);
      alert('Error finding order. Please try again.');
    }
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
            <button style={{ background: '#3B82F6', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 10, fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => setShowScanner(true)} title="Scan QR">📷</button>
            <button className="btn-refresh" onClick={fetchOrders}>
              🔄
            </button>
          </div>
        </div>

        {/* Mode Switcher - Manager sees both, Staff sees only B2B */}
        {!isStaff && (
        <div className="ops-mode-switcher">
          <button
            className={`ops-mode-btn ${operationMode === 'operations' ? 'active' : ''}`}
            onClick={() => { setOperationMode('operations'); setActiveTab('readyforprocessing'); }}
          >
            🏭 Operations
          </button>
          <button
            className={`ops-mode-btn ${operationMode === 'b2b' ? 'active' : ''}`}
            onClick={() => setOperationMode('b2b')}
          >
            🏢 B2B Operation ({stats.b2b})
          </button>
        </div>
        )}
        
        {/* Stats Cards / Tabs - only in Operations mode (manager only) */}
        {!isStaff && operationMode === 'operations' && (
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
        )}
      </div>

      {/* Orders List */}
      <div className="ops-content">
        <div className="ops-section-header">
          <h2>
            {operationMode === 'b2b' 
              ? `🏢 ${isStaff ? 'B2B Assigned to Me' : 'B2B Operation'} (${orders.length})`
              : `${activeTab === 'readyforprocessing' ? '✅ Ready for Processing' : 
                activeTab === 'sorting' ? '📦 Sorting Orders' : 
                '🔍 Spotting Orders'} (${orders.length})`}
          </h2>
          <p>
            {operationMode === 'b2b'
              ? isStaff 
                ? 'B2B orders assigned to you - Process and move to next stage'
                : 'B2B orders: Assign to Staff → Staff processes → Back to Manager → Frontdesk'
              : activeTab === 'readyforprocessing' 
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
                    {order.orderType === 'b2b' && <span className="b2b-tag">B2B </span>}{order.status}
                  </span>
                  {operationMode === 'b2b' && !isStaff && order.status === 'Received in Workshop' && (
                    <button className="btn-process">Assign to Staff →</button>
                  )}
                  {operationMode === 'b2b' && order.assignedToStaffName && (
                    <span className="staff-badge">👤 {order.assignedToStaffName}</span>
                  )}
                  {operationMode === 'b2b' && isStaff && !['Spotting', 'Washing', 'Dry Cleaning', 'Drying', 'Ironing', 'Quality Check', 'Packing'].includes(order.status) && (
                    <button className="btn-process">Process →</button>
                  )}
                  {operationMode !== 'b2b' && !['Received in Workshop', 'Tag Printed', 'Spotting', 'Washing', 'Dry Cleaning', 'Drying', 'Ironing', 'Quality Check', 'Packing'].includes(order.status) && (
                    <button className="btn-process">Process →</button>
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
              {/* B2B: Assign to Staff (Received in Workshop) */}
              {operationMode === 'b2b' && !isStaff && selectedOrder.status === 'Received in Workshop' && (
                <div className="b2b-assign-section">
                  <h4>👤 Assign to Staff</h4>
                  <p className="assign-hint">B2B flow: Manager assigns to Staff → Staff processes → Back to Manager → Frontdesk</p>
                  <div className="staff-grid">
                    {staff.map((person) => (
                      <div
                        key={person._id}
                        className={`staff-option ${selectedStaff === person._id ? 'selected' : ''}`}
                        onClick={() => setSelectedStaff(person._id)}
                      >
                        <span className="staff-icon">👤</span>
                        <span className="staff-name">{person.name}</span>
                        {selectedStaff === person._id && <span className="check-icon">✓</span>}
                      </div>
                    ))}
                  </div>
                  {staff.length === 0 && <p className="no-staff-msg">No staff available</p>}
                  <button 
                    className="btn-primary assign-staff-btn"
                    onClick={assignToStaff}
                    disabled={!selectedStaff || updateLoading}
                  >
                    {updateLoading ? 'Assigning...' : '👤 Assign to Staff'}
                  </button>
                </div>
              )}

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
                  <h4>{effectiveTab === 'spotting' ? '🧺 Items' : '🧺 Verify Items'}</h4>
                  {effectiveTab !== 'spotting' && (
                    <span className="verification-progress">
                      {getVerifiedCount()}/{selectedOrder.items?.length || 0} verified
                    </span>
                  )}
                  {effectiveTab === 'spotting' && (
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
                {effectiveTab !== 'spotting' && (
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
              {operationMode === 'b2b' && !isStaff && selectedOrder?.status === 'Received in Workshop' ? (
                <button className="btn-close-full" onClick={() => { setSelectedOrder(null); setSelectedStaff(''); }}>
                  Close
                </button>
              ) : effectiveTab === 'spotting' || ['Tag Printed', 'Washing', 'Dry Cleaning', 'Drying', 'Ironing', 'Quality Check', 'Packing'].includes(selectedOrder?.status) ? (
                <button 
                  className="btn-close-full"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </button>
              ) : effectiveTab === 'sorting' ? (
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

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default OperationsDashboard;

