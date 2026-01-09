import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import QRScanner from './QRScanner';
import './DeliveryDashboard.css';

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState('pickup'); // pickup or drop
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedOrder, setScannedOrder] = useState(null);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [verifiedItems, setVerifiedItems] = useState({});
  const [showDeliveryVerification, setShowDeliveryVerification] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    receivedBy: 'self',
    receiverName: '',
    receiverPhone: '',
    notes: ''
  });
  const [stats, setStats] = useState({
    // Pickup stats
    toPickup: 0,      // Ready for Pickup - new orders, go collect from customer
    pickupInProgress: 0, // Out for pickup
    pickedUp: 0,      // Picked up, brought to store
    // Drop stats
    toDrop: 0,        // Ready for Delivery - clean clothes ready to deliver
    dropInProgress: 0, // Out for Delivery
    delivered: 0      // Delivered successfully
  });

  // Handle scroll for sticky header shrink effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch delivery orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getOrders({
        limit: 200
      });
      
      if (response.success) {
        setOrders(response.data);
        
        // Calculate stats for delivery boy view
        const toPickup = response.data.filter(o => o.status === 'Ready for Pickup').length;
        const pickupInProgress = response.data.filter(o => o.status === 'Pickup In Progress').length;
        const pickedUp = response.data.filter(o => o.status === 'Processing' || o.status === 'Washing').length;
        const toDrop = response.data.filter(o => o.status === 'Ready for Delivery').length;
        const dropInProgress = response.data.filter(o => o.status === 'Out for Delivery').length;
        const delivered = response.data.filter(o => o.status === 'Delivered').length;
        
        setStats({ toPickup, pickupInProgress, pickedUp, toDrop, dropInProgress, delivered });
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

  // Filter orders based on mode
  useEffect(() => {
    let filtered = [...orders];
    
    if (activeMode === 'pickup') {
      // PICKUP MODE - Collecting clothes from customers (show pending + in progress)
      filtered = filtered.filter(o => 
        o.status === 'Ready for Pickup' || o.status === 'Pickup In Progress'
      );
    } else {
      // DROP MODE - Delivering clean clothes to customers (show ready + out for delivery)
      filtered = filtered.filter(o => 
        o.status === 'Ready for Delivery' || o.status === 'Out for Delivery'
      );
    }
    
    setFilteredOrders(filtered);
  }, [orders, activeMode]);

  // Handle mode change
  const handleModeChange = (mode) => {
    setActiveMode(mode);
  };

  // Handle order selection
  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setDeliveryForm({
      receivedBy: 'self',
      receiverName: order.customerName || '',
      receiverPhone: order.phoneNumber || '',
      notes: ''
    });
  };

  // Start pickup - Going to collect clothes from customer
  const handleStartPickup = async (order) => {
    try {
      await api.updateOrderStatus(order._id, 'Pickup In Progress');
      fetchOrders();
      setSelectedOrder(null);
      alert(`✅ Started pickup for ${order.ticketNumber}`);
    } catch (error) {
      alert('Failed to update status');
    }
  };

  // Complete pickup - Clothes collected, brought to store
  const handleCompletePickup = async (order) => {
    try {
      await api.updateOrderStatus(order._id, 'Processing');
      await api.updateOrder(order._id, {
        pickedUpAt: new Date()
      });
      fetchOrders();
      setSelectedOrder(null);
      alert(`✅ Pickup completed for ${order.ticketNumber}`);
    } catch (error) {
      alert('Failed to complete pickup');
    }
  };

  // Start delivery - Going to deliver clean clothes
  const handleStartDelivery = async (order) => {
    try {
      await api.updateOrderStatus(order._id, 'Out for Delivery');
      fetchOrders();
      setSelectedOrder(null);
      alert(`✅ Started delivery for ${order.ticketNumber}`);
    } catch (error) {
      alert('Failed to update status');
    }
  };

  // Complete delivery
  const handleDeliveryComplete = async () => {
    if (!selectedOrder) return;
    
    if (deliveryForm.receivedBy === 'other' && !deliveryForm.receiverName) {
      alert('Please enter receiver name');
      return;
    }

    try {
      await api.updateOrderStatus(selectedOrder._id, 'Delivered');
      await api.updateOrder(selectedOrder._id, {
        deliveryNotes: deliveryForm.notes,
        deliveredTo: deliveryForm.receivedBy === 'self' ? selectedOrder.customerName : deliveryForm.receiverName,
        deliveredAt: new Date()
      });

      alert(`✅ Delivery completed for ${selectedOrder.ticketNumber}`);
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

  // Handle QR scan result
  const handleScanResult = async (scanData) => {
    setShowScanner(false);
    
    try {
      let order = null;
      
      // First try orderId (from URL-based QR codes on garment tags)
      if (scanData.orderId) {
        const response = await api.getOrderById(scanData.orderId);
        if (response.success) {
          order = response.data;
        }
      }
      
      // Then try ticketNumber
      if (!order && scanData.ticketNumber) {
        const response = await api.getOrderByTicketNumber(scanData.ticketNumber);
        if (response.success) {
          order = response.data;
        }
      }
      
      if (order) {
        setScannedOrder(order);
        // If order is "Out for Delivery", show delivery verification with item checklist
        if (order.status === 'Out for Delivery') {
          // Initialize all items as unverified
          const initialVerified = {};
          order.items?.forEach((item, index) => {
            initialVerified[index] = false;
          });
          setVerifiedItems(initialVerified);
          setShowDeliveryVerification(true);
        } else {
          setShowStatusUpdate(true);
        }
      } else {
        alert('Order not found! Please check the QR code or ticket number.');
      }
    } catch (error) {
      console.error('Error finding order:', error);
      alert('Error finding order. Please try again.');
    }
  };

  // Toggle item verification
  const handleToggleItemVerified = (index) => {
    setVerifiedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Check if all items are verified
  const allItemsVerified = () => {
    if (!scannedOrder?.items?.length) return true;
    return scannedOrder.items.every((_, index) => verifiedItems[index]);
  };

  // Handle delivery confirmation after verification
  const handleVerifiedDelivery = async () => {
    if (!scannedOrder || !allItemsVerified()) return;
    
    setStatusUpdateLoading(true);
    try {
      await api.updateOrderStatus(scannedOrder._id, 'Delivered');
      await api.updateOrder(scannedOrder._id, { 
        deliveredAt: new Date(),
        verifiedItems: scannedOrder.items?.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          verified: true
        }))
      });
      
      alert(`✅ Delivery verified and completed for ${scannedOrder.ticketNumber}`);
      setShowDeliveryVerification(false);
      setScannedOrder(null);
      setVerifiedItems({});
      fetchOrders();
    } catch (error) {
      console.error('Error completing delivery:', error);
      alert('Failed to complete delivery. Please try again.');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Handle status update from scan
  const handleStatusUpdate = async (newStatus) => {
    if (!scannedOrder) return;
    
    setStatusUpdateLoading(true);
    try {
      await api.updateOrderStatus(scannedOrder._id, newStatus);
      
      if (newStatus === 'Delivered') {
        await api.updateOrder(scannedOrder._id, { deliveredAt: new Date() });
      } else if (newStatus === 'Processing') {
        await api.updateOrder(scannedOrder._id, { pickedUpAt: new Date() });
      }
      
      alert(`✅ Order ${scannedOrder.ticketNumber} updated to "${newStatus}"`);
      setShowStatusUpdate(false);
      setScannedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Get next status options based on current status
  const getNextStatusOptions = (currentStatus) => {
    const statusFlow = {
      'Ready for Pickup': ['Pickup In Progress'],
      'Pickup In Progress': ['Processing'],
      'Ready for Delivery': ['Out for Delivery'],
      'Out for Delivery': ['Delivered'],
      'Delivered': []
    };
    return statusFlow[currentStatus] || [];
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'Ready for Pickup': '#F59E0B',
      'Pickup In Progress': '#EF4444',
      'Processing': '#8B5CF6',
      'Washing': '#8B5CF6',
      'Ready for Delivery': '#3B82F6',
      'Out for Delivery': '#0EA5E9',
      'Delivered': '#10B981'
    };
    return colors[status] || '#6B7280';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const icons = {
      'Ready for Pickup': '📦',
      'Pickup In Progress': '🏃',
      'Processing': '🧺',
      'Washing': '🧺',
      'Ready for Delivery': '🎁',
      'Out for Delivery': '🚚',
      'Delivered': '✅'
    };
    return icons[status] || '📦';
  };

  // Get action label based on status
  const getActionLabel = (status) => {
    if (status === 'Ready for Pickup') return 'START PICKUP';
    if (status === 'Pickup In Progress') return 'COMPLETE PICKUP';
    if (status === 'Ready for Delivery') return 'START DELIVERY';
    if (status === 'Out for Delivery') return 'MARK DELIVERED';
    return status;
  };

  // Get payment badge
  const getPaymentBadge = (order) => {
    if (order.paymentStatus === 'Paid') {
      return <span className="payment-badge prepaid">PAID</span>;
    }
    return <span className="payment-badge cod">COD ₹{order.totalAmount?.toLocaleString('en-IN')}</span>;
  };

  return (
    <div className="delivery-dashboard">
      {/* Header */}
      <div className={`delivery-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="delivery-header-top">
          <h1>🚴 Delivery Boy</h1>
          <div className="header-actions">
            <button className="btn-scan" onClick={() => setShowScanner(true)}>📷</button>
            <button className="btn-refresh" onClick={fetchOrders}>🔄</button>
          </div>
        </div>
        
        {/* Main Mode Toggle - PICKUP vs DROP */}
        <div className="mode-toggle">
          <button 
            className={`mode-btn pickup ${activeMode === 'pickup' ? 'active' : ''}`}
            onClick={() => handleModeChange('pickup')}
          >
            <span className="mode-icon">📥</span>
            <span className="mode-text">TO PICK</span>
            <span className="mode-count">{stats.toPickup + stats.pickupInProgress}</span>
          </button>
          <button 
            className={`mode-btn drop ${activeMode === 'drop' ? 'active' : ''}`}
            onClick={() => handleModeChange('drop')}
          >
            <span className="mode-icon">📤</span>
            <span className="mode-text">TO DROP</span>
            <span className="mode-count">{stats.toDrop + stats.dropInProgress}</span>
          </button>
        </div>

      </div>

      {/* Mode Info Banner */}
      <div className={`mode-banner ${activeMode}`}>
        <span className="banner-icon">{activeMode === 'pickup' ? '📥' : '📤'}</span>
        <span className="banner-text">
          {activeMode === 'pickup' 
            ? 'Collect dirty clothes from customers' 
            : 'Deliver clean clothes to customers'}
        </span>
      </div>

      {/* Order List */}
      <div className="delivery-list">
        {loading ? (
          <div className="delivery-loading">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="delivery-empty">
            <span className="empty-icon">{activeMode === 'pickup' ? '📭' : '📦'}</span>
            <p>No {activeMode === 'pickup' ? 'pickups' : 'deliveries'} available</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div 
              key={order._id} 
              className={`delivery-card ${activeMode}`}
              onClick={() => handleOrderSelect(order)}
            >
              <div className="card-top">
                <div className="ticket-info">
                  <span className="ticket-number">{order.ticketNumber}</span>
                  {getPaymentBadge(order)}
                </div>
                <span className="order-time">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>

              <div className="card-main">
                <div className="customer-row">
                  <span className="customer-name">{order.customerName}</span>
                  <span className="items-count">{order.items?.length || 0} items</span>
                </div>
                <p className="customer-address">📍 {order.address || 'No address provided'}</p>
              </div>

              <div className="card-bottom">
                <div className="quick-buttons">
                  <button 
                    className="btn-quick-action call"
                    onClick={(e) => { e.stopPropagation(); handleCallCustomer(order.phoneNumber); }}
                  >
                    📞
                  </button>
                  <button 
                    className="btn-quick-action map"
                    onClick={(e) => { e.stopPropagation(); handleNavigate(order.address); }}
                  >
                    🗺️
                  </button>
                </div>
                
                <button 
                  className={`btn-main-action ${activeMode}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeMode === 'pickup') {
                      if (order.status === 'Ready for Pickup') {
                        handleStartPickup(order);
                      } else {
                        handleCompletePickup(order);
                      }
                    } else {
                      if (order.status === 'Ready for Delivery') {
                        handleStartDelivery(order);
                      } else {
                        handleOrderSelect(order);
                        setShowDeliveryForm(true);
                      }
                    }
                  }}
                >
                  {getActionLabel(order.status)}
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
            <div className="modal-header" style={{ background: activeMode === 'pickup' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}>
              <div className="modal-title">
                <span className="modal-icon">{activeMode === 'pickup' ? '📥' : '📤'}</span>
                <div>
                  <h2>{selectedOrder.ticketNumber}</h2>
                  <p>{activeMode === 'pickup' ? 'Pickup Order' : 'Delivery Order'}</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="order-summary-card">
                <h3>{selectedOrder.customerName}</h3>
                <p className="phone">📱 {selectedOrder.phoneNumber}</p>
                <p className="address">📍 {selectedOrder.address || 'No address'}</p>
                <div className="summary-row">
                  <span>Items: {selectedOrder.items?.length || 0}</span>
                  <span className="amount">₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="status-row">
                  <span className="status-badge" style={{ backgroundColor: getStatusColor(selectedOrder.status) }}>
                    {getStatusIcon(selectedOrder.status)} {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Items List */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="items-section">
                  <h4>📦 Items ({selectedOrder.items.length})</h4>
                  <div className="items-list">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="item-row">
                        <span>{item.name}</span>
                        <span>×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="action-buttons">
                <button className="btn-action-large call" onClick={() => handleCallCustomer(selectedOrder.phoneNumber)}>
                  📞 Call Customer
                </button>
                <button className="btn-action-large map" onClick={() => handleNavigate(selectedOrder.address)}>
                  🗺️ Navigate
                </button>
              </div>
            </div>

            <div className="modal-footer">
              {activeMode === 'pickup' && selectedOrder.status === 'Ready for Pickup' && (
                <button className="btn-primary pickup" onClick={() => handleStartPickup(selectedOrder)}>
                  🏃 Start Pickup
                </button>
              )}
              {activeMode === 'pickup' && selectedOrder.status === 'Pickup In Progress' && (
                <button className="btn-primary pickup" onClick={() => handleCompletePickup(selectedOrder)}>
                  ✅ Complete Pickup
                </button>
              )}
              {activeMode === 'drop' && selectedOrder.status === 'Ready for Delivery' && (
                <button className="btn-primary drop" onClick={() => handleStartDelivery(selectedOrder)}>
                  🚚 Start Delivery
                </button>
              )}
              {activeMode === 'drop' && selectedOrder.status === 'Out for Delivery' && (
                <button className="btn-primary drop" onClick={() => setShowDeliveryForm(true)}>
                  ✅ Mark Delivered
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Confirmation Form */}
      {showDeliveryForm && selectedOrder && (
        <div className="delivery-modal-overlay">
          <div className="delivery-modal confirmation">
            <div className="modal-header confirm">
              <h2>✅ Confirm Delivery</h2>
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
                      <span className="radio-label">Customer</span>
                    </label>
                    <label className={`radio-option ${deliveryForm.receivedBy === 'other' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="receivedBy"
                        value="other"
                        checked={deliveryForm.receivedBy === 'other'}
                        onChange={(e) => setDeliveryForm({...deliveryForm, receivedBy: e.target.value})}
                      />
                      <span className="radio-label">Other Person</span>
                    </label>
                  </div>
                </div>

                {deliveryForm.receivedBy === 'other' && (
                  <>
                    <div className="form-group">
                      <label>Receiver Name *</label>
                      <input
                        type="text"
                        placeholder="Enter name"
                        value={deliveryForm.receiverName}
                        onChange={(e) => setDeliveryForm({...deliveryForm, receiverName: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Receiver Phone</label>
                      <input
                        type="tel"
                        placeholder="Enter phone"
                        value={deliveryForm.receiverPhone}
                        onChange={(e) => setDeliveryForm({...deliveryForm, receiverPhone: e.target.value})}
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    placeholder="Any delivery notes..."
                    value={deliveryForm.notes}
                    onChange={(e) => setDeliveryForm({...deliveryForm, notes: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeliveryForm(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleDeliveryComplete}>✅ Confirm Delivery</button>
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

      {/* Status Update Modal */}
      {showStatusUpdate && scannedOrder && (
        <div className="delivery-modal-overlay" onClick={() => { setShowStatusUpdate(false); setScannedOrder(null); }}>
          <div className="delivery-modal status-update" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Quick Update</h2>
              <button className="btn-close" onClick={() => { setShowStatusUpdate(false); setScannedOrder(null); }}>✕</button>
            </div>

            <div className="modal-body">
              <div className="scanned-order-info">
                <div className="order-ticket">
                  <span className="ticket-icon">{getStatusIcon(scannedOrder.status)}</span>
                  <span className="ticket-number">{scannedOrder.ticketNumber}</span>
                </div>
                <h3>{scannedOrder.customerName}</h3>
                <div className="current-status">
                  <span className="status-badge" style={{ backgroundColor: getStatusColor(scannedOrder.status) }}>
                    {scannedOrder.status}
                  </span>
                </div>
              </div>

              <div className="status-options">
                <h4>Next Action:</h4>
                {getNextStatusOptions(scannedOrder.status).length > 0 ? (
                  <div className="status-buttons">
                    {getNextStatusOptions(scannedOrder.status).map((status) => (
                      <button
                        key={status}
                        className="btn-status-update"
                        onClick={() => handleStatusUpdate(status)}
                        disabled={statusUpdateLoading}
                        style={{ backgroundColor: getStatusColor(status) }}
                      >
                        {getStatusIcon(status)} {status}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="no-status-options">
                    <span>✅</span>
                    <p>Order completed!</p>
                  </div>
                )}
              </div>

              {statusUpdateLoading && (
                <div className="update-loading">
                  <div className="spinner"></div>
                  <p>Updating...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Verification Modal - Item by Item Check */}
      {showDeliveryVerification && scannedOrder && (
        <div className="delivery-modal-overlay" onClick={() => { setShowDeliveryVerification(false); setScannedOrder(null); setVerifiedItems({}); }}>
          <div className="delivery-modal verification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header verification-header">
              <h2>📦 Verify Delivery</h2>
              <button className="btn-close" onClick={() => { setShowDeliveryVerification(false); setScannedOrder(null); setVerifiedItems({}); }}>✕</button>
            </div>

            <div className="modal-body">
              {/* Order Info */}
              <div className="verification-order-info">
                <div className="verification-ticket">
                  <span className="ticket-label">Ticket #</span>
                  <span className="ticket-value">{scannedOrder.ticketNumber}</span>
                </div>
                <div className="verification-customer">
                  <h3>👤 {scannedOrder.customerName}</h3>
                  <p className="customer-phone">📞 {scannedOrder.phoneNumber}</p>
                  {scannedOrder.address && (
                    <p className="customer-address">📍 {scannedOrder.address}</p>
                  )}
                </div>
                <div className="verification-amount">
                  <span className="amount-label">Total Amount</span>
                  <span className="amount-value">₹{scannedOrder.totalAmount?.toLocaleString('en-IN')}</span>
                  <span className={`payment-status ${scannedOrder.paymentStatus?.toLowerCase()}`}>
                    {scannedOrder.paymentStatus || 'Pending'}
                  </span>
                </div>
              </div>

              {/* Items Checklist */}
              <div className="verification-items">
                <div className="items-header">
                  <h4>🧺 Items to Deliver</h4>
                  <span className="items-progress">
                    {Object.values(verifiedItems).filter(Boolean).length} / {scannedOrder.items?.length || 0} verified
                  </span>
                </div>
                
                <div className="items-list">
                  {scannedOrder.items?.map((item, index) => (
                    <div 
                      key={index} 
                      className={`verification-item ${verifiedItems[index] ? 'verified' : ''}`}
                      onClick={() => handleToggleItemVerified(index)}
                    >
                      <div className="item-checkbox">
                        {verifiedItems[index] ? (
                          <span className="checkbox-checked">✓</span>
                        ) : (
                          <span className="checkbox-unchecked"></span>
                        )}
                      </div>
                      <div className="item-details">
                        <span className="item-description">{item.description}</span>
                        <span className="item-quantity">Qty: {item.quantity}</span>
                      </div>
                      <div className="item-price">
                        ₹{item.price?.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>

                {(!scannedOrder.items || scannedOrder.items.length === 0) && (
                  <div className="no-items">
                    <p>No items in this order</p>
                  </div>
                )}
              </div>

              {/* Verification Status */}
              <div className="verification-status">
                {allItemsVerified() ? (
                  <div className="all-verified">
                    <span className="verified-icon">✅</span>
                    <span>All items verified! Ready to confirm delivery.</span>
                  </div>
                ) : (
                  <div className="pending-verification">
                    <span className="pending-icon">⏳</span>
                    <span>Tap each item to verify before confirming delivery</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer verification-footer">
              <button 
                className="btn-cancel" 
                onClick={() => { setShowDeliveryVerification(false); setScannedOrder(null); setVerifiedItems({}); }}
              >
                Cancel
              </button>
              <button 
                className={`btn-confirm-delivery ${allItemsVerified() ? 'enabled' : 'disabled'}`}
                onClick={handleVerifiedDelivery}
                disabled={!allItemsVerified() || statusUpdateLoading}
              >
                {statusUpdateLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Confirming...
                  </>
                ) : (
                  <>✅ Confirm Delivery</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
