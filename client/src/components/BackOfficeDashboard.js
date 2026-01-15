import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import GarmentTagPrint from './GarmentTagPrint';
import './BackOfficeDashboard.css';

const BackOfficeDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('received'); // received, tagging, readyforprocessing
  const [stats, setStats] = useState({
    received: 0,
    tagging: 0,
    readyforprocessing: 0
  });
  const [showTagPrint, setShowTagPrint] = useState(false);
  const [tagPrintOrder, setTagPrintOrder] = useState(null);

  // Map tab names to actual status values
  const tabToStatus = {
    'received': 'Received in Workshop',  // Orders received from delivery pickup
    'tagging': 'Tag Printed',            // Orders with tags printed
    'readyforprocessing': 'Ready for Processing'  // Ready for Operations Manager
  };

  // Get next status based on current tab
  const getNextStatus = (tab) => {
    const flow = {
      'received': 'Tag Printed',           // After printing tags
      'tagging': 'Ready for Processing'    // After confirming, ready for operations
    };
    return flow[tab] || null;
  };

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
          received: statsResponse.data.receivedInWorkshopOrders || 0,
          tagging: statsResponse.data.tagPrintedOrders || 0,
          readyforprocessing: statsResponse.data.readyForProcessingOrders || 0
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
  };

  // Handle print tags (just print, don't change status)
  const handlePrintTags = (order, e) => {
    if (e) e.stopPropagation();
    setTagPrintOrder(order);
    setShowTagPrint(true);
  };

  // Close tag print modal
  const handleTagPrintClose = () => {
    setShowTagPrint(false);
    setTagPrintOrder(null);
  };

  // Handle move to tagging (separate from printing)
  const handleMoveToTagging = async (order, e) => {
    if (e) e.stopPropagation();
    try {
      setUpdateLoading(true);
      await api.updateOrderStatus(order._id, 'Tag Printed');
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle direct process (for tagging tab → ready for processing)
  const handleProcess = async (order, e) => {
    if (e) e.stopPropagation();
    try {
      setUpdateLoading(true);
      const targetStatus = getNextStatus(activeTab);
      if (!targetStatus) return;
      
      await api.updateOrderStatus(order._id, targetStatus);
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'Received in Workshop': '#3b82f6', // Blue - Received from delivery
      'Tag Printed': '#f59e0b',          // Amber - Tagging in progress
      'Ready for Processing': '#10b981'  // Green - Ready for operations
    };
    return colors[status] || '#6b7280';
  };

  // Get tab icon
  const getTabIcon = (tab) => {
    const icons = {
      'received': '📥',
      'tagging': '🏷️',
      'readyforprocessing': '✅'
    };
    return icons[tab] || '📋';
  };

  // Get tab label
  const getTabLabel = (tab) => {
    const labels = {
      'received': 'IN WORKSHOP',
      'tagging': 'TAGGING',
      'readyforprocessing': 'READY FOR PROCESSING'
    };
    return labels[tab] || tab.toUpperCase();
  };

  // Get section description
  const getSectionDescription = () => {
    if (activeTab === 'received') return 'Orders received in workshop from delivery pickup - Print garment tags';
    if (activeTab === 'tagging') return 'Tags printed - Verify items and send to Operations';
    if (activeTab === 'readyforprocessing') return 'Orders ready for Operations Manager to process';
    return '';
  };

  return (
    <div className="backoffice-dashboard">
      {/* Header with Stats */}
      <div className="bo-header">
        <div className="bo-title">
          <h1>🏢 Back Office Dashboard</h1>
          <p>In Workshop → Tagging → Ready for Processing</p>
        </div>

        {/* Stats Cards / Tabs */}
        <div className="bo-stats">
          {['received', 'tagging', 'readyforprocessing'].map((tab, index, arr) => (
            <React.Fragment key={tab}>
              <div 
                className={`bo-stat-card ${tab} ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <span className="stat-icon">{getTabIcon(tab)}</span>
                <span className="stat-value">{stats[tab]}</span>
                <span className="stat-label">{getTabLabel(tab)}</span>
              </div>
              {index < arr.length - 1 && <div className="bo-flow-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="bo-content">
        <div className="bo-section-header">
          <h2>
            {getTabIcon(activeTab)} {tabToStatus[activeTab]} Orders ({orders.length})
          </h2>
          <p>{getSectionDescription()}</p>
        </div>

        {loading ? (
          <div className="bo-loading">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bo-empty">
            <span className="empty-icon">✅</span>
            <h3>All Clear!</h3>
            <p>No orders pending in {tabToStatus[activeTab]}</p>
          </div>
        ) : (
          <div className="bo-orders-grid">
            {orders.map((order) => (
              <div 
                key={order._id} 
                className="bo-order-card"
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
                  <div className="card-actions">
                    {activeTab === 'received' && (
                      <>
                        <button 
                          className="btn-process print-btn"
                          onClick={(e) => handlePrintTags(order, e)}
                        >
                          🖨️ Print
                        </button>
                        <button 
                          className="btn-process move-btn"
                          onClick={(e) => handleMoveToTagging(order, e)}
                          disabled={updateLoading}
                        >
                          {updateLoading ? '...' : '→ Tagging'}
                        </button>
                      </>
                    )}
                    {activeTab === 'tagging' && (
                      <button 
                        className="btn-process"
                        onClick={(e) => handleProcess(order, e)}
                        disabled={updateLoading}
                      >
                        {updateLoading ? '...' : 'Ready →'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="bo-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="bo-modal" onClick={(e) => e.stopPropagation()}>
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

              {/* Items List */}
              <div className="items-section">
                <h4>📦 Items ({selectedOrder.items?.length || 0})</h4>
                <div className="items-list">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="item-row">
                      <span className="item-name">{item.itemName}</span>
                      <span className="item-service">{item.serviceType}</span>
                      <span className="item-qty">×{item.quantity}</span>
                      <span className="item-price">₹{item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="items-total">
                  <span>Total Amount</span>
                  <span className="total-value">₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Actions */}
              {activeTab === 'received' && (
                <div className="action-section">
                  <div className="action-buttons-row">
                    <button 
                      className="btn-secondary print-action"
                      onClick={(e) => handlePrintTags(selectedOrder, e)}
                    >
                      🖨️ Print Garment Tags
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={(e) => handleMoveToTagging(selectedOrder, e)}
                      disabled={updateLoading}
                    >
                      {updateLoading ? 'Processing...' : '→ Move to Tagging'}
                    </button>
                  </div>
                  <p className="action-hint">Print tags first, then move to Tagging when ready</p>
                </div>
              )}

              {activeTab === 'tagging' && (
                <div className="action-section">
                  <div className="action-buttons-row">
                    <button 
                      className="btn-secondary print-action"
                      onClick={(e) => handlePrintTags(selectedOrder, e)}
                    >
                      🖨️ Reprint Tags
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={(e) => handleProcess(selectedOrder, e)}
                      disabled={updateLoading}
                    >
                      {updateLoading ? 'Processing...' : '✅ Ready for Processing →'}
                    </button>
                  </div>
                  <p className="action-hint">Verify all {selectedOrder.items?.length || 0} items are tagged</p>
                </div>
              )}

              {activeTab === 'readyforprocessing' && (
                <div className="view-only-section">
                  <p className="view-only-msg">✅ This order is ready for Operations Manager to process</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tag Print Component - Uses GarmentTagPrint's built-in modal */}
      {showTagPrint && tagPrintOrder && (
        <GarmentTagPrint 
          order={tagPrintOrder} 
          onClose={handleTagPrintClose}
        />
      )}
    </div>
  );
};

export default BackOfficeDashboard;

