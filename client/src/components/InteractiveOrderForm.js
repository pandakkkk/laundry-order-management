import React, { useState, memo, useRef, useEffect } from 'react';
import './InteractiveOrderForm.css';
import { PRODUCT_CATEGORIES, getProductsByCategory, calculateItemPrice } from '../data/productCatalog';
import ProductOptionsModal from './ProductOptionsModal';
import api from '../services/api';

const InteractiveOrderForm = memo(({ onSubmit, onCancel }) => {
  const [selectedCategory, setSelectedCategory] = useState('household');
  const [cart, setCart] = useState([]);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  
  const [customerInfo, setCustomerInfo] = useState({
    ticketNumber: '',
    orderNumber: '',
    customerId: '',
    customerName: '',
    phoneNumber: '',
    location: '',
    servedBy: '',
    notes: ''
  });

  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomerFromList, setSelectedCustomerFromList] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const customerSearchRef = useRef(null);

  // Handle product click
  const handleProductClick = (product) => {
    if (product.hasOptions) {
      setSelectedProduct(product);
      setShowOptionsModal(true);
    } else {
      addToCart(product);
    }
  };

  // Add item to cart
  const addToCart = (product, selectedOptions = {}, quantity = 1) => {
    const price = calculateItemPrice(product, selectedOptions);
    
    const newItem = {
      id: Date.now(),
      productId: product.id,
      name: product.name,
      quantity: quantity,
      price: price,
      selectedOptions: selectedOptions,
      description: formatItemDescription(product, selectedOptions)
    };

    setCart([...cart, newItem]);
    setShowOptionsModal(false);
  };

  // Format item description with options
  const formatItemDescription = (product, selectedOptions) => {
    let desc = product.name;
    if (Object.keys(selectedOptions).length > 0) {
      const optionLabels = Object.entries(selectedOptions)
        .map(([key, value]) => {
          const option = product.options[key]?.find(opt => opt.value === value);
          return option ? option.label : value;
        })
        .join(', ');
      desc += ` (${optionLabels})`;
    }
    return desc;
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Update item quantity
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  // Calculate total
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  // Handle customer info change
  const handleCustomerInfoChange = async (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-search customers when phone number is typed
    if (name === 'phoneNumber' && value.length >= 3) {
      try {
        setSearchingCustomer(true);
        const response = await api.searchCustomersByPhone(value);
        setCustomerSearchResults(response.data);
        setShowCustomerSearch(response.data.length > 0);
      } catch (error) {
        console.error('Error searching customers:', error);
        setCustomerSearchResults([]);
      } finally {
        setSearchingCustomer(false);
      }
    } else if (name === 'phoneNumber') {
      setCustomerSearchResults([]);
      setShowCustomerSearch(false);
    }
  };

  // Select existing customer
  const handleSelectCustomer = (customer) => {
    setCustomerInfo(prev => ({
      ...prev,
      phoneNumber: customer.phoneNumber,
      customerName: customer.name,
      customerId: customer.customerId || '',
      location: customer.address ? `${customer.address}${customer.city ? ', ' + customer.city : ''}` : ''
    }));
    setShowCustomerSearch(false);
    setCustomerSearchResults([]);
  };

  // Load all customers when form opens
  const loadAllCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const response = await api.getCustomers({ limit: 1000 }); // Get all customers
      setAllCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Filter customers based on search query
  const handleCustomerSearch = (e) => {
    const query = e.target.value;
    setCustomerSearchQuery(query);
    setShowCustomerDropdown(true);

    if (!query.trim()) {
      setFilteredCustomers(allCustomers);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = allCustomers.filter(customer => {
      const nameMatch = customer.name.toLowerCase().includes(lowerQuery);
      const phoneMatch = customer.phoneNumber.includes(query);
      return nameMatch || phoneMatch;
    });
    setFilteredCustomers(filtered);
  };

  // Proceed to booking
  const handleProceedToBooking = () => {
    if (cart.length === 0) {
      alert('Please add items to the cart');
      return;
    }
    setShowCustomerForm(true);
    loadAllCustomers(); // Load customers when opening form
  };

  // Handle customer selection from dropdown
  const handleCustomerSelect = (customer) => {
    setSelectedCustomerFromList(customer._id);
    setCustomerSearchQuery(`${customer.name} - ${customer.phoneNumber}`);
    setShowCustomerDropdown(false);
    
    setCustomerInfo(prev => ({
      ...prev,
      phoneNumber: customer.phoneNumber,
      customerName: customer.name,
      customerId: customer.customerId || '',
      location: customer.address ? `${customer.address}${customer.city ? ', ' + customer.city : ''}` : ''
    }));
  };

  // Clear customer selection
  const handleClearCustomerSelection = () => {
    setSelectedCustomerFromList('');
    setCustomerSearchQuery('');
    setFilteredCustomers(allCustomers);
    setCustomerInfo(prev => ({
      ...prev,
      phoneNumber: '',
      customerName: '',
      customerId: '',
      location: ''
    }));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Submit order
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!customerInfo.ticketNumber || !customerInfo.customerId || !customerInfo.customerName || !customerInfo.phoneNumber) {
      alert('Please fill in all required customer information');
      return;
    }

    if (cart.length === 0) {
      alert('Please add items to the order');
      return;
    }

    const orderData = {
      ...customerInfo,
      orderDate: new Date().toISOString(),
      expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days default
      items: cart.map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        productId: item.productId,
        selectedOptions: item.selectedOptions
      })),
      totalAmount: calculateTotal(),
      paymentMethod: 'Cash',
      paymentStatus: 'Pending',
      status: 'Received'
    };

    onSubmit(orderData);
  };

  const categoryProducts = getProductsByCategory(selectedCategory);

  return (
    <div className="interactive-order-container">
      {/* Header */}
      <div className="pos-header">
        <div className="pos-header-left">
          <h2>🧺 New Order</h2>
          <span className="order-number">001</span>
        </div>
        <div className="pos-header-right">
          <button className="btn-icon" onClick={onCancel} title="Close">
            ✕
          </button>
        </div>
      </div>

      <div className="pos-main-content">
        {/* Left Side - Cart */}
        <div className="pos-cart">
          <div className="cart-header">
            <h3>🛒 Cart</h3>
            <button className="btn-text" onClick={() => setCart([])}>Clear All</button>
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="cart-empty">
                <div className="empty-cart-icon">🛍️</div>
                <p>Start adding products</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-desc">{item.description}</div>
                    <div className="cart-item-price">₹{item.price.toFixed(2)}</div>
                  </div>
                  <div className="cart-item-actions">
                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <button 
                      className="btn-remove" 
                      onClick={() => removeFromCart(item.id)}
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-footer">
            <div className="cart-total">
              <span>Total</span>
              <span className="total-amount">₹{calculateTotal().toFixed(2)}</span>
            </div>
            <button 
              className="btn btn-success btn-lg btn-block" 
              onClick={handleProceedToBooking}
              disabled={cart.length === 0}
            >
              📋 Proceed to Booking
            </button>
          </div>
        </div>

        {/* Right Side - Products */}
        <div className="pos-products">
          {/* Category Tabs */}
          <div className="category-tabs">
            {PRODUCT_CATEGORIES.map(category => (
              <button
                key={category.id}
                className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
                style={{
                  backgroundColor: selectedCategory === category.id ? category.color : '#f3f4f6'
                }}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="product-search">
            <input
              type="text"
              placeholder="🔍 Search products..."
              className="search-input"
            />
            <button className="btn-icon">📊</button>
          </div>

          {/* Product Grid */}
          <div className="product-grid">
            {categoryProducts.map(product => (
              <button
                key={product.id}
                className="product-card"
                onClick={() => handleProductClick(product)}
              >
                <div className="product-name">{product.name}</div>
                <div className="product-price">
                  {product.basePrice < 0 ? (
                    <span className="discount-price">₹{product.basePrice.toFixed(2)}</span>
                  ) : (
                    <span>₹{product.basePrice.toFixed(2)}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Options Modal */}
      {showOptionsModal && selectedProduct && (
        <ProductOptionsModal
          product={selectedProduct}
          onAdd={addToCart}
          onClose={() => {
            setShowOptionsModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Customer Information Modal */}
      {showCustomerForm && (
        <div className="modal-overlay">
          <div className="modal-content customer-form-modal">
            <div className="modal-header">
              <h3>👤 Customer Information</h3>
              <button className="btn-close" onClick={() => setShowCustomerForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="customer-form">
              {/* Customer Selection Dropdown */}
              <div className="customer-selection-section">
                <label htmlFor="customerSelect" className="customer-select-label">
                  👥 Search Customer by Name or Phone Number
                </label>
                {loadingCustomers ? (
                  <div className="loading-customers">Loading customers...</div>
                ) : (
                  <div className="customer-search-wrapper" ref={customerSearchRef}>
                    <div className="customer-search-input-container">
                      <input
                        type="text"
                        className="customer-search-input"
                        placeholder="🔍 Type customer name or phone number..."
                        value={customerSearchQuery}
                        onChange={handleCustomerSearch}
                        onFocus={() => setShowCustomerDropdown(true)}
                      />
                      {selectedCustomerFromList && (
                        <button
                          type="button"
                          className="clear-customer-btn"
                          onClick={handleClearCustomerSelection}
                          title="Clear selection"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    
                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div className="customer-dropdown-results">
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer._id}
                            className="customer-dropdown-item"
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            <div className="customer-dropdown-name">{customer.name}</div>
                            <div className="customer-dropdown-phone">{customer.phoneNumber}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {showCustomerDropdown && customerSearchQuery && filteredCustomers.length === 0 && (
                      <div className="customer-dropdown-results">
                        <div className="customer-dropdown-empty">
                          No customers found. Add as new customer below.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-divider"></div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ticketNumber">Ticket Number *</label>
                  <input
                    type="text"
                    id="ticketNumber"
                    name="ticketNumber"
                    value={customerInfo.ticketNumber}
                    onChange={handleCustomerInfoChange}
                    placeholder="e.g., 2504-143-00002"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="orderNumber">Order Number *</label>
                  <input
                    type="text"
                    id="orderNumber"
                    name="orderNumber"
                    value={customerInfo.orderNumber}
                    onChange={handleCustomerInfoChange}
                    placeholder="e.g., 002"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="customerId">Customer ID *</label>
                  <input
                    type="text"
                    id="customerId"
                    name="customerId"
                    value={customerInfo.customerId}
                    onChange={handleCustomerInfoChange}
                    placeholder="e.g., CUST001"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="customerName">Customer Name *</label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={customerInfo.customerName}
                    onChange={handleCustomerInfoChange}
                    placeholder="Customer name"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number *</label>
                  <div className="phone-search-container">
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={customerInfo.phoneNumber}
                      onChange={handleCustomerInfoChange}
                      placeholder="+91 XXXXXXXXXX"
                      required
                    />
                    {searchingCustomer && (
                      <div className="search-indicator">Searching...</div>
                    )}
                    {showCustomerSearch && customerSearchResults.length > 0 && (
                      <div className="customer-search-results">
                        <div className="search-results-header">
                          Found {customerSearchResults.length} existing customer(s):
                        </div>
                        {customerSearchResults.map((customer) => (
                          <div
                            key={customer._id}
                            className="customer-search-item"
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            <div className="customer-item-name">
                              <strong>{customer.name}</strong>
                            </div>
                            <div className="customer-item-phone">{customer.phoneNumber}</div>
                            {customer.address && (
                              <div className="customer-item-address">{customer.address}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="servedBy">Served By *</label>
                  <input
                    type="text"
                    id="servedBy"
                    name="servedBy"
                    value={customerInfo.servedBy}
                    onChange={handleCustomerInfoChange}
                    placeholder="Staff name"
                    required
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={customerInfo.location}
                  onChange={handleCustomerInfoChange}
                  placeholder="Customer address/location"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={customerInfo.notes}
                  onChange={handleCustomerInfoChange}
                  placeholder="Additional notes or special instructions..."
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowCustomerForm(false)}
                >
                  Back
                </button>
                <button type="submit" className="btn btn-success">
                  ✓ Create Order (₹{calculateTotal().toFixed(2)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

InteractiveOrderForm.displayName = 'InteractiveOrderForm';

export default InteractiveOrderForm;

