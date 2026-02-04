import React, { useState, memo, useEffect, useCallback } from 'react';
import './OrderForm.css';
import api from '../services/api';

const OrderForm = memo(({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    ticketNumber: '',
    orderNumber: '',
    customerName: '',
    phoneNumber: '',
    orderDate: new Date().toISOString().slice(0, 16),
    expectedDelivery: '',
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
    status: 'Received',
    location: '',
    notes: ''
  });

  const [items, setItems] = useState([
    { description: '', quantity: 1, price: 0 }
  ]);

  const [isLoadingNumbers, setIsLoadingNumbers] = useState(true);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [customerFound, setCustomerFound] = useState(null);

  // Fetch next ticket and order numbers on component mount
  useEffect(() => {
    const fetchNextNumbers = async () => {
      try {
        setIsLoadingNumbers(true);
        const response = await api.getNextOrderNumbers();
        if (response.success) {
          setFormData(prev => ({
            ...prev,
            ticketNumber: response.data.ticketNumber,
            orderNumber: response.data.orderNumber
          }));
        }
      } catch (error) {
        console.error('Error fetching next order numbers:', error);
        // Keep fields empty if fetch fails - server will auto-generate
      } finally {
        setIsLoadingNumbers(false);
      }
    };
    fetchNextNumbers();
  }, []);

  // Debounced phone number lookup
  const lookupCustomerByPhone = useCallback(async (phone) => {
    if (!phone || phone.length < 10) {
      setCustomerFound(null);
      return;
    }

    try {
      setIsSearchingCustomer(true);
      const response = await api.getCustomerByPhone(phone);
      if (response.success && response.exists) {
        setCustomerFound(response.data);
        // Auto-populate customer fields
        setFormData(prev => ({
          ...prev,
          customerName: response.data.name || '',
          location: response.data.address 
            ? `${response.data.address}${response.data.city ? ', ' + response.data.city : ''}`
            : ''
        }));
      } else {
        setCustomerFound(null);
      }
    } catch (error) {
      // Customer not found - that's okay, it's a new customer
      setCustomerFound(null);
      console.log('Customer not found for phone:', phone);
    } finally {
      setIsSearchingCustomer(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-lookup customer when phone number is entered
    if (name === 'phoneNumber') {
      // Clear customer info if phone is being changed
      if (customerFound && value !== customerFound.phoneNumber) {
        setCustomerFound(null);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          customerName: '',
          location: ''
        }));
      }
      // Debounce the lookup
      const timeoutId = setTimeout(() => {
        lookupCustomerByPhone(value);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = field === 'quantity' || field === 'price' ? 
      parseFloat(value) || 0 : value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation - ticketNumber and orderNumber are now optional (auto-generated)
    if (!formData.customerName || !formData.phoneNumber) {
      alert('Please fill in customer name and phone number');
      return;
    }

    if (items.some(item => !item.description || item.price <= 0)) {
      alert('Please fill in all item details with valid prices');
      return;
    }

    const orderData = {
      ...formData,
      orderDate: new Date(formData.orderDate).toISOString(),
      expectedDelivery: new Date(formData.expectedDelivery).toISOString(),
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: calculateTotal()
    };

    onSubmit(orderData);
  };

  return (
    <div className="order-form-container">
      <div className="form-header">
        <h2>📝 Create New Order</h2>
        <button className="close-btn" onClick={onCancel}>✕</button>
      </div>

      <form onSubmit={handleSubmit} className="order-form">
        <div className="form-section">
          <h3>Order Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="ticketNumber">Ticket Number</label>
              <input
                type="text"
                id="ticketNumber"
                name="ticketNumber"
                value={isLoadingNumbers ? 'Loading...' : formData.ticketNumber}
                onChange={handleInputChange}
                placeholder="Auto-generated"
                disabled={isLoadingNumbers}
                style={{ backgroundColor: formData.ticketNumber ? '#e8f5e9' : undefined }}
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                ✨ Auto-generated (editable)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="orderNumber">Order Number</label>
              <input
                type="text"
                id="orderNumber"
                name="orderNumber"
                value={isLoadingNumbers ? 'Loading...' : formData.orderNumber}
                onChange={handleInputChange}
                placeholder="Auto-generated"
                disabled={isLoadingNumbers}
                style={{ backgroundColor: formData.orderNumber ? '#e8f5e9' : undefined }}
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                ✨ Auto-generated (editable)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="Received">📥 Received</option>
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
          </div>
        </div>

        <div className="form-section">
          <h3>Customer Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+91 XXXXXXXXXX"
                  required
                  style={{ 
                    backgroundColor: customerFound ? '#e8f5e9' : undefined,
                    paddingRight: isSearchingCustomer ? '40px' : undefined
                  }}
                />
                {isSearchingCustomer && (
                  <span style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}>
                    🔍
                  </span>
                )}
              </div>
              <small style={{ color: customerFound ? '#2e7d32' : 'var(--text-secondary)', fontSize: '0.75rem' }}>
                {customerFound 
                  ? `✅ Existing customer found - ID auto-filled`
                  : 'Enter phone to auto-lookup customer'}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="customerName">Customer Name *</label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="Customer name"
                required
                style={{ backgroundColor: customerFound ? '#e8f5e9' : undefined }}
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Customer address/location"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Timeline</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="orderDate">Order Date & Time *</label>
              <input
                type="datetime-local"
                id="orderDate"
                name="orderDate"
                value={formData.orderDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="expectedDelivery">Expected Delivery *</label>
              <input
                type="datetime-local"
                id="expectedDelivery"
                name="expectedDelivery"
                value={formData.expectedDelivery}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Items</h3>
          {items.map((item, index) => (
            <div key={index} className="item-row">
              <div className="item-inputs">
                <div className="form-group flex-2">
                  <label>Description *</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="e.g., Shirt (male, white, fullsleeves)"
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                    required
                  />
                </div>
              </div>

              {items.length > 1 && (
                <button
                  type="button"
                  className="btn-remove-item"
                  onClick={() => removeItem(index)}
                  title="Remove item"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}

          <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
            + Add Item
          </button>

          <div className="total-display">
            <strong>Total Amount:</strong>
            <span className="total-amount">₹{calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="form-section">
          <h3>Payment</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="paymentMethod">Payment Method</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Online">Online</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="paymentStatus">Payment Status</label>
              <select
                id="paymentStatus"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleInputChange}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Notes</h3>
          <div className="form-group">
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional notes or special instructions..."
              rows="3"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-success">
            Create Order
          </button>
        </div>
      </form>
    </div>
  );
});

OrderForm.displayName = 'OrderForm';

export default OrderForm;

