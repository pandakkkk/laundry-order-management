import React, { useState, memo, useRef, useEffect, useCallback } from 'react';
import './InteractiveOrderForm.css';
import { PRODUCT_CATEGORIES, PRODUCTS as STATIC_PRODUCTS, calculateItemPrice } from '../data/productCatalog';
import ProductOptionsModal from './ProductOptionsModal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { validateIndianPhone, formatPhoneOnType, getPhoneHelperText, extractPhoneDigits } from '../utils/phoneValidation';

const InteractiveOrderForm = memo(({ onSubmit, onCancel }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canEditPrice = isAdmin || user?.role === 'manager';
  
  const [selectedCategory, setSelectedCategory] = useState('household');
  const [cart, setCart] = useState([]);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState(null);
  
  // Product management state
  const [products, setProducts] = useState(STATIC_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showPriceEditModal, setShowPriceEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingBasePrice, setEditingBasePrice] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);
  
  // Helper to get default delivery date (2 days from now)
  const getDefaultDeliveryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  };

  const [customerInfo, setCustomerInfo] = useState({
    ticketNumber: '',
    orderNumber: '',
    customerName: '',
    phoneNumber: '',
    location: '',
    notes: '',
    servedBy: '',
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
    expectedDeliveryDate: getDefaultDeliveryDate()
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
  const [sendWhatsAppReceipt, setSendWhatsAppReceipt] = useState(true);
  const [sendSMSReceipt, setSendSMSReceipt] = useState(false);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);
  const [customerFound, setCustomerFound] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const response = await api.getProducts();
      if (response.success && response.data.length > 0) {
        // Map API products to the format expected by the component
        const apiProducts = response.data.map(p => ({
          id: p.productId,
          name: p.name,
          category: p.category,
          basePrice: p.basePrice,
          hasOptions: p.hasOptions,
          options: p.options
        }));
        setProducts(apiProducts);
      }
    } catch (error) {
      console.error('Error fetching products, using static data:', error);
      // Fall back to static products
      setProducts(STATIC_PRODUCTS);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle opening price edit modal
  const handleEditProductPrice = (e, product) => {
    e.stopPropagation(); // Prevent adding to cart
    setEditingProduct(product);
    setEditingBasePrice(product.basePrice.toString());
    setShowPriceEditModal(true);
  };

  // Handle saving product price
  const handleSaveProductPrice = async () => {
    if (!editingProduct) return;
    
    const newPrice = parseFloat(editingBasePrice);
    if (isNaN(newPrice)) {
      alert('Please enter a valid price');
      return;
    }

    try {
      setSavingPrice(true);
      const response = await api.updateProductPrice(editingProduct.id, newPrice);
      
      if (response.success) {
        // Update local products state
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === editingProduct.id ? { ...p, basePrice: newPrice } : p
          )
        );
        setShowPriceEditModal(false);
        setEditingProduct(null);
        setEditingBasePrice('');
      } else {
        alert('Failed to update price: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating product price:', error);
      alert('Failed to update price. Please try again.');
    } finally {
      setSavingPrice(false);
    }
  };

  // Fetch next ticket and order numbers when customer form opens
  const fetchNextOrderNumbers = async () => {
    try {
      setIsLoadingNumbers(true);
      const response = await api.getNextOrderNumbers();
      if (response.success) {
        setCustomerInfo(prev => ({
          ...prev,
          ticketNumber: response.data.ticketNumber,
          orderNumber: response.data.orderNumber
        }));
      }
    } catch (error) {
      console.error('Error fetching next order numbers:', error);
      // Keep fields empty - server will auto-generate
    } finally {
      setIsLoadingNumbers(false);
    }
  };

  // Lookup customer by exact phone number
  const lookupCustomerByPhone = async (phone) => {
    if (!phone || phone.length < 10) {
      setCustomerFound(null);
      return;
    }

    try {
      const response = await api.getCustomerByPhone(phone);
      if (response.success && response.exists) {
        setCustomerFound(response.data);
        setCustomerInfo(prev => ({
          ...prev,
          customerName: response.data.name || '',
          location: response.data.address 
            ? `${response.data.address}${response.data.city ? ', ' + response.data.city : ''}`
            : prev.location
        }));
      } else {
        setCustomerFound(null);
      }
    } catch (error) {
      setCustomerFound(null);
    }
  };

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

  // Update item price (admin only)
  const updateItemPrice = (itemId, newPrice) => {
    const parsedPrice = parseFloat(newPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) return;
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, price: parsedPrice } : item
    ));
  };

  // Calculate total
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  // Handle customer info change
  const handleCustomerInfoChange = async (e) => {
    const { name, value } = e.target;
    
    // Auto-search and auto-populate when phone number is typed
    if (name === 'phoneNumber') {
      // Format phone number as user types
      const formattedPhone = formatPhoneOnType(value);
      
      setCustomerInfo(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
      
      // Validate phone number
      const digits = extractPhoneDigits(formattedPhone);
      if (digits.length > 0) {
        setPhoneTouched(true);
        const { isValid, error } = validateIndianPhone(formattedPhone);
        setPhoneError(isValid ? '' : error);
      } else {
        setPhoneError('');
        setPhoneTouched(false);
      }
      
      // Clear customer found state when phone changes
      if (customerFound && formattedPhone !== customerFound.phoneNumber) {
        setCustomerFound(null);
      }
      
      if (digits.length >= 10) {
        // Try exact match lookup for auto-populate
        lookupCustomerByPhone(digits);
      }
      
      if (digits.length >= 3) {
        try {
          setSearchingCustomer(true);
          const response = await api.searchCustomersByPhone(digits);
          setCustomerSearchResults(response.data);
          setShowCustomerSearch(response.data.length > 0);
        } catch (error) {
          console.error('Error searching customers:', error);
          setCustomerSearchResults([]);
        } finally {
          setSearchingCustomer(false);
        }
      } else {
        setCustomerSearchResults([]);
        setShowCustomerSearch(false);
      }
    } else {
      setCustomerInfo(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Select existing customer
  const handleSelectCustomer = (customer) => {
    setCustomerInfo(prev => ({
      ...prev,
      phoneNumber: customer.phoneNumber,
      customerName: customer.name,
      location: customer.address ? `${customer.address}${customer.city ? ', ' + customer.city : ''}` : ''
    }));
    setCustomerFound(customer);
    setShowCustomerSearch(false);
    setCustomerSearchResults([]);
    setPhoneError('');
    setPhoneTouched(false);
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
    fetchNextOrderNumbers(); // Fetch next ticket and order numbers
  };

  // Handle customer selection from dropdown
  const handleCustomerSelect = (customer) => {
    setSelectedCustomerFromList(customer._id);
    setCustomerSearchQuery(`${customer.name} - ${customer.phoneNumber}`);
    setShowCustomerDropdown(false);
    setCustomerFound(customer);
    setPhoneError('');
    setPhoneTouched(false);
    
    setCustomerInfo(prev => ({
      ...prev,
      phoneNumber: customer.phoneNumber,
      customerName: customer.name,
      location: customer.address ? `${customer.address}${customer.city ? ', ' + customer.city : ''}` : ''
    }));
  };

  // Clear customer selection
  const handleClearCustomerSelection = () => {
    setSelectedCustomerFromList('');
    setCustomerSearchQuery('');
    setFilteredCustomers(allCustomers);
    setCustomerFound(null);
    setPhoneError('');
    setPhoneTouched(false);
    setCustomerInfo(prev => ({
      ...prev,
      phoneNumber: '',
      customerName: '',
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
    
    // Validation - ticketNumber and orderNumber are optional (auto-generated)
    if (!customerInfo.customerName || !customerInfo.phoneNumber) {
      alert('Please fill in customer name and phone number');
      return;
    }

    // Validate phone number
    const { isValid, error } = validateIndianPhone(customerInfo.phoneNumber);
    if (!isValid) {
      setPhoneError(error);
      setPhoneTouched(true);
      alert(`Invalid phone number: ${error}`);
      return;
    }

    if (cart.length === 0) {
      alert('Please add items to the order');
      return;
    }

    // Determine notification type based on selections
    let notificationType = 'none';
    if (sendWhatsAppReceipt && sendSMSReceipt) {
      notificationType = 'both';
    } else if (sendWhatsAppReceipt) {
      notificationType = 'whatsapp';
    } else if (sendSMSReceipt) {
      notificationType = 'sms';
    }

    // Parse the selected delivery date and set time to end of day
    const deliveryDate = new Date(customerInfo.expectedDeliveryDate);
    deliveryDate.setHours(18, 0, 0, 0); // Set to 6 PM

    const orderData = {
      ...customerInfo,
      // ticketNumber and orderNumber will be auto-generated by server if empty
      orderDate: new Date().toISOString(),
      expectedDelivery: deliveryDate.toISOString(),
      items: cart.map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        productId: item.productId,
        selectedOptions: item.selectedOptions
      })),
      totalAmount: calculateTotal(),
      paymentMethod: customerInfo.paymentMethod,
      paymentStatus: customerInfo.paymentStatus,
      status: 'Received',
      sendNotification: notificationType
    };

    onSubmit(orderData);
  };

  // Get products filtered by category
  const categoryProducts = products.filter(product => product.category === selectedCategory);

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
                    <div className="cart-item-price">
                      {canEditPrice ? (
                        editingPriceId === item.id ? (
                          <input
                            type="number"
                            className="price-edit-input"
                            value={item.price}
                            onChange={(e) => updateItemPrice(item.id, e.target.value)}
                            onBlur={() => setEditingPriceId(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingPriceId(null);
                            }}
                            autoFocus
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          <span 
                            className="editable-price"
                            onClick={() => setEditingPriceId(item.id)}
                            title="Click to edit price"
                          >
                            ₹{item.price.toFixed(2)} ✏️
                          </span>
                        )
                      ) : (
                        <span>₹{item.price.toFixed(2)}</span>
                      )}
                    </div>
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
            {loadingProducts ? (
              <div className="loading-products">Loading products...</div>
            ) : (
              categoryProducts.map(product => (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => handleProductClick(product)}
                >
                  {canEditPrice && (
                    <button
                      className="product-edit-price-btn"
                      onClick={(e) => handleEditProductPrice(e, product)}
                      title="Edit Price"
                    >
                      ⋮
                    </button>
                  )}
                  <div className="product-name">{product.name}</div>
                  <div className="product-price">
                    {product.basePrice < 0 ? (
                      <span className="discount-price">₹{product.basePrice.toFixed(2)}</span>
                    ) : (
                      <span>₹{product.basePrice.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              ))
            )}
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

      {/* Product Price Edit Modal (Admin Only) */}
      {showPriceEditModal && editingProduct && (
        <div className="modal-overlay" onClick={() => setShowPriceEditModal(false)}>
          <div className="modal-content price-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit Product Price</h3>
              <button className="btn-close" onClick={() => setShowPriceEditModal(false)}>✕</button>
            </div>
            <div className="price-edit-form">
              <div className="price-edit-product-info">
                <span className="price-edit-product-name">{editingProduct.name}</span>
                <span className="price-edit-product-category">
                  {PRODUCT_CATEGORIES.find(c => c.id === editingProduct.category)?.name || editingProduct.category}
                </span>
              </div>
              
              <div className="price-edit-field">
                <label htmlFor="basePrice">Base Price (₹)</label>
                <div className="price-input-wrapper">
                  <span className="currency-symbol">₹</span>
                  <input
                    type="number"
                    id="basePrice"
                    value={editingBasePrice}
                    onChange={(e) => setEditingBasePrice(e.target.value)}
                    placeholder="Enter price"
                    step="0.01"
                    autoFocus
                  />
                </div>
                <small className="price-edit-hint">
                  Current price: ₹{editingProduct.basePrice.toFixed(2)}
                </small>
              </div>

              <div className="price-edit-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowPriceEditModal(false)}
                  disabled={savingPrice}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-success" 
                  onClick={handleSaveProductPrice}
                  disabled={savingPrice}
                >
                  {savingPrice ? 'Saving...' : '✓ Save Price'}
                </button>
              </div>
            </div>
          </div>
        </div>
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
                  <label htmlFor="ticketNumber">
                    Ticket Number
                    <span style={{ color: '#4caf50', fontSize: '0.7rem', marginLeft: '5px' }}>✨ Auto</span>
                  </label>
                  <input
                    type="text"
                    id="ticketNumber"
                    name="ticketNumber"
                    value={isLoadingNumbers ? 'Loading...' : customerInfo.ticketNumber}
                    onChange={handleCustomerInfoChange}
                    placeholder="Auto-generated"
                    disabled={isLoadingNumbers}
                    style={{ backgroundColor: customerInfo.ticketNumber ? '#e8f5e9' : undefined }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="orderNumber">
                    Order Number
                    <span style={{ color: '#4caf50', fontSize: '0.7rem', marginLeft: '5px' }}>✨ Auto</span>
                  </label>
                  <input
                    type="text"
                    id="orderNumber"
                    name="orderNumber"
                    value={isLoadingNumbers ? 'Loading...' : customerInfo.orderNumber}
                    onChange={handleCustomerInfoChange}
                    placeholder="Auto-generated"
                    disabled={isLoadingNumbers}
                    style={{ backgroundColor: customerInfo.orderNumber ? '#e8f5e9' : undefined }}
                  />
                </div>
              </div>

              <div className="form-row">
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
                    style={{ backgroundColor: customerFound ? '#e8f5e9' : undefined }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phoneNumber">
                    Phone Number *
                    {customerFound && <span style={{ color: '#4caf50', fontSize: '0.7rem', marginLeft: '5px' }}>✅ Customer Found</span>}
                  </label>
                  <div className="phone-search-container">
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={customerInfo.phoneNumber}
                      onChange={handleCustomerInfoChange}
                      onBlur={() => setPhoneTouched(true)}
                      placeholder="+91 XXXXX XXXXX"
                      required
                      maxLength={16}
                      className={phoneTouched && phoneError ? 'error' : ''}
                      style={{ 
                        backgroundColor: customerFound ? '#e8f5e9' : (phoneTouched && phoneError ? '#ffebee' : undefined),
                        borderColor: phoneTouched && phoneError ? '#f44336' : undefined
                      }}
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
                  {phoneTouched && phoneError ? (
                    <small style={{ color: '#f44336', fontSize: '0.7rem' }}>
                      ⚠️ {phoneError}
                    </small>
                  ) : (
                    <small style={{ color: customerFound ? '#2e7d32' : 'var(--text-secondary)', fontSize: '0.7rem' }}>
                      {getPhoneHelperText(customerInfo.phoneNumber, customerFound)}
                    </small>
                  )}
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

              {/* Delivery Date Section */}
              <div className="form-divider delivery-divider">
                <span>📅 Delivery Information</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="expectedDeliveryDate">
                    Expected Delivery Date *
                  </label>
                  <input
                    type="date"
                    id="expectedDeliveryDate"
                    name="expectedDeliveryDate"
                    value={customerInfo.expectedDeliveryDate}
                    onChange={handleCustomerInfoChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="delivery-date-input"
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                    Select the expected delivery date for this order
                  </small>
                </div>
                <div className="form-group">
                  <label htmlFor="servedBy">Served By</label>
                  <input
                    type="text"
                    id="servedBy"
                    name="servedBy"
                    value={customerInfo.servedBy || ''}
                    onChange={handleCustomerInfoChange}
                    placeholder="Staff name"
                  />
                </div>
              </div>

              {/* Payment Section */}
              <div className="form-divider payment-divider">
                <span>💰 Payment Information</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment Method *</label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={customerInfo.paymentMethod}
                    onChange={handleCustomerInfoChange}
                    className="payment-select"
                    required
                  >
                    <option value="Cash">💵 Cash</option>
                    <option value="Card">💳 Card</option>
                    <option value="UPI">📱 UPI</option>
                    <option value="Online">🌐 Online</option>
                    <option value="Wallet">👛 Wallet</option>
                    <option value="Credit">📝 Credit (Pay Later)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="paymentStatus">Payment Status *</label>
                  <select
                    id="paymentStatus"
                    name="paymentStatus"
                    value={customerInfo.paymentStatus}
                    onChange={handleCustomerInfoChange}
                    className="payment-select"
                    required
                  >
                    <option value="Pending">⏳ Pending</option>
                    <option value="Paid">✅ Paid</option>
                    <option value="Partial">🔄 Partial</option>
                  </select>
                </div>
              </div>

              {/* Notification Options */}
              <div className="notification-options">
                <span className="notification-label">📤 Send Receipt:</span>
                <label className="checkbox-option whatsapp-option">
                  <input
                    type="checkbox"
                    checked={sendWhatsAppReceipt}
                    onChange={(e) => setSendWhatsAppReceipt(e.target.checked)}
                  />
                  <span className="checkbox-icon">📱</span>
                  <span>WhatsApp</span>
                </label>
                <label className="checkbox-option sms-option">
                  <input
                    type="checkbox"
                    checked={sendSMSReceipt}
                    onChange={(e) => setSendSMSReceipt(e.target.checked)}
                  />
                  <span className="checkbox-icon">💬</span>
                  <span>SMS</span>
                </label>
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

