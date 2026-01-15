import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './LinenTrackerDashboard.css';

const LinenTrackerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verifiedItems, setVerifiedItems] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('packing'); // packing, rackassignment, readyfordelivery
  const [stats, setStats] = useState({
    packing: 0,
    rackassignment: 0,
    readyfordelivery: 0
  });
  const [rackNumber, setRackNumber] = useState('');
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState('');

  // Map tab names to actual status values
  const tabToStatus = {
    'packing': 'Packing',
    'rackassignment': 'Ready for Pickup', // Using Ready for Pickup as rack assignment stage
    'readyfordelivery': 'Out for Delivery' // Shows dispatched orders
  };

  // Get next status based on current tab
  const getNextStatus = (tab) => {
    const flow = {
      'packing': 'Ready for Pickup', // Packing assigns rack and moves to Ready for Pickup
      'rackassignment': 'Out for Delivery' // Rack section assigns delivery boy and dispatches
    };
    return flow[tab] || null;
  };

  // Check if current tab is the delivery assignment stage (now both rack and readyfordelivery)
  const isDeliveryAssignment = activeTab === 'readyfordelivery' || activeTab === 'rackassignment';
  
  // Check if current tab is view-only (Ready for Delivery is now view-only)
  const isViewOnly = activeTab === 'readyfordelivery';

  // Fetch delivery personnel
  const fetchDeliveryPersonnel = useCallback(async () => {
    try {
      const response = await api.getDeliveryPersonnel();
      if (response.success) {
        setDeliveryPersonnel(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching delivery personnel:', error);
    }
  }, []);

  // Fetch orders based on active tab
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const status = tabToStatus[activeTab];
      const response = await api.getOrders({ status, limit: 100 });
      if (response.success) {
        setOrders(response.data || []);
      }
      
      // Fetch stats for all stages
      const statsResponse = await api.getOrderStats();
      if (statsResponse.success) {
        setStats({
          packing: statsResponse.data.packingOrders || 0,
          rackassignment: statsResponse.data.readyForPickupOrders || 0,
          readyfordelivery: statsResponse.data.outForDeliveryOrders || 0 // Show dispatched orders count
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
    fetchDeliveryPersonnel();
  }, [fetchOrders, fetchDeliveryPersonnel]);

  // Handle order selection
  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setVerifiedItems({});
    setRackNumber(order.rackNumber || '');
    setSelectedDeliveryPerson(order.assignedTo || '');
  };

  // Toggle item verification
  const toggleItemVerified = (index) => {
    if (isDeliveryAssignment) return;
    setVerifiedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Check if all items are verified
  const allItemsVerified = () => {
    if (!selectedOrder?.items?.length) return true;
    if (isDeliveryAssignment) return true; // No verification needed for delivery assignment
    return selectedOrder.items.every((_, index) => verifiedItems[index]);
  };

  // Get verified items count
  const getVerifiedCount = () => {
    return Object.values(verifiedItems).filter(Boolean).length;
  };

  // Validate rack number format (Letter + Number, e.g., A1, B2, D10)
  const isValidRackNumber = (rack) => {
    return /^[A-Z][0-9]+$/.test(rack);
  };

  // Check if can proceed
  const canProceed = () => {
    if (activeTab === 'packing') {
      // Packing requires both item verification AND valid rack assignment
      return allItemsVerified() && isValidRackNumber(rackNumber);
    }
    if (activeTab === 'rackassignment') {
      // Rack section requires delivery person selection to dispatch
      return selectedDeliveryPerson !== '';
    }
    if (activeTab === 'readyfordelivery') {
      // Ready for Delivery is now view-only
      return false;
    }
    return false;
  };

  // Confirm status update
  const confirmStatusUpdate = async () => {
    if (!selectedOrder || !canProceed()) return;
    
    try {
      setUpdateLoading(true);
      
      if (activeTab === 'rackassignment') {
        // Rack section - Assign delivery person and dispatch
        const deliveryPerson = deliveryPersonnel.find(p => p._id === selectedDeliveryPerson);
        await api.assignOrder(selectedOrder._id, selectedDeliveryPerson, deliveryPerson?.name || 'Delivery Boy');
        await api.updateOrderStatus(selectedOrder._id, 'Out for Delivery');
      } else if (activeTab === 'packing') {
        // Packing - includes rack assignment, moves to Ready for Pickup
        const targetStatus = 'Ready for Pickup';
        
        await api.updateOrderStatus(selectedOrder._id, targetStatus);
        
        // Save rack assignment along with packing completion
        await api.updateOrder(selectedOrder._id, { 
          rackNumber: rackNumber,
          rackAssignedAt: new Date(),
          rackAssignedBy: 'Linen Tracker',
          packedAt: new Date(),
          packedBy: 'Linen Tracker'
        });
      } else {
        const targetStatus = getNextStatus(activeTab);
        if (!targetStatus) return;
        
        await api.updateOrderStatus(selectedOrder._id, targetStatus);
      }
      
      fetchOrders();
      setSelectedOrder(null);
      setVerifiedItems({});
      setRackNumber('');
      setSelectedDeliveryPerson('');
    } catch (error) {
      alert('Failed to update: ' + error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'Packing': '#10b981',
      'Ready for Pickup': '#8b5cf6',
      'Ready for Delivery': '#f59e0b',
      'Out for Delivery': '#3b82f6'
    };
    return colors[status] || '#6b7280';
  };

  // Get tab icon
  const getTabIcon = (tab) => {
    const icons = {
      'packing': '📦',
      'rackassignment': '🗄️',
      'readyfordelivery': '🚚'
    };
    return icons[tab] || '📋';
  };

  // Get tab label
  const getTabLabel = (tab) => {
    const labels = {
      'packing': 'Packing',
      'rackassignment': 'Rack',
      'readyfordelivery': 'Delivery'
    };
    return labels[tab] || tab;
  };

  // Get section description
  const getSectionDescription = () => {
    if (activeTab === 'packing') return 'Verify items, assign rack, and mark ready for pickup';
    if (activeTab === 'rackassignment') return 'Assign delivery boy and dispatch orders';
    if (activeTab === 'readyfordelivery') return 'Orders out for delivery - track assigned delivery personnel';
    return '';
  };

  // Get action button text
  const getActionText = () => {
    if (activeTab === 'packing') return 'Pack & Assign Rack';
    if (activeTab === 'rackassignment') return 'Assign & Dispatch';
    if (activeTab === 'readyfordelivery') return 'View Only';
    return 'Process';
  };

  return (
    <div className="linentracker-dashboard">
      {/* Header */}
      <div className="lt-header">
        <div className="lt-header-top">
          <h1>📋 Linen Tracker Dashboard</h1>
          <button className="btn-refresh" onClick={fetchOrders}>
            🔄
          </button>
        </div>
        
        {/* Stats Cards / Tabs */}
        <div className="lt-stats">
          {['packing', 'rackassignment', 'readyfordelivery'].map((tab, index, arr) => (
            <React.Fragment key={tab}>
              <div 
                className={`lt-stat-card ${tab} ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <span className="stat-icon">{getTabIcon(tab)}</span>
                <span className="stat-value">{stats[tab]}</span>
                <span className="stat-label">{getTabLabel(tab)}</span>
              </div>
              {index < arr.length - 1 && <div className="lt-flow-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="lt-content">
        <div className="lt-section-header">
          <h2>
            {getTabIcon(activeTab)} {tabToStatus[activeTab]} Orders ({orders.length})
          </h2>
          <p>{getSectionDescription()}</p>
        </div>

        {loading ? (
          <div className="lt-loading">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="lt-empty">
            <span className="empty-icon">✅</span>
            <h3>All Clear!</h3>
            <p>No orders pending in {tabToStatus[activeTab]}</p>
          </div>
        ) : (
          <div className="lt-orders-grid">
            {orders.map((order) => (
              <div 
                key={order._id} 
                className="lt-order-card"
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
                  {order.rackNumber && (
                    <div className="rack-info">
                      <span className="rack-badge">🗄️ Rack: {order.rackNumber}</span>
                    </div>
                  )}
                  {order.assignedToName && (
                    <div className="delivery-info">
                      <span className="delivery-badge">🚴 {order.assignedToName}</span>
                    </div>
                  )}
                </div>

                <div className="order-card-footer">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {getTabIcon(activeTab)} {order.status}
                  </span>
                  {!isViewOnly && (
                    <button className="btn-process">
                      {isDeliveryAssignment ? 'Assign' : 'Process'} →
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
        <div className="lt-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="lt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-icon">📋</span>
                <div>
                  <h2>{selectedOrder.ticketNumber}</h2>
                  <p>{isViewOnly ? 'Order Details' : isDeliveryAssignment ? 'Assign Delivery' : 'Process & Assign Rack'}</p>
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
                {selectedOrder.rackNumber && (
                  <div className="current-rack">
                    <span className="rack-label">🗄️ Current Rack:</span>
                    <span className="rack-value">{selectedOrder.rackNumber}</span>
                  </div>
                )}
              </div>

              {/* Rack Assignment Section - now shown in packing tab */}
              {activeTab === 'packing' && (
                <div className="rack-assignment-section">
                  <h4>🗄️ Assign Rack Location</h4>
                  <div className="rack-input-group">
                    <input
                      type="text"
                      placeholder="Enter rack number (e.g., A1, B2, D3)"
                      value={rackNumber}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        // Allow only valid format: Letter (A-Z) + Number (1-99)
                        if (value === '' || /^[A-Z]$/.test(value) || /^[A-Z][0-9]{0,2}$/.test(value)) {
                          setRackNumber(value);
                        }
                      }}
                      className={`rack-input ${rackNumber && /^[A-Z][0-9]+$/.test(rackNumber) ? 'valid' : ''}`}
                      maxLength={3}
                    />
                    <p className="rack-format-hint">Format: Letter + Number (e.g., A1, B2, C10, D3)</p>
                  </div>
                  {rackNumber && /^[A-Z][0-9]+$/.test(rackNumber) && (
                    <div className="rack-valid-msg">✅ Rack <strong>{rackNumber}</strong> selected</div>
                  )}
                  {rackNumber && !/^[A-Z][0-9]+$/.test(rackNumber) && (
                    <p className="rack-required-msg">⚠️ Please enter valid format (e.g., A1, B2)</p>
                  )}
                  {!rackNumber && (
                    <p className="rack-required-msg">⚠️ Rack assignment is required to proceed</p>
                  )}
                </div>
              )}

              {/* Delivery Assignment Section - for rackassignment tab (assign & dispatch) */}
              {activeTab === 'rackassignment' && (
                <div className="delivery-assignment-section">
                  <h4>🚴 Assign Delivery Personnel</h4>
                  <div className="delivery-select-group">
                    <select
                      value={selectedDeliveryPerson}
                      onChange={(e) => setSelectedDeliveryPerson(e.target.value)}
                      className="delivery-select"
                    >
                      <option value="">-- Select Delivery Boy --</option>
                      {deliveryPersonnel.map(person => (
                        <option key={person._id} value={person._id}>
                          🚴 {person.name} {person.isActive ? '(Available)' : '(Busy)'}
                        </option>
                      ))}
                    </select>
                    {deliveryPersonnel.length === 0 && (
                      <p className="no-delivery-msg">No delivery personnel available</p>
                    )}
                  </div>
                  
                  {selectedDeliveryPerson && (
                    <div className="selected-delivery-info">
                      <span className="check-icon">✓</span>
                      <span>
                        Will be assigned to: <strong>
                          {deliveryPersonnel.find(p => p._id === selectedDeliveryPerson)?.name}
                        </strong>
                      </span>
                    </div>
                  )}
                  {!selectedDeliveryPerson && (
                    <p className="delivery-required-msg">⚠️ Please select a delivery boy to dispatch</p>
                  )}
                </div>
              )}

              {/* Items Section - for packing tab only */}
              {activeTab === 'packing' && (
                <div className="items-verification-section">
                  <div className="section-header">
                    <h4>🧺 {activeTab === 'packing' ? 'Verify Packed Items' : 'Items'}</h4>
                    {activeTab === 'packing' && (
                      <span className="verification-progress">
                        {getVerifiedCount()}/{selectedOrder.items?.length || 0} verified
                      </span>
                    )}
                  </div>
                  
                  <div className="items-list">
                    {selectedOrder.items?.map((item, index) => (
                      <div 
                        key={index}
                        className={`verification-item ${activeTab === 'packing' && verifiedItems[index] ? 'verified' : ''} ${activeTab !== 'packing' ? 'view-only' : ''}`}
                        onClick={() => toggleItemVerified(index)}
                      >
                        {activeTab === 'packing' && (
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

                  {/* Verification Message - only for packing */}
                  {activeTab === 'packing' && (
                    <div className={`verification-message ${allItemsVerified() ? 'complete' : 'pending'}`}>
                      {allItemsVerified() ? (
                        <>✅ All items verified!</>
                      ) : (
                        <>⏳ Tap each item to verify before proceeding</>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Items summary for rack and ready for delivery tabs */}
              {(activeTab === 'rackassignment' || activeTab === 'readyfordelivery') && (
                <div className="items-summary-section">
                  <h4>📦 Order Summary</h4>
                  <div className="summary-stats">
                    <div className="summary-stat">
                      <span className="stat-label">Items</span>
                      <span className="stat-value">{selectedOrder.items?.length || 0}</span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">Total</span>
                      <span className="stat-value">₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</span>
                    </div>
                    {selectedOrder.rackNumber && (
                      <div className="summary-stat">
                        <span className="stat-label">Rack</span>
                        <span className="stat-value">{selectedOrder.rackNumber}</span>
                      </div>
                    )}
                  </div>
                  {/* Show assigned delivery person for Out for Delivery orders */}
                  {activeTab === 'readyfordelivery' && selectedOrder.assignedToName && (
                    <div className="assigned-delivery-info">
                      <h4>🚴 Assigned Delivery Boy</h4>
                      <div className="delivery-person-card">
                        <span className="delivery-icon">👤</span>
                        <span className="delivery-name">{selectedOrder.assignedToName}</span>
                      </div>
                      {selectedOrder.assignedAt && (
                        <p className="assigned-time">
                          Dispatched: {new Date(selectedOrder.assignedAt).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Next Status Info - for packing and rack tabs */}
              {activeTab === 'packing' && (
                <div className="next-status-info">
                  <span className="label">Will move to:</span>
                  <span className="next-status">
                    🗄️ Ready for Pickup
                  </span>
                </div>
              )}
              {activeTab === 'rackassignment' && selectedDeliveryPerson && (
                <div className="next-status-info dispatch">
                  <span className="label">Will dispatch to:</span>
                  <span className="next-status">
                    🚴 Out for Delivery
                  </span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {isViewOnly ? (
                <button 
                  className="btn-close-full"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </button>
              ) : (
                <>
                  <button 
                    className="btn-cancel"
                    onClick={() => setSelectedOrder(null)}
                    disabled={updateLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    className={`btn-confirm ${!canProceed() ? 'disabled' : ''}`}
                    onClick={confirmStatusUpdate}
                    disabled={!canProceed() || updateLoading}
                  >
                    {updateLoading ? (
                      <>
                        <span className="spinner-small"></span>
                        Processing...
                      </>
                    ) : (
                      <>✓ {getActionText()}</>
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

export default LinenTrackerDashboard;

