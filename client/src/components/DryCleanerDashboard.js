import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './DryCleanerDashboard.css';

const DryCleanerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verifiedItems, setVerifiedItems] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('spotting'); // spotting, drycleaning, ironing, qualitycheck, packing
  const [qcResult, setQcResult] = useState('pass'); // 'pass' or 'fail' - for quality check tab
  const [stats, setStats] = useState({
    spotting: 0,
    drycleaning: 0,
    ironing: 0,
    qualitycheck: 0,
    packing: 0
  });

  // Map tab names to actual status values
  const tabToStatus = {
    'spotting': 'Spotting',
    'drycleaning': 'Dry Cleaning',
    'ironing': 'Ironing',
    'qualitycheck': 'Quality Check',
    'packing': 'Packing'
  };

  // Get next status based on current tab
  const getNextStatus = (tab) => {
    const flow = {
      'spotting': 'Dry Cleaning',
      'drycleaning': 'Ironing',
      'ironing': 'Quality Check',
      'qualitycheck': 'Packing'
    };
    return flow[tab] || null;
  };

  // Check if current tab is view-only (last stage)
  const isViewOnly = activeTab === 'packing';

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
          spotting: statsResponse.data.spottingOrders || 0,
          drycleaning: statsResponse.data.dryCleaningOrders || 0,
          ironing: statsResponse.data.ironingOrders || 0,
          qualitycheck: statsResponse.data.qualityCheckOrders || 0,
          packing: statsResponse.data.packingOrders || 0
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
  }, [fetchOrders]);

  // Handle order selection
  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setVerifiedItems({});
    setQcResult('pass'); // Reset QC result when selecting new order
  };

  // Toggle item verification
  const toggleItemVerified = (index) => {
    if (isViewOnly) return;
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

  // Confirm status update
  const confirmStatusUpdate = async () => {
    if (!selectedOrder || !allItemsVerified() || isViewOnly) return;
    
    // Determine target status based on QC result
    let targetStatus;
    if (activeTab === 'qualitycheck' && qcResult === 'fail') {
      targetStatus = 'Spotting'; // Rework - send back to spotting
    } else {
      targetStatus = getNextStatus(activeTab);
    }
    
    if (!targetStatus) return;
    
    try {
      setUpdateLoading(true);
      await api.updateOrderStatus(selectedOrder._id, targetStatus);
      
      // Update tracking fields based on stage
      const trackingFields = {
        'spotting': { dryCleanedAt: new Date(), dryCleanedBy: 'Dry Cleaner' },
        'drycleaning': { ironedAt: new Date(), ironedBy: 'Dry Cleaner' },
        'ironing': { qualityCheckedAt: new Date(), qualityCheckedBy: 'Dry Cleaner' },
        'qualitycheck': qcResult === 'pass' 
          ? { packedAt: new Date(), packedBy: 'Dry Cleaner' }
          : { reworkAt: new Date(), reworkBy: 'Dry Cleaner', reworkReason: 'Quality Check Failed' }
      };
      
      if (trackingFields[activeTab]) {
        await api.updateOrder(selectedOrder._id, trackingFields[activeTab]);
      }
      
      fetchOrders();
      setSelectedOrder(null);
      setVerifiedItems({});
      setQcResult('pass'); // Reset QC result
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'Spotting': '#f59e0b',
      'Dry Cleaning': '#06b6d4',
      'Ironing': '#ec4899',
      'Quality Check': '#8b5cf6',
      'Packing': '#10b981'
    };
    return colors[status] || '#6b7280';
  };

  // Get tab icon
  const getTabIcon = (tab) => {
    const icons = {
      'spotting': '🎯',
      'drycleaning': '🫧',
      'ironing': '👔',
      'qualitycheck': '🔍',
      'packing': '📦'
    };
    return icons[tab] || '📋';
  };

  // Get tab label
  const getTabLabel = (tab) => {
    const labels = {
      'spotting': 'Spotting',
      'drycleaning': 'Dry Clean',
      'ironing': 'Ironing',
      'qualitycheck': 'QC',
      'packing': 'Packing'
    };
    return labels[tab] || tab;
  };

  // Get section description
  const getSectionDescription = () => {
    if (isViewOnly) return 'View orders ready for dispatch';
    const nextStatus = getNextStatus(activeTab);
    return `Verify items and move to ${nextStatus}`;
  };

  return (
    <div className="drycleaner-dashboard">
      {/* Header */}
      <div className="dc-header">
        <div className="dc-header-top">
          <h1>🫧 Dry Cleaner Dashboard</h1>
          <button className="btn-refresh" onClick={fetchOrders}>
            🔄
          </button>
        </div>
        
        {/* Stats Cards / Tabs */}
        <div className="dc-stats">
          {['spotting', 'drycleaning', 'ironing', 'qualitycheck', 'packing'].map((tab, index, arr) => (
            <React.Fragment key={tab}>
              <div 
                className={`dc-stat-card ${tab} ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <span className="stat-icon">{getTabIcon(tab)}</span>
                <span className="stat-value">{stats[tab]}</span>
                <span className="stat-label">{getTabLabel(tab)}</span>
              </div>
              {index < arr.length - 1 && <div className="dc-flow-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="dc-content">
        <div className="dc-section-header">
          <h2>
            {getTabIcon(activeTab)} {tabToStatus[activeTab]} Orders ({orders.length})
          </h2>
          <p>{getSectionDescription()}</p>
        </div>

        {loading ? (
          <div className="dc-loading">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="dc-empty">
            <span className="empty-icon">✅</span>
            <h3>All Clear!</h3>
            <p>No orders pending in {tabToStatus[activeTab]}</p>
          </div>
        ) : (
          <div className="dc-orders-grid">
            {orders.map((order) => (
              <div 
                key={order._id} 
                className="dc-order-card"
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
                    {getTabIcon(activeTab)} {order.status}
                  </span>
                  {!isViewOnly && (
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
        <div className="dc-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="dc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-icon">📋</span>
                <div>
                  <h2>{selectedOrder.ticketNumber}</h2>
                  <p>{isViewOnly ? 'Order Details' : 'Process Order'}</p>
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
                  <h4>{isViewOnly ? '🧺 Items' : '🧺 Verify Items'}</h4>
                  {!isViewOnly && (
                    <span className="verification-progress">
                      {getVerifiedCount()}/{selectedOrder.items?.length || 0} verified
                    </span>
                  )}
                  {isViewOnly && (
                    <span className="verification-progress">
                      {selectedOrder.items?.length || 0} items
                    </span>
                  )}
                </div>
                
                <div className="items-list">
                  {selectedOrder.items?.map((item, index) => (
                    <div 
                      key={index}
                      className={`verification-item ${!isViewOnly && verifiedItems[index] ? 'verified' : ''} ${isViewOnly ? 'view-only' : ''}`}
                      onClick={() => toggleItemVerified(index)}
                    >
                      {!isViewOnly && (
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

                {/* Verification Message - only for processing tabs */}
                {!isViewOnly && (
                  <div className={`verification-message ${allItemsVerified() ? 'complete' : 'pending'}`}>
                    {allItemsVerified() ? (
                      <>✅ All items verified! Confirm to proceed.</>
                    ) : (
                      <>⏳ Tap each item to verify before processing</>
                    )}
                  </div>
                )}
              </div>

              {/* QC Pass/Fail Toggle - Only for Quality Check tab */}
              {activeTab === 'qualitycheck' && allItemsVerified() && (
                <div className="qc-result-section">
                  <h4>🔍 Quality Check Result</h4>
                  <div className="qc-toggle-container">
                    <button 
                      className={`qc-toggle-btn pass ${qcResult === 'pass' ? 'active' : ''}`}
                      onClick={() => setQcResult('pass')}
                    >
                      <span className="qc-icon">✅</span>
                      <span className="qc-label">QC Passed</span>
                      <span className="qc-sublabel">Move to Packing</span>
                    </button>
                    <button 
                      className={`qc-toggle-btn fail ${qcResult === 'fail' ? 'active' : ''}`}
                      onClick={() => setQcResult('fail')}
                    >
                      <span className="qc-icon">⚠️</span>
                      <span className="qc-label">QC Failed</span>
                      <span className="qc-sublabel">Rework Required</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Next Status Info - only for processing tabs */}
              {!isViewOnly && (
                <div className={`next-status-info ${activeTab === 'qualitycheck' && qcResult === 'fail' ? 'rework' : ''}`}>
                  <span className="label">Will move to:</span>
                  <span className="next-status">
                    {activeTab === 'qualitycheck' && qcResult === 'fail' ? (
                      <>🎯 Spotting (Rework)</>
                    ) : (
                      <>
                        {getTabIcon(activeTab === 'spotting' ? 'drycleaning' : 
                                   activeTab === 'drycleaning' ? 'ironing' : 
                                   activeTab === 'ironing' ? 'qualitycheck' : 'packing')} {getNextStatus(activeTab)}
                      </>
                    )}
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
                    className={`btn-confirm ${!allItemsVerified() ? 'disabled' : ''} ${activeTab === 'qualitycheck' && qcResult === 'fail' ? 'rework' : ''}`}
                    onClick={confirmStatusUpdate}
                    disabled={!allItemsVerified() || updateLoading}
                  >
                    {updateLoading ? (
                      <>
                        <span className="spinner-small"></span>
                        Processing...
                      </>
                    ) : activeTab === 'qualitycheck' && qcResult === 'fail' ? (
                      <>🔄 Move to Spotting (Rework)</>
                    ) : (
                      <>✓ Move to {getNextStatus(activeTab)}</>
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

export default DryCleanerDashboard;

