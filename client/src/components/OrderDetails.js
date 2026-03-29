import React, { memo, useState, useEffect } from 'react';
import './OrderDetails.css';
import { format } from 'date-fns';
import { usePermissions } from '../context/PermissionsContext';
import { PERMISSIONS } from '../config/permissions';
import api from '../services/api';
import OrderQRCode from './OrderQRCode';
import GarmentTagPrint from './GarmentTagPrint';
import { generateTagNumber } from './GarmentTag';

const OrderDetails = memo(({ order, onClose, onStatusUpdate, onDelete }) => {
  const { can, hasAnyPermission } = usePermissions();
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [isUpdatingRack, setIsUpdatingRack] = useState(false);
  const [selectedRack, setSelectedRack] = useState(order?.rackNumber || '');
  const [showGarmentTagModal, setShowGarmentTagModal] = useState(false);
  const [selectedPaperSize, setSelectedPaperSize] = useState('A4'); // A4, 80mm, 58mm
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [editDeliveryValue, setEditDeliveryValue] = useState('');
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);

  // Debug: Log order status to help troubleshoot
  useEffect(() => {
    if (order) {
      console.log('📦 Order Details - Status:', order.status);
      console.log('📦 Order Details - Rack Number:', order.rackNumber);
      console.log('📦 Should show rack section:', 
        ['Ready for Pickup', 'Out for Delivery', 'Packing', 'Quality Check'].includes(order.status)
      );
    }
  }, [order]);
  
  const formatDate = (date) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      'Booking Confirmed': 'status-received',
      'Sorting': 'status-sorting',
      'Spotting': 'status-spotting',
      'Washing': 'status-washing',
      'Dry Cleaning': 'status-drycleaning',
      'Drying': 'status-drying',
      'Ironing': 'status-ironing',
      'Quality Check': 'status-quality',
      'Packing': 'status-packing',
      'Ready for Pickup': 'status-ready',
      'Out for Delivery': 'status-delivery',
      'Delivered': 'status-delivered',
      'Return': 'status-return',
      'Refund': 'status-refund',
      'Cancelled': 'status-cancelled'
    };
    return statusClasses[status] || '';
  };

  const handleDownloadReceipt = async () => {
    try {
      setIsGeneratingReceipt(true);
      const blob = await api.generateReceipt(order._id, selectedPaperSize);
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `Receipt-${order.ticketNumber}-${selectedPaperSize}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Failed to generate receipt. Please try again.');
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const handlePrintReceipt = async () => {
    try {
      setIsGeneratingReceipt(true);
      const blob = await api.generateReceipt(order._id, selectedPaperSize);
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      // Cleanup after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Failed to generate receipt. Please try again.');
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const handleSendNotification = async (event) => {
    try {
      setIsSendingNotification(true);
      const result = await api.sendOrderNotification(order._id, event, 'both');
      if (result.success) {
        alert('Notification sent successfully!');
      } else {
        alert('Failed to send notification: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSendingNotification(false);
    }
  };

  const handleSendPaymentReminder = async () => {
    try {
      setIsSendingNotification(true);
      const result = await api.sendPaymentReminder(order._id, 'both');
      if (result.success) {
        alert('Payment reminder sent successfully!');
      } else {
        alert('Failed to send payment reminder: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      alert('Failed to send payment reminder: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSendingNotification(false);
    }
  };

  const handleEditDelivery = () => {
    // Pre-fill with existing value in datetime-local format
    if (order.expectedDelivery) {
      const d = new Date(order.expectedDelivery);
      const pad = (n) => String(n).padStart(2, '0');
      setEditDeliveryValue(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else {
      setEditDeliveryValue('');
    }
    setIsEditingDelivery(true);
  };

  const handleSaveDelivery = async () => {
    try {
      setIsSavingDelivery(true);
      const newValue = editDeliveryValue ? new Date(editDeliveryValue).toISOString() : null;
      const result = await api.updateOrder(order._id, { expectedDelivery: newValue });
      if (result.success) {
        order.expectedDelivery = newValue;
        setIsEditingDelivery(false);
      } else {
        alert('Failed to update expected delivery: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating expected delivery:', error);
      alert('Failed to update expected delivery.');
    } finally {
      setIsSavingDelivery(false);
    }
  };

  const handleRackUpdate = async (rackNumber) => {
    try {
      setIsUpdatingRack(true);
      const result = await api.updateOrder(order._id, { rackNumber });
      if (result.success && result.data) {
        setSelectedRack(rackNumber);
        // Update the order prop by calling onStatusUpdate to refresh
        if (onStatusUpdate) {
          // Trigger a refresh by updating status to same status
          await onStatusUpdate(order._id, order.status);
        }
        alert(`Order assigned to ${rackNumber || 'No Rack'} successfully!`);
      } else {
        alert('Failed to update rack: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating rack:', error);
      alert('Failed to update rack: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsUpdatingRack(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Order Details</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h3>📋 Order Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Ticket Number:</span>
                <span className="detail-value ticket">{order.ticketNumber}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Order Number:</span>
                <span className="detail-value">{order.orderNumber}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className={`status-badge ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>👤 Customer Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{order.customerName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{order.phoneNumber}</span>
              </div>
              {order.location && (
                <div className="detail-item full-width">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{order.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3>🧺 Items</h3>
            <div className="items-list">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <span className="item-qty">{item.quantity}x</span>
                    <span className="item-desc">{item.description}</span>
                    <span className="item-price">₹{(item.price || 0).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="no-items-message" style={{ padding: '1rem', color: '#999', textAlign: 'center' }}>
                  No items in this order
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3>💳 Payment Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Total Amount:</span>
                <span className="detail-value amount">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment Method:</span>
                <span className="detail-value">{order.paymentMethod}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment Status:</span>
                <span className={`payment-badge ${order.paymentStatus.toLowerCase()}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>📅 Timeline</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Order Date:</span>
                <span className="detail-value">{formatDate(order.orderDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Expected Delivery:</span>
                {isEditingDelivery ? (
                  <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="datetime-local"
                      value={editDeliveryValue}
                      onChange={(e) => setEditDeliveryValue(e.target.value)}
                      style={{ fontSize: '0.85rem', padding: '2px 4px' }}
                    />
                    <button
                      className="btn btn-sm btn-success"
                      onClick={handleSaveDelivery}
                      disabled={isSavingDelivery}
                      style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                    >
                      {isSavingDelivery ? '...' : '✓'}
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setIsEditingDelivery(false)}
                      style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                    >
                      ✕
                    </button>
                  </span>
                ) : (
                  <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {order.expectedDelivery ? formatDate(order.expectedDelivery) : 'Will be shared via WhatsApp'}
                    <button
                      onClick={handleEditDelivery}
                      title="Edit expected delivery"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '0' }}
                    >
                      ✏️
                    </button>
                  </span>
                )}
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">{formatDate(order.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Rack Management Section - Show for Ready for Pickup or Out for Delivery orders */}
          {/* Temporarily showing for all orders for testing - will restrict later */}
          {order && (
            <div className="detail-section">
              <h3>📦 Rack Assignment</h3>
              <div className="detail-grid">
                <div className="detail-item full-width">
                  <span className="detail-label">Current Rack:</span>
                  <span className="detail-value">
                    {order.rackNumber ? (
                      <span style={{ color: '#2196F3', fontWeight: '600' }}>{order.rackNumber}</span>
                    ) : (
                      <span style={{ color: '#999' }}>Not Assigned</span>
                    )}
                  </span>
                </div>
                <div className="detail-item full-width">
                  <span className="detail-label">Assign to Rack:</span>
                  <div className="rack-selection">
                    {['', 'Rack 1', 'Rack 2', 'Rack 3', 'Rack 4', 'Rack 5', 'Rack 6', 'Rack 7', 'Rack 8'].map((rack) => {
                      const isCurrent = order.rackNumber === rack;
                      const isSelected = selectedRack === rack;
                      return (
                        <button
                          key={rack}
                          className={`rack-button ${isSelected ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
                          onClick={() => handleRackUpdate(rack)}
                          disabled={isUpdatingRack}
                          title={rack || 'Remove from Rack'}
                        >
                          {rack || 'No Rack'}
                        </button>
                      );
                    })}
                  </div>
                  {isUpdatingRack && <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>Updating...</p>}
                </div>
              </div>
            </div>
          )}

          {order.notes && (
            <div className="detail-section">
              <h3>📝 Notes</h3>
              <p className="notes-text">{order.notes}</p>
            </div>
          )}

          {/* QR Code & Barcode Section */}
          <div className="detail-section qr-section">
            <h3>📱 QR Code & Barcode</h3>
            <div className="qr-barcode-container">
              <OrderQRCode order={order} size="medium" />
              <div className="qr-actions">
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Print Tag - ${order.ticketNumber}</title>
                            <style>
                              body { font-family: Arial; text-align: center; padding: 20px; }
                              .tag { border: 2px solid #000; padding: 15px; display: inline-block; }
                              img { margin-bottom: 10px; }
                              .ticket { font-family: monospace; font-size: 14pt; font-weight: bold; }
                            </style>
                          </head>
                          <body>
                            <div class="tag">
                              <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(JSON.stringify({ticketNumber: order.ticketNumber, orderId: order._id}))}" />
                              <div class="ticket">${order.ticketNumber}</div>
                            </div>
                            <script>window.onload = function() { window.print(); }</script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }}
                >
                  🏷️ Print QR Tag
                </button>
              </div>
            </div>
          </div>

          {/* Garment Tag Section */}
          <div className="detail-section garment-tag-section">
            <h3>🏷️ Garment Tag</h3>
            <div className="garment-tag-info">
              <div className="tag-number-display">
                <span className="tag-label">Tag Number:</span>
                <span className="tag-value">{generateTagNumber(order.ticketNumber)}</span>
              </div>
              <p className="tag-description">
                Print physical tags to attach to garments. Each tag has a unique QR code and barcode 
                that can be scanned to quickly identify and update order status.
              </p>
              <button 
                className="btn-print-garment-tag"
                onClick={() => setShowGarmentTagModal(true)}
              >
                🏷️ Print Garment Tags
              </button>
            </div>
          </div>
        </div>

        {/* Garment Tag Print Modal */}
        {showGarmentTagModal && (
          <GarmentTagPrint 
            order={order} 
            onClose={() => setShowGarmentTagModal(false)} 
          />
        )}

        <div className="modal-footer">
          {can(PERMISSIONS.ORDER_STATUS_UPDATE) && (
            <div className="status-update">
              <label htmlFor="status-select">Update Status:</label>
              <select
                id="status-select"
                value={order.status}
                onChange={(e) => onStatusUpdate(order._id, e.target.value)}
                className="status-select-large"
              >
              <option value="Booking Confirmed">✅ Booking Confirmed</option>
              <option value="Sorting">📦 Sorting</option>
              <option value="Spotting">🔍 Spotting</option>
              <option value="Washing">🧼 Washing</option>
              <option value="Dry Cleaning">🧴 Dry Cleaning</option>
              <option value="Drying">💨 Drying</option>
              <option value="Ironing">👔 Ironing</option>
              <option value="Quality Check">✔️ Quality Check</option>
              <option value="Packing">📦 Packing</option>
              <option value="Ready for Pickup">✅ Ready for Pickup</option>
              <option value="Out for Delivery">🚚 Out for Delivery</option>
              <option value="Delivered">✨ Delivered</option>
              <option value="Return">↩️ Return</option>
              <option value="Refund">💸 Refund</option>
              <option value="Cancelled">❌ Cancelled</option>
            </select>
          </div>
          )}
          
          <div className="action-buttons">
            {can(PERMISSIONS.ORDER_VIEW) && (
              <>
                <div className="paper-size-selector">
                  <label htmlFor="paper-size" className="paper-size-label">Paper:</label>
                  <select
                    id="paper-size"
                    value={selectedPaperSize}
                    onChange={(e) => setSelectedPaperSize(e.target.value)}
                    className="paper-size-select"
                    title="Select paper size for receipt"
                  >
                    <option value="A4">A4 (Standard)</option>
                    <option value="80mm">80mm (Thermal)</option>
                    <option value="58mm">58mm (Thermal)</option>
                  </select>
                </div>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={handleDownloadReceipt}
                  disabled={isGeneratingReceipt}
                  title="Download Receipt as PDF"
                >
                  {isGeneratingReceipt ? '⏳ Generating...' : '🧾 Download'}
                </button>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={handlePrintReceipt}
                  disabled={isGeneratingReceipt}
                  title="Print Receipt"
                >
                  🖨️ Print
                </button>
              </>
            )}
            {can(PERMISSIONS.ORDER_VIEW) && order.status !== 'Ready for Pickup' && (
              <button 
                className="btn btn-info btn-sm" 
                onClick={() => handleSendNotification('ready')}
                disabled={isSendingNotification}
                title="Send Ready Notification"
              >
                {isSendingNotification ? '⏳ Sending...' : '📱 Notify Ready'}
              </button>
            )}
            {can(PERMISSIONS.ORDER_VIEW) && order.paymentStatus === 'Pending' && (
              <button 
                className="btn btn-warning btn-sm" 
                onClick={handleSendPaymentReminder}
                disabled={isSendingNotification}
                title="Send Payment Reminder"
              >
                {isSendingNotification ? '⏳ Sending...' : '💰 Payment Reminder'}
              </button>
            )}
            {hasAnyPermission(PERMISSIONS.ORDER_DELETE, PERMISSIONS.ORDER_CANCEL) && (
              <button 
                className="btn btn-danger btn-sm" 
                onClick={() => onDelete(order._id)}
              >
                🗑️ Delete
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

OrderDetails.displayName = 'OrderDetails';

export default OrderDetails;

