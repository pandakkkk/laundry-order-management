import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { PRODUCT_CATEGORIES } from '../data/productCatalog';
import './ProductManagement.css';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    category: 'household',
    basePrice: '',
    hasOptions: false,
    isActive: true
  });

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = { active: 'all' };
      if (filterCategory) params.category = filterCategory;
      
      const response = await api.getProducts(params);
      if (response.success) {
        let filteredProducts = response.data;
        
        // Apply search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.productId.toLowerCase().includes(query)
          );
        }
        
        setProducts(filteredProducts);
      }
    } catch (err) {
      setError('Failed to fetch products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Generate product ID from name
  const generateProductId = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
  };

  // Open create modal
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedProduct(null);
    setFormData({
      productId: '',
      name: '',
      category: 'household',
      basePrice: '',
      hasOptions: false,
      isActive: true
    });
    setError(null);
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (product) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setFormData({
      productId: product.productId,
      name: product.name,
      category: product.category,
      basePrice: product.basePrice.toString(),
      hasOptions: product.hasOptions || false,
      isActive: product.isActive !== false
    });
    setError(null);
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const productData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice) || 0
      };

      if (modalMode === 'create') {
        // Auto-generate product ID if empty
        if (!productData.productId) {
          productData.productId = generateProductId(productData.name);
        }
        
        const response = await api.createProduct(productData);
        if (response.success) {
          fetchProducts();
          setShowModal(false);
        } else {
          setError(response.error || 'Failed to create product');
        }
      } else if (modalMode === 'edit') {
        const response = await api.updateProduct(selectedProduct.productId, productData);
        if (response.success) {
          fetchProducts();
          setShowModal(false);
        } else {
          setError(response.error || 'Failed to update product');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to DELETE "${product.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.deleteProduct(product.productId);
      if (response.success) {
        fetchProducts();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete product');
    }
  };

  // Reset all products to default prices
  const handleResetDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset ALL products to their default prices? This will overwrite any custom pricing.')) {
      return;
    }

    try {
      const response = await api.resetProductsToDefaults();
      if (response.success) {
        fetchProducts();
        alert('All products have been reset to default prices');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reset products');
    }
  };

  // Get category info
  const getCategoryInfo = (categoryId) => {
    return PRODUCT_CATEGORIES.find(c => c.id === categoryId) || { name: categoryId, icon: '📦', color: '#6B7280' };
  };

  // Calculate stats
  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive !== false).length,
    byCategory: PRODUCT_CATEGORIES.map(cat => ({
      ...cat,
      count: products.filter(p => p.category === cat.id).length
    }))
  };

  return (
    <div className="product-management">
      {/* Header */}
      <div className="pm-header">
        <div className="pm-header-left">
          <h1>🏷️ Product Management</h1>
          <p>Manage products and pricing for your laundry services</p>
        </div>
        <div className="pm-header-actions">
          <button className="btn-secondary" onClick={handleResetDefaults}>
            🔄 Reset to Defaults
          </button>
          <button className="btn-primary" onClick={openCreateModal}>
            ➕ Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="pm-stats">
        <div className="pm-stat-card total">
          <span className="pm-stat-icon">📦</span>
          <div className="pm-stat-info">
            <span className="pm-stat-value">{stats.total}</span>
            <span className="pm-stat-label">Total Products</span>
          </div>
        </div>
        <div className="pm-stat-card active">
          <span className="pm-stat-icon">✅</span>
          <div className="pm-stat-info">
            <span className="pm-stat-value">{stats.active}</span>
            <span className="pm-stat-label">Active</span>
          </div>
        </div>
        {stats.byCategory.slice(0, 4).map(cat => (
          <div key={cat.id} className="pm-stat-card category" style={{ borderLeftColor: cat.color }}>
            <span className="pm-stat-icon">{cat.icon}</span>
            <div className="pm-stat-info">
              <span className="pm-stat-value">{cat.count}</span>
              <span className="pm-stat-label">{cat.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="pm-filters">
        <div className="pm-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search products by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="pm-filter-select"
        >
          <option value="">All Categories</option>
          {PRODUCT_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="pm-table-container">
        {loading ? (
          <div className="pm-loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="pm-empty">
            <span className="pm-empty-icon">📭</span>
            <p>No products found</p>
            <button className="btn-primary" onClick={openCreateModal}>Add First Product</button>
          </div>
        ) : (
          <table className="pm-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Base Price</th>
                <th>Options</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const categoryInfo = getCategoryInfo(product.category);
                return (
                  <tr key={product.productId || product._id} className={product.isActive === false ? 'inactive-row' : ''}>
                    <td>
                      <div className="product-info">
                        <div className="product-icon" style={{ backgroundColor: categoryInfo.color }}>
                          {categoryInfo.icon}
                        </div>
                        <div className="product-details">
                          <span className="product-name">{product.name}</span>
                          <span className="product-id">{product.productId}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="category-badge" 
                        style={{ backgroundColor: `${categoryInfo.color}20`, color: categoryInfo.color }}
                      >
                        {categoryInfo.icon} {categoryInfo.name}
                      </span>
                    </td>
                    <td>
                      <span className={`price-display ${product.basePrice < 0 ? 'discount' : ''}`}>
                        ₹{product.basePrice?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    <td>
                      <span className={`options-badge ${product.hasOptions ? 'has-options' : ''}`}>
                        {product.hasOptions ? '✓ Has Options' : '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${product.isActive !== false ? 'active' : 'inactive'}`}>
                        {product.isActive !== false ? '✅ Active' : '🚫 Inactive'}
                      </span>
                    </td>
                    <td>
                      {product.updatedAt ? (
                        <span className="last-updated">
                          {new Date(product.updatedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: '2-digit'
                          })}
                          {product.updatedBy && (
                            <span className="updated-by">by {product.updatedBy}</span>
                          )}
                        </span>
                      ) : (
                        <span className="never-updated">—</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-action edit" 
                          onClick={() => openEditModal(product)}
                          title="Edit Product"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-action delete" 
                          onClick={() => handleDelete(product)}
                          title="Delete Product"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="pm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal-header">
              <h2>
                {modalMode === 'create' ? '➕ Add New Product' : '✏️ Edit Product'}
              </h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="pm-modal-body">
                {error && <div className="pm-form-error">{error}</div>}
                
                <div className="pm-form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter product name (e.g., Shirt, Blanket)"
                  />
                </div>

                <div className="pm-form-row">
                  <div className="pm-form-group">
                    <label>Product ID {modalMode === 'create' && '(auto-generated)'}</label>
                    <input
                      type="text"
                      name="productId"
                      value={formData.productId}
                      onChange={handleInputChange}
                      placeholder={generateProductId(formData.name) || 'Auto-generated from name'}
                      disabled={modalMode === 'edit'}
                    />
                  </div>

                  <div className="pm-form-group">
                    <label>Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      {PRODUCT_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pm-form-row">
                  <div className="pm-form-group">
                    <label>Base Price (₹) *</label>
                    <div className="price-input-wrapper">
                      <span className="currency-symbol">₹</span>
                      <input
                        type="number"
                        name="basePrice"
                        value={formData.basePrice}
                        onChange={handleInputChange}
                        required
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <small>Use negative values for discounts</small>
                  </div>

                  <div className="pm-form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="hasOptions"
                        checked={formData.hasOptions}
                        onChange={handleInputChange}
                      />
                      <span>Has Additional Options</span>
                    </label>
                    <small>Enable if product has variants (size, color, etc.)</small>
                    
                    <label className="checkbox-label" style={{ marginTop: '0.75rem' }}>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                      <span>Active (visible to staff)</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="pm-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (modalMode === 'create' ? 'Create Product' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
