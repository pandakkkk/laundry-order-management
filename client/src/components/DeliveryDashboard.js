import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './DeliveryDashboard.css';

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pickup'); // pickup, delivery, out, delivered, all
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    status: 'Delivered',
    receivedBy: 'self',
    receiverName: '',
    receiverPhone: '',
    notes: ''
  });
  const [stats, setStats] = useState({
    pickup: 0,        // Ready for Pickup - collect clothes from customer
    readyDelivery: 0, // Ready for Delivery - washed clothes in rack
    outForDelivery: 0,
    delivered: 0
  });

  // Fetch delivery orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getOrders({
        status: 'Ready for Pickup,Ready for Delivery,Out for Delivery,Delivered',
        limit: 100
      });
      
      if (response.success) {
        const deliveryOrders = response.data.filter(order => 
          ['Ready for Pickup', 'Ready for Delivery', 'Out for Delivery', 'Delivered'].includes(order.status)
        );
        setOrders(deliveryOrders);
        
        // Calculate stats
        const pickup = deliveryOrders.filter(o => o.status === 'Ready for Pickup').length;
        const readyDelivery = deliveryOrders.filter(o => o.status === 'Ready for Delivery').length;
        const outForDelivery = deliveryOrders.filter(o => o.status === 'Out for Delivery').length;
        const delivered = deliveryOrders.filter(o => o.status === 'Delivered').length;
        setStats({ pickup, readyDelivery, outForDelivery, delivered });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter orders based on search and tab
  useEffect(() => {
    let filtered = [...orders];
    
    // Filter by tab
    if (activeTab === 'pickup') {
      // Collect clothes FROM customer
      filtered = filtered.filter(o => o.status === 'Ready for Pickup');
    } else if (activeTab === 'delivery') {
      // Deliver washed clothes TO customer (from rack)
      filtered = filtered.filter(o => o.status === 'Ready for Delivery');
    } else if (activeTab === 'out') {
      // Currently out for delivery
      filtered = filtered.filter(o => o.status === 'Out for Delivery');
    } else if (activeTab === 'delivered') {
      filtered = filtered.filter(o => o.status === 'Delivered');
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.customerName?.toLowerCase().includes(query) ||
        o.ticketNumber?.toLowerCase().includes(query) ||
        o.phoneNumber?.includes(query) ||
        o.address?.toLowerCase().includes(query)
      );
    }
    
    setFilteredOrders(filtered);
  }, [orders, activeTab, searchQuery]);

  // Handle order selection
  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setDeliveryForm({
      status: 'Delivered',
      receivedBy: 'self',
      receiverName: order.customerName || '',
      receiverPhone: order.phoneNumber || '',
      notes: ''
    });
  };

  // Handle start delivery
  const handleStartDelivery = async (order) => {
    try {
      await api.updateOrderStatus(order._id, 'Out for Delivery');
      fetchOrders();
      if (selectedOrder?._id === order._id) {
        setSelectedOrder({ ...order, status: 'Out for Delivery' });
      }
    } catch (error) {
      alert('Failed to update status');
    }
  };

  // Handle delivery completion
  const handleDeliveryComplete = async () => {
    if (!selectedOrder) return;
    
    if (deliveryForm.receivedBy === 'other' && !deliveryForm.receiverName) {
      alert('Please enter receiver name');
      return;
    }

    try {
      // Update order status to Delivered
      await api.updateOrderStatus(selectedOrder._id, 'Delivered');
      
      // Update order with delivery details
      await api.updateOrder(selectedOrder._id, {
        deliveryNotes: deliveryForm.notes,
        deliveredTo: deliveryForm.receivedBy === 'self' ? selectedOrder.customerName : deliveryForm.receiverName,
        deliveredAt: new Date()
      });

      alert('Order marked as delivered!');
      setShowDeliveryForm(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      alert('Failed to complete delivery');
    }
  };

  // Handle call customer
  const handleCallCustomer = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  // Handle navigate to address
  const handleNavigate = (address) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'Ready for Pickup': '#F59E0B',    // Orange - collect from customer
      'Ready for Delivery': '#8B5CF6',  // Purple - in rack, ready to deliver
      'Out for Delivery': '#3B82F6',    // Blue - on the way
      'Delivered': '#10B981'            // Green - done
    };
    return colors[status] || '#6B7280';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const icons = {
      'Ready for Pickup': '🏠',
      'Ready for Delivery': '🗄️',
      'Out for Delivery': '🚴',
      'Delivered': '✅'
    };
    return icons[status] || '📦';
  };

  // Get job type label
  const getJobTypeLabel = (status) => {
    if (status === 'Ready for Pickup') return 'PICKUP';
    if (status === 'Ready for Delivery') return 'DELIVERY';
    if (status === 'Out for Delivery') return 'IN TRANSIT';
    if (status === 'Delivered') return 'COMPLETED';
    return status;
  };

  // Get payment badge
  const getPaymentBadge = (order) => {
    if (order.paymentStatus === 'Paid') {
      return <span className="payment-badge prepaid">Prepaid</span>;
    }
    return <span className="payment-badge cod">COD</span>;
  };

  return (
    <div className="delivery-dashboard">
      {/* Header */}
      <div className="delivery-header">
        <div className="delivery-header-top">
          <h1>🚴 Delivery Dashboard</h1>
          <button className="btn-refresh" onClick={fetchOrders}>🔄</button>
        </div>
        
        {/* Stats Cards */}
        <div className="delivery-stats">
          <div className="stat-card pickup">
            <span className="stat-icon">🏠</span>
            <div className="stat-info">
              <span className="stat-value">{stats.pickup}</span>
              <span className="stat-label">Pickup</span>
            </div>
          </div>
          <div className="stat-card rack">
            <span className="stat-icon">🗄️</span>
            <div className="stat-info">
              <span className="stat-value">{stats.readyDelivery}</span>
              <span className="stat-label">In Rack</span>
            </div>
          </div>
          <div className="stat-card out">
            <span className="stat-icon">🚴</span>
            <div className="stat-info">
              <span className="stat-value">{stats.outForDelivery}</span>
              <span className="stat-label">Out</span>
            </div>
          </div>
          <div className="stat-card delivered">
            <span className="stat-icon">✅</span>
            <div className="stat-info">
              <span className="stat-value">{stats.delivered}</span>
              <span className="stat-label">Done</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="delivery-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, ticket, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="btn-clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        {/* Tabs */}
        <div className="delivery-tabs">
          <button 
            className={`tab ${activeTab === 'pickup' ? 'active' : ''}`}
            onClick={() => setActiveTab('pickup')}
          >
            🏠 Pickup ({stats.pickup})
          </button>
          <button 
            className={`tab ${activeTab === 'delivery' ? 'active' : ''}`}
            onClick={() => setActiveTab('delivery')}
          >
            🗄️ Rack ({stats.readyDelivery})
          </button>
          <button 
            className={`tab ${activeTab === 'out' ? 'active' : ''}`}
            onClick={() => setActiveTab('out')}
          >
            🚴 Out ({stats.outForDelivery})
          </button>
          <button 
            className={`tab ${activeTab === 'delivered' ? 'active' : ''}`}
            onClick={() => setActiveTab('delivered')}
          >
            ✅ Done ({stats.delivered})
          </button>
        </div>
      </div>

      {/* Order List */}
      <div className="delivery-list">
        {loading ? (
          <div className="delivery-loading">
            <div className="spinner"></div>
            <p>Loading deliveries...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="delivery-empty">
            <span className="empty-icon">📭</span>
            <p>No deliveries found</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div 
              key={order._id} 
              className={`delivery-card ${selectedOrder?._id === order._id ? 'selected' : ''}`}
              onClick={() => handleOrderSelect(order)}
            >
              <div className="card-header">
                <div className="customer-info">
                  <div className="customer-avatar" style={{ backgroundColor: getStatusColor(order.status) }}>
                    {getStatusIcon(order.status)}
                  </div>
                  <div className="customer-details">
                    <span className="job-type-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                      {getJobTypeLabel(order.status)}
                    </span>
                    <h3>{order.customerName}</h3>
                    <p className="address">{order.address || 'No address'}</p>
                  </div>
                </div>
                {getPaymentBadge(order)}
              </div>
              
              <div className="card-body">
                <div className="info-row">
                  <span className="label">Ticket #:</span>
                  <span className="value">{order.ticketNumber}</span>
                </div>
                <div className="info-row">
                  <span className="label">Items:</span>
                  <span className="value">{order.items?.length || 0} items</span>
                </div>
                <div className="info-row">
                  <span className="label">Amount:</span>
                  <span className="value amount">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="info-row">
                  <span className="label">Status:</span>
                  <span className="status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="card-actions">
                <button 
                  className="btn-action location"
                  onClick={(e) => { e.stopPropagation(); handleNavigate(order.address); }}
                  title="Navigate"
                >
                  📍
                </button>
                <button 
                  className="btn-action call"
                  onClick={(e) => { e.stopPropagation(); handleCallCustomer(order.phoneNumber); }}
                  title="Call"
                >
                  📞
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && !showDeliveryForm && (
        <div className="delivery-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="delivery-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-info">
                <div className="customer-avatar large" style={{ backgroundColor: getStatusColor(selectedOrder.status) }}>
                  D
                </div>
                <div>
                  <h2>{selectedOrder.customerName}</h2>
                  <p>{selectedOrder.address}</p>
                </div>
              </div>
              {getPaymentBadge(selectedOrder)}
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-row">
                  <span className="label">Ticket Number</span>
                  <span className="value">{selectedOrder.ticketNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Phone</span>
                  <span className="value">{selectedOrder.phoneNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Amount</span>
                  <span className="value amount">₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Payment Status</span>
                  <span className="value">{selectedOrder.paymentStatus || 'Pending'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Payment Method</span>
                  <span className="value">{selectedOrder.paymentMethod || 'Cash'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Items</span>
                  <span className="value">{selectedOrder.items?.length || 0} items</span>
                </div>
              </div>

              {/* Items List */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="items-section">
                  <h4>📦 Order Items</h4>
                  <div className="items-list">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="item-row">
                        <span>{item.name}</span>
                        <span>x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="quick-actions">
                <button 
                  className="btn-quick call"
                  onClick={() => handleCallCustomer(selectedOrder.phoneNumber)}
                >
                  📞 Call Customer
                </button>
                <button 
                  className="btn-quick navigate"
                  onClick={() => handleNavigate(selectedOrder.address)}
                >
                  📍 Navigate
                </button>
              </div>
            </div>

            <div className="modal-footer">
              {selectedOrder.status === 'Ready for Pickup' && (
                <button 
                  className="btn-primary start"
                  onClick={() => handleStartDelivery(selectedOrder)}
                >
                  🚴 Start Delivery
                </button>
              )}
              {selectedOrder.status === 'Out for Delivery' && (
                <button 
                  className="btn-primary deliver"
                  onClick={() => setShowDeliveryForm(true)}
                >
                  ✅ Mark Delivered
                </button>
              )}
              <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Confirmation Form */}
      {showDeliveryForm && selectedOrder && (
        <div className="delivery-modal-overlay">
          <div className="delivery-modal confirmation">
            <div className="modal-header confirm">
              <h2>📦 Delivery Confirmation</h2>
              <button className="btn-close" onClick={() => setShowDeliveryForm(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="customer-summary">
                <h3>{selectedOrder.customerName}</h3>
                <p>Ticket: {selectedOrder.ticketNumber}</p>
                <p className="amount">Amount: ₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</p>
              </div>

              <div className="form-section">
                <div className="form-group">
                  <label>Shipment Status</label>
                  <select 
                    value={deliveryForm.status}
                    onChange={(e) => setDeliveryForm({...deliveryForm, status: e.target.value})}
                  >
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Received By</label>
                  <div className="radio-group">
                    <label className={`radio-option ${deliveryForm.receivedBy === 'self' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="receivedBy"
                        value="self"
                        checked={deliveryForm.receivedBy === 'self'}
                        onChange={(e) => setDeliveryForm({...deliveryForm, receivedBy: e.target.value})}
                      />
                      <span className="radio-label">Self</span>
                    </label>
                    <label className={`radio-option ${deliveryForm.receivedBy === 'other' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="receivedBy"
                        value="other"
                        checked={deliveryForm.receivedBy === 'other'}
                        onChange={(e) => setDeliveryForm({...deliveryForm, receivedBy: e.target.value})}
                      />
                      <span className="radio-label">Other</span>
                    </label>
                  </div>
                </div>

                {deliveryForm.receivedBy === 'other' && (
                  <>
                    <div className="form-group">
                      <label>Receiver Name *</label>
                      <input
                        type="text"
                        placeholder="Enter receiver name"
                        value={deliveryForm.receiverName}
                        onChange={(e) => setDeliveryForm({...deliveryForm, receiverName: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Receiver Phone</label>
                      <input
                        type="tel"
                        placeholder="Enter phone number"
                        value={deliveryForm.receiverPhone}
                        onChange={(e) => setDeliveryForm({...deliveryForm, receiverPhone: e.target.value})}
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Delivery Notes (Optional)</label>
                  <textarea
                    placeholder="Any notes about the delivery..."
                    value={deliveryForm.notes}
                    onChange={(e) => setDeliveryForm({...deliveryForm, notes: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeliveryForm(false)}>
                Cancel
              </button>
              <button className="btn-submit" onClick={handleDeliveryComplete}>
                ✅ Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;

