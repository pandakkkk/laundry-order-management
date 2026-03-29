import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import QRScanner from './QRScanner';
import useOrderNotifications from '../hooks/useOrderNotifications';
import NotificationBell from './NotificationBell';
import './FrontdeskDashboard.css';
import './NotificationStyles.css';

const FrontdeskDashboard = () => {
  const [operationMode, setOperationMode] = useState('operations'); // 'operations' (retail) | 'b2b'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('neworders'); // neworders, assigned, pickedup, returns
  const [stats, setStats] = useState({
    neworders: 0,
    assigned: 0,
    pickedup: 0,
    returns: 0
  });
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  // ========================================
  // NOTIFICATION SYSTEM
  // ========================================
  const notificationFetch = useCallback(async () => {
    try {
      // Fetch new orders (retail + B2B) and returns for notifications
      const [receivedRes, returnRes] = await Promise.all([
        api.getOrders({ status: 'Booking Confirmed', limit: 100 }),
        api.getOrders({ status: 'Return', limit: 100 })
      ]);
      
      const newOrders = (receivedRes.data || []).filter(o => !o.assignedTo);
      const returns = (returnRes.data || []).filter(o => !o.assignedTo);
      
      return [...newOrders, ...returns];
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
    hasNewOrders,
    notificationPermission,
    markAsRead,
    clearAll,
    dismissToast,
    togglePanel,
    requestNotificationPermission
  } = useOrderNotifications({
    fetchOrders: notificationFetch,
    dashboardName: 'Frontdesk',
    pollInterval: 15000,
    notificationIcon: '🎫'
  });

  // Map tab names to actual status values (different for retail vs B2B)
  const tabToStatus = operationMode === 'b2b'
    ? {
        'neworders': 'Booking Confirmed',      // B2B new orders - assign to manager
        'assigned': 'Received in Workshop',    // B2B assigned to manager (goes direct to workshop)
        'pickedup': 'Ready for Processing',   // B2B in operations pipeline
        'returns': 'Return'
      }
    : {
        'neworders': 'Booking Confirmed',      // Retail - assign delivery boy for pickup
        'assigned': 'Ready for Pickup',       // Assigned to delivery boy for pickup
        'pickedup': 'Received in Workshop',   // Picked up and at workshop
        'returns': 'Return'
      };

  // Fetch delivery personnel and managers
  const fetchPersonnel = useCallback(async () => {
    try {
      const [deliveryRes, managersRes] = await Promise.all([
        api.getDeliveryPersonnel(),
        api.getManagers()
      ]);
      if (deliveryRes.success) setDeliveryPersonnel(deliveryRes.data || []);
      if (managersRes.success) setManagers(managersRes.data || []);
    } catch (error) {
      console.error('Error fetching personnel:', error);
    }
  }, []);

  // Fetch orders based on active tab and operation mode
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const status = tabToStatus[activeTab];
      const orderType = operationMode === 'b2b' ? 'b2b' : 'retail';
      const response = await api.getOrders({ status, limit: 100, orderType });
      if (response.success) {
        // For neworders tab, filter only orders without assignedTo
        if (activeTab === 'neworders') {
          setOrders((response.data || []).filter(o => !o.assignedTo));
        } else if (activeTab === 'assigned') {
          // For assigned tab, show only orders with assignedTo
          setOrders((response.data || []).filter(o => o.assignedTo));
        } else if (activeTab === 'returns') {
          // Returns: B2B returns use delivery personnel; filter by orderType
          setOrders((response.data || []).filter(o => !o.assignedTo));
        } else {
          setOrders(response.data || []);
        }
      }
      
      // Fetch stats (filtered by orderType)
      const statusForAssigned = operationMode === 'b2b' ? 'Received in Workshop' : 'Ready for Pickup';
      const statusForPickedup = operationMode === 'b2b' ? 'Ready for Processing' : 'Received in Workshop';
      const [receivedRes, assignedRes, pickedupRes, returnRes] = await Promise.all([
        api.getOrders({ status: 'Booking Confirmed', limit: 500, orderType }),
        api.getOrders({ status: statusForAssigned, limit: 500, orderType }),
        api.getOrders({ status: statusForPickedup, limit: 500, orderType }),
        api.getOrders({ status: 'Return', limit: 500, orderType })
      ]);
      
      const unassignedCount = (receivedRes.data || []).filter(o => !o.assignedTo).length;
      const assignedCount = operationMode === 'b2b'
        ? (assignedRes.data || []).filter(o => o.assignedTo).length
        : (assignedRes.data || []).filter(o => o.assignedTo).length;
      const pickedupCount = (pickedupRes.data || []).length;
      const returnsCount = (returnRes.data || []).filter(o => !o.assignedTo).length;
      
      setStats({
        neworders: unassignedCount,
        assigned: assignedCount,
        pickedup: pickedupCount,
        returns: returnsCount
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, operationMode]);

  useEffect(() => {
    fetchOrders();
    fetchPersonnel();
  }, [fetchOrders, fetchPersonnel]);

  // Handle order selection
  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setSelectedDeliveryPerson(order.assignedTo || '');
  };

  // Assign delivery boy and move to Ready for Pickup (retail)
  const assignDeliveryBoy = async () => {
    if (!selectedOrder || !selectedDeliveryPerson) return;
    
    try {
      setUpdateLoading(true);
      
      const deliveryPerson = deliveryPersonnel.find(p => p._id === selectedDeliveryPerson);
      
      await api.updateOrderStatus(selectedOrder._id, 'Ready for Pickup');
      await api.updateOrder(selectedOrder._id, {
        assignedTo: selectedDeliveryPerson,
        assignedToName: deliveryPerson?.name || 'Delivery Boy',
        assignedAt: new Date()
      });
      
      fetchOrders();
      setSelectedOrder(null);
      setSelectedDeliveryPerson('');
    } catch (error) {
      alert('Failed to assign: ' + error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Assign to manager and move to Received in Workshop (B2B - skips pickup)
  const assignToManager = async () => {
    if (!selectedOrder || !selectedDeliveryPerson) return;
    
    try {
      setUpdateLoading(true);
      
      const manager = managers.find(p => p._id === selectedDeliveryPerson);
      
      // B2B: Assign to manager and move directly to workshop (no pickup needed)
      await api.updateOrderStatus(selectedOrder._id, 'Received in Workshop');
      await api.updateOrder(selectedOrder._id, {
        assignedTo: selectedDeliveryPerson,
        assignedToName: manager?.name || 'Manager',
        assignedAt: new Date()
      });
      
      fetchOrders();
      setSelectedOrder(null);
      setSelectedDeliveryPerson('');
    } catch (error) {
      alert('Failed to assign: ' + error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Assign return delivery
  const assignReturnDelivery = async () => {
    if (!selectedOrder || !selectedDeliveryPerson) return;
    
    try {
      setUpdateLoading(true);
      
      const deliveryPerson = deliveryPersonnel.find(p => p._id === selectedDeliveryPerson);
      
      // Assign the delivery person and update status to Out for Delivery (Return)
      await api.updateOrder(selectedOrder._id, {
        assignedTo: selectedDeliveryPerson,
        assignedToName: deliveryPerson?.name || 'Delivery Boy',
        assignedAt: new Date()
      });
      
      // Update status to Out for Delivery for return
      await api.updateOrderStatus(selectedOrder._id, 'Out for Delivery');
      
      fetchOrders();
      setSelectedOrder(null);
      setSelectedDeliveryPerson('');
    } catch (error) {
      alert('Failed to assign return: ' + error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'Booking Confirmed': '#3b82f6',
      'Ready for Pickup': '#f59e0b',
      'Received in Workshop': '#10b981',
      'Return': '#f97316'
    };
    return colors[status] || '#6b7280';
  };

  // Get tab icon
  const getTabIcon = (tab) => {
    const icons = {
      'neworders': '📝',
      'assigned': '🚴',
      'pickedup': '✅',
      'returns': '↩️'
    };
    return icons[tab] || '📋';
  };

  // Get tab label
  const getTabLabel = (tab) => {
    if (operationMode === 'b2b' && tab === 'assigned') {
      return 'ASSIGNED TO MANAGER';
    }
    const labels = {
      'neworders': 'NEW ORDERS',
      'assigned': 'ASSIGNED',
      'pickedup': 'IN WORKSHOP',
      'returns': 'RETURNS'
    };
    return labels[tab] || tab.toUpperCase();
  };

  // Get section description
  const getSectionDescription = () => {
    if (operationMode === 'b2b') {
      if (activeTab === 'neworders') return 'B2B orders - Assign to manager (skips pickup)';
      if (activeTab === 'assigned') return 'B2B orders assigned to managers - In workshop';
      if (activeTab === 'pickedup') return 'B2B orders in operations pipeline';
    } else {
      if (activeTab === 'neworders') return 'New orders - Assign delivery boy for pickup';
      if (activeTab === 'assigned') return 'Orders assigned to delivery boys for pickup';
      if (activeTab === 'pickedup') return 'Orders picked up and received in workshop';
    }
    if (activeTab === 'returns') return 'Return orders - Assign delivery boy for return delivery';
    return '';
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
    <div className="frontdesk-dashboard">
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
        dashboardIcon="🎫"
        toastTitle="New Order at Frontdesk!"
      />

      {/* Header with Stats */}
      <div className="fd-header">
        <div className="fd-title">
          <div className="fd-title-row">
            <h1>🎫 Frontdesk Dashboard</h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button style={{ background: '#3B82F6', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 10, fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => setShowScanner(true)} title="Scan QR">📷</button>
              <button
                className={`btn-notification header-bell ${bellShaking ? 'shaking' : ''} ${unreadCount > 0 ? 'has-notifications' : ''}`}
                onClick={togglePanel}
              >
                <span className="bell-icon">🔔</span>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
            </div>
          </div>
          <p>{operationMode === 'b2b' ? 'New Order → Assign to Manager → In Workshop' : 'New Order → Assign Pickup → In Workshop'}</p>
        </div>

        {/* Operation Mode Switcher - Operations vs B2B */}
        <div className="fd-mode-switcher">
          <button
            className={`fd-mode-btn ${operationMode === 'operations' ? 'active' : ''}`}
            onClick={() => { setOperationMode('operations'); setActiveTab('neworders'); }}
          >
            🏪 Operations
          </button>
          <button
            className={`fd-mode-btn ${operationMode === 'b2b' ? 'active' : ''}`}
            onClick={() => { setOperationMode('b2b'); setActiveTab('neworders'); }}
          >
            🏢 B2B Operations
          </button>
        </div>

        {/* Stats Cards / Tabs */}
        <div className="fd-stats">
          {['neworders', 'assigned', 'pickedup'].map((tab, index, arr) => (
            <React.Fragment key={tab}>
              <div 
                className={`fd-stat-card ${tab} ${activeTab === tab ? 'active' : ''} ${tab === 'neworders' && hasNewOrders ? 'tab-pulse-new' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <span className="stat-icon">{getTabIcon(tab)}</span>
                <span className={`stat-value ${tab === 'neworders' && hasNewOrders ? 'count-bounce' : ''}`}>{stats[tab]}</span>
                <span className="stat-label">{getTabLabel(tab)}</span>
              </div>
              {index < arr.length - 1 && <div className="fd-flow-arrow">→</div>}
            </React.Fragment>
          ))}
          {/* Returns tab - separate flow */}
          <div className="fd-flow-separator">|</div>
          <div 
            className={`fd-stat-card returns ${activeTab === 'returns' ? 'active' : ''} ${hasNewOrders ? 'tab-pulse-new' : ''}`}
            onClick={() => setActiveTab('returns')}
          >
            <span className="stat-icon">↩️</span>
            <span className={`stat-value ${hasNewOrders ? 'count-bounce' : ''}`}>{stats.returns}</span>
            <span className="stat-label">RETURNS</span>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="fd-content">
        <div className="fd-section-header">
          <h2>
            {getTabIcon(activeTab)} {getTabLabel(activeTab)} ({orders.length})
          </h2>
          <p>{getSectionDescription()}</p>
        </div>

        {loading ? (
          <div className="fd-loading">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="fd-empty">
            <span className="empty-icon">✅</span>
            <h3>All Clear!</h3>
            <p>No orders in this section</p>
          </div>
        ) : (
          <div className="fd-orders-grid">
            {orders.map((order) => (
              <div 
                key={order._id} 
                className="fd-order-card"
                onClick={() => handleOrderSelect(order)}
              >
                <div className="order-card-header">
                  <span className="ticket-number">{order.ticketNumber}</span>
                  {order.orderType === 'b2b' && (
                    <span className="b2b-badge">B2B</span>
                  )}
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
                  {order.address && (
                    <p className="address">📍 {order.address.substring(0, 30)}...</p>
                  )}
                  <div className="order-summary">
                    <span className="items-count">📦 {order.items?.length || 0} items</span>
                    <span className="amount">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  {order.assignedToName && (
                    <div className="assigned-info">
                      <span className="assigned-badge">🚴 {order.assignedToName}</span>
                    </div>
                  )}
                </div>

                <div className="order-card-footer">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {order.status}
                  </span>
                  {activeTab === 'neworders' && (
                    <button className="btn-process">
                      {operationMode === 'b2b' ? 'Assign to Manager →' : 'Assign →'}
                    </button>
                  )}
                  {activeTab === 'assigned' && (
                    <button className="btn-process view-btn">
                      View
                    </button>
                  )}
                  {activeTab === 'returns' && (
                    <button className="btn-process return-btn">
                      Assign Return →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Assignment Modal */}
      {selectedOrder && (
        <div className="fd-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="fd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>{selectedOrder.ticketNumber}</h2>
                <span 
                  className="status-badge large"
                  style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                >
                  {selectedOrder.status}
                </span>
              </div>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            <div className="modal-body">
              {/* Customer Info */}
              <div className="customer-section">
                <h4>👤 Customer Details</h4>
                <div className="customer-info">
                  <p><strong>{selectedOrder.customerName}</strong></p>
                  <p>📱 {selectedOrder.phoneNumber}</p>
                  {selectedOrder.address && <p>📍 {selectedOrder.address}</p>}
                </div>
              </div>

              {/* Items Summary */}
              <div className="items-summary">
                <h4>📦 Order Summary</h4>
                <div className="summary-row">
                  <span>Items</span>
                  <span>{selectedOrder.items?.length || 0}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount</span>
                  <span>₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Assignment for New Orders - Delivery (retail) or Manager (B2B) */}
              {activeTab === 'neworders' && (
                <div className="assignment-section">
                  {operationMode === 'b2b' ? (
                    <>
                      <h4>🏢 Assign to Manager</h4>
                      <p className="assignment-hint">B2B order - Assign to manager (goes directly to workshop, no pickup)</p>
                      
                      <div className="delivery-grid">
                        {managers.map((person) => (
                          <div
                            key={person._id}
                            className={`delivery-option ${selectedDeliveryPerson === person._id ? 'selected' : ''}`}
                            onClick={() => setSelectedDeliveryPerson(person._id)}
                          >
                            <span className="delivery-icon">👔</span>
                            <span className="delivery-name">{person.name}</span>
                            {selectedDeliveryPerson === person._id && (
                              <span className="check-icon">✓</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {managers.length === 0 && (
                        <p className="no-delivery-msg">No managers available</p>
                      )}

                      <button 
                        className="btn-primary assign-btn"
                        onClick={assignToManager}
                        disabled={!selectedDeliveryPerson || updateLoading}
                      >
                        {updateLoading ? 'Assigning...' : '🏢 Assign to Manager'}
                      </button>
                    </>
                  ) : (
                    <>
                      <h4>🚴 Assign Pickup Boy</h4>
                      <p className="assignment-hint">Select a delivery boy to pick up this order from customer</p>
                      
                      <div className="delivery-grid">
                        {deliveryPersonnel.map((person) => (
                          <div
                            key={person._id}
                            className={`delivery-option ${selectedDeliveryPerson === person._id ? 'selected' : ''}`}
                            onClick={() => setSelectedDeliveryPerson(person._id)}
                          >
                            <span className="delivery-icon">🚴</span>
                            <span className="delivery-name">{person.name}</span>
                            {selectedDeliveryPerson === person._id && (
                              <span className="check-icon">✓</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {deliveryPersonnel.length === 0 && (
                        <p className="no-delivery-msg">No delivery personnel available</p>
                      )}

                      <button 
                        className="btn-primary assign-btn"
                        onClick={assignDeliveryBoy}
                        disabled={!selectedDeliveryPerson || updateLoading}
                      >
                        {updateLoading ? 'Assigning...' : '🚴 Assign & Send for Pickup'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Assigned Order Info */}
              {activeTab === 'assigned' && selectedOrder.assignedToName && (
                <div className="assigned-section">
                  <h4>{operationMode === 'b2b' ? '🏢 Assigned to Manager' : '🚴 Assigned Delivery Boy'}</h4>
                  <div className="assigned-person">
                    <span className="person-icon">👤</span>
                    <div className="person-details">
                      <span className="person-name">{selectedOrder.assignedToName}</span>
                      {selectedOrder.assignedAt && (
                        <span className="assigned-time">
                          Assigned: {new Date(selectedOrder.assignedAt).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="pickup-status">
                    {operationMode === 'b2b' ? '✅ Order is in workshop (B2B - no pickup needed)' : '📍 Order is pending pickup from customer'}
                  </p>
                </div>
              )}

              {/* Picked Up Info */}
              {activeTab === 'pickedup' && (
                <div className="pickedup-section">
                  <p className="pickedup-msg">✅ Order has been picked up and is at the workshop</p>
                  <p className="next-step">Next: Back Office will print tags</p>
                </div>
              )}

              {/* Return Order Assignment */}
              {activeTab === 'returns' && (
                <div className="assignment-section return-assignment">
                  <h4>↩️ Assign Return Delivery</h4>
                  <p className="assignment-hint">Select a delivery boy to return this order to customer</p>
                  
                  {selectedOrder.notes && (
                    <div className="return-notes">
                      <span className="notes-label">📝 Notes:</span>
                      <p>{selectedOrder.notes}</p>
                    </div>
                  )}
                  
                  <div className="delivery-grid">
                    {deliveryPersonnel.map((person) => (
                      <div
                        key={person._id}
                        className={`delivery-option ${selectedDeliveryPerson === person._id ? 'selected' : ''}`}
                        onClick={() => setSelectedDeliveryPerson(person._id)}
                      >
                        <span className="delivery-icon">🚴</span>
                        <span className="delivery-name">{person.name}</span>
                        {selectedDeliveryPerson === person._id && (
                          <span className="check-icon">✓</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {deliveryPersonnel.length === 0 && (
                    <p className="no-delivery-msg">No delivery personnel available</p>
                  )}

                  <button 
                    className="btn-primary assign-btn return-assign-btn"
                    onClick={assignReturnDelivery}
                    disabled={!selectedDeliveryPerson || updateLoading}
                  >
                    {updateLoading ? 'Assigning...' : '↩️ Assign Return Delivery'}
                  </button>
                </div>
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

export default FrontdeskDashboard;

