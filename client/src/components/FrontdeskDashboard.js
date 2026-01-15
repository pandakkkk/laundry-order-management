import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './FrontdeskDashboard.css';

const FrontdeskDashboard = () => {
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
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState('');

  // Map tab names to actual status values
  const tabToStatus = {
    'neworders': 'Received',              // Newly created orders (need pickup assignment)
    'assigned': 'Ready for Pickup',       // Assigned to delivery boy for pickup
    'pickedup': 'Received in Workshop',   // Picked up and at workshop (moved to back office)
    'returns': 'Return'                   // Return orders from Operations (need delivery assignment)
  };

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
        // For neworders tab, filter only orders without assignedTo
        if (activeTab === 'neworders') {
          setOrders((response.data || []).filter(o => !o.assignedTo));
        } else if (activeTab === 'assigned') {
          // For assigned tab, show only orders with assignedTo
          setOrders((response.data || []).filter(o => o.assignedTo));
        } else if (activeTab === 'returns') {
          // For returns tab, show return orders that need delivery assignment
          setOrders((response.data || []).filter(o => !o.assignedTo));
        } else {
          setOrders(response.data || []);
        }
      }
      
      // Fetch stats
      const statsResponse = await api.getOrderStats();
      const allReceivedResponse = await api.getOrders({ status: 'Received', limit: 500 });
      const allReadyForPickupResponse = await api.getOrders({ status: 'Ready for Pickup', limit: 500 });
      const allReturnResponse = await api.getOrders({ status: 'Return', limit: 500 });
      
      if (statsResponse.success) {
        // Count unassigned Received orders
        const unassignedCount = (allReceivedResponse.data || []).filter(o => !o.assignedTo).length;
        // Count assigned Ready for Pickup orders
        const assignedCount = (allReadyForPickupResponse.data || []).filter(o => o.assignedTo).length;
        // Count unassigned Return orders
        const returnsCount = (allReturnResponse.data || []).filter(o => !o.assignedTo).length;
        
        setStats({
          neworders: unassignedCount,
          assigned: assignedCount,
          pickedup: statsResponse.data.receivedInWorkshopOrders || 0,
          returns: returnsCount
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
    setSelectedDeliveryPerson(order.assignedTo || '');
  };

  // Assign delivery boy and move to Ready for Pickup
  const assignDeliveryBoy = async () => {
    if (!selectedOrder || !selectedDeliveryPerson) return;
    
    try {
      setUpdateLoading(true);
      
      // Find delivery person name
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
      'Received': '#3b82f6',
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
    if (activeTab === 'neworders') return 'New orders - Assign delivery boy for pickup';
    if (activeTab === 'assigned') return 'Orders assigned to delivery boys for pickup';
    if (activeTab === 'pickedup') return 'Orders picked up and received in workshop';
    if (activeTab === 'returns') return 'Return orders from Operations - Assign delivery boy for return delivery';
    return '';
  };

  return (
    <div className="frontdesk-dashboard">
      {/* Header with Stats */}
      <div className="fd-header">
        <div className="fd-title">
          <h1>🎫 Frontdesk Dashboard</h1>
          <p>New Order → Assign Pickup → In Workshop</p>
        </div>

        {/* Stats Cards / Tabs */}
        <div className="fd-stats">
          {['neworders', 'assigned', 'pickedup'].map((tab, index, arr) => (
            <React.Fragment key={tab}>
              <div 
                className={`fd-stat-card ${tab} ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <span className="stat-icon">{getTabIcon(tab)}</span>
                <span className="stat-value">{stats[tab]}</span>
                <span className="stat-label">{getTabLabel(tab)}</span>
              </div>
              {index < arr.length - 1 && <div className="fd-flow-arrow">→</div>}
            </React.Fragment>
          ))}
          {/* Returns tab - separate flow */}
          <div className="fd-flow-separator">|</div>
          <div 
            className={`fd-stat-card returns ${activeTab === 'returns' ? 'active' : ''}`}
            onClick={() => setActiveTab('returns')}
          >
            <span className="stat-icon">↩️</span>
            <span className="stat-value">{stats.returns}</span>
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
                      Assign →
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

              {/* Delivery Assignment for New Orders */}
              {activeTab === 'neworders' && (
                <div className="assignment-section">
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
                </div>
              )}

              {/* Assigned Order Info */}
              {activeTab === 'assigned' && selectedOrder.assignedToName && (
                <div className="assigned-section">
                  <h4>🚴 Assigned Delivery Boy</h4>
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
                  <p className="pickup-status">📍 Order is pending pickup from customer</p>
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
    </div>
  );
};

export default FrontdeskDashboard;

