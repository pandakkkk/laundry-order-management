import React, { useState, useEffect, useCallback, useRef } from 'react';
import './CustomerTracker.css';
import { detectSearchType, getPlaceholder } from '../utils/smartSearch';
import api from '../services/api';
import CustomerOrderHistory from './CustomerOrderHistory';
import Pagination from './Pagination';

const CustomerTracker = ({
  stats,
  onCustomerSelect,
  onCustomerEdit,
  onCustomerDelete
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('phoneNumber'); // Default to phone number
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null); // Track active filter
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [isFieldManuallySelected, setIsFieldManuallySelected] = useState(false); // Track if user manually selected field
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const searchInputRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Auto-detect search type when query changes (only if user hasn't manually selected a field)
  useEffect(() => {
    // Only auto-detect if user hasn't manually selected a field
    if (searchQuery.trim() && !isFieldManuallySelected) {
      const detected = detectSearchType(searchQuery);
      // For customers, we don't have ticket numbers, so skip that
      if (detected !== 'ticketNumber' && detected !== 'all' && detected !== searchType) {
        setSearchType(detected);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, isFieldManuallySelected]); // searchType intentionally excluded to avoid infinite loop

  // Manual search (only when user clicks search or presses Enter)
  const performSearch = useCallback(async (page = 1) => {
    if (isFetchingRef.current) return;
    
    const query = searchQuery.trim();
    if (!query) {
      setCustomers([]);
      setHasSearched(false);
      setActiveFilter(null);
      setPagination(null);
      setCurrentPage(1);
      return;
    }

    try {
      isFetchingRef.current = true;
      setIsSearching(true);
      setHasSearched(true);
      setActiveFilter(null); // Clear active filter when searching
      
      const data = await api.searchCustomers(query, searchType, page);
      setCustomers(data.data || []);
      setPagination(data.pagination || null);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomers([]);
      setPagination(null);
    } finally {
      setIsSearching(false);
      isFetchingRef.current = false;
    }
  }, [searchQuery, searchType]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle quick filter (toggleable)
  const handleQuickFilter = async (filter, page = 1) => {
    // If clicking the same filter, clear it
    if (activeFilter === filter) {
      setActiveFilter(null);
      setHasSearched(false);
      setCustomers([]);
      setSearchQuery('');
      setPagination(null);
      setCurrentPage(1);
      return;
    }
    
    setActiveFilter(filter);
    setSearchQuery('');
    setHasSearched(true);
    setLoading(true);
    
    try {
      let params = { status: filter, page, limit: 20 };
      
      const data = await api.getCustomers(params);
      setCustomers(data.data || []);
      setPagination(data.pagination || null);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Clear all filters and return to empty state
  const handleClearAll = useCallback(() => {
    setActiveFilter(null);
    setSearchQuery('');
    setHasSearched(false);
    setCustomers([]);
    setIsFieldManuallySelected(false); // Reset manual selection flag
    setSearchType('phoneNumber'); // Reset to default
    searchInputRef.current?.focus();
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Enter to search
      if (e.key === 'Enter' && e.target === searchInputRef.current) {
        e.preventDefault();
        performSearch();
      }
      // Escape to clear search/filters
      if (e.key === 'Escape') {
        handleClearAll();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [searchQuery, performSearch, handleClearAll]);

  // Focus search on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleViewOrderHistory = (customer) => {
    setSelectedCustomer(customer);
    setShowOrderHistory(true);
  };

  return (
    <div className="customer-tracker">
      {/* Header */}
      <div className="tracker-header">
        <h2>👥 Customer Tracker</h2>
      </div>

      {/* Stats Cards (always visible, compact) */}
      {stats && (
        <div className="compact-stats-wrapper">
          <div className="customer-stats-cards">
            <div 
              className={`stat-card stat-total ${activeFilter === null && !hasSearched ? 'active' : ''}`}
              onClick={() => {
                if (activeFilter || hasSearched) {
                  handleClearAll();
                }
              }}
              style={{ cursor: 'pointer' }}
              title="Show all customers"
            >
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalCustomers}</div>
                <div className="stat-label">Total Customers</div>
              </div>
            </div>
            <div 
              className={`stat-card stat-success ${activeFilter === 'Active' ? 'active' : ''}`}
              onClick={() => handleQuickFilter('Active')}
              style={{ cursor: 'pointer' }}
              title="Filter: Active customers"
            >
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <div className="stat-value">{stats.activeCustomers}</div>
                <div className="stat-label">Active</div>
              </div>
            </div>
            <div 
              className={`stat-card stat-warning ${activeFilter === 'Inactive' ? 'active' : ''}`}
              onClick={() => handleQuickFilter('Inactive')}
              style={{ cursor: 'pointer' }}
              title="Filter: Inactive customers"
            >
              <div className="stat-icon">⏸️</div>
              <div className="stat-info">
                <div className="stat-value">{stats.inactiveCustomers}</div>
                <div className="stat-label">Inactive</div>
              </div>
            </div>
            <div 
              className={`stat-card stat-danger ${activeFilter === 'Blocked' ? 'active' : ''}`}
              onClick={() => handleQuickFilter('Blocked')}
              style={{ cursor: 'pointer' }}
              title="Filter: Blocked customers"
            >
              <div className="stat-icon">🚫</div>
              <div className="stat-info">
                <div className="stat-value">{stats.blockedCustomers}</div>
                <div className="stat-label">Blocked</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Search Bar - Centered */}
      <div className="tracker-search-container">
        <div className="search-bar-with-field-selector">
          {/* Field Selector */}
                <select
                  className="field-selector"
                  value={searchType}
                  onChange={(e) => {
                    setSearchType(e.target.value);
                    setIsFieldManuallySelected(true); // Mark as manually selected
                  }}
                >
                  <option value="phoneNumber">📞 Phone Number</option>
                  <option value="customerId">👤 Customer ID</option>
                  <option value="customerName">📝 Customer Name</option>
                </select>

          {/* Search Bar */}
          <div className="smart-search-bar">
            <div className="search-icon">🔍</div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  performSearch();
                }
              }}
              placeholder={getPlaceholder(searchType, 'customer')}
              className="smart-search-input"
              autoComplete="off"
              spellCheck="false"
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => {
                  setSearchQuery('');
                  setHasSearched(false);
                  setCustomers([]);
                  setIsFieldManuallySelected(false); // Reset manual selection flag when clearing
                  searchInputRef.current?.focus();
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
            {isSearching && (
              <div className="search-loading-indicator">⏳</div>
            )}
            <button
              className="search-button"
              onClick={performSearch}
              disabled={isSearching || !searchQuery.trim()}
              title="Search"
            >
              {isSearching ? '⏳' : '🔍'}
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="quick-filters">
          <button
            className={`quick-filter-btn ${activeFilter === 'Active' ? 'active' : ''}`}
            onClick={() => handleQuickFilter('Active')}
            title="Active Customers"
          >
            ✅ Active
          </button>
          <button
            className={`quick-filter-btn ${activeFilter === 'Inactive' ? 'active' : ''}`}
            onClick={() => handleQuickFilter('Inactive')}
            title="Inactive Customers"
          >
            ⏸️ Inactive
          </button>
          {(activeFilter || hasSearched) && (
            <button
              className="quick-filter-btn clear-all-btn"
              onClick={handleClearAll}
              title="Clear all filters and return to home"
            >
              🏠 Clear All
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="tracker-results">
        {!hasSearched && !activeFilter && !searchQuery.trim() ? (
          // No results to show - just stats cards and search bar are visible
          null
        ) : loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="no-results-state">
            <div className="empty-icon">🔍</div>
            <h3>No Customers Found</h3>
            <p>Try different keywords or check your search query</p>
            <button
              className="btn btn-secondary"
              onClick={handleClearAll}
            >
              🏠 Clear All & Return Home
            </button>
          </div>
        ) : (
          <>
            <div className="customers-list">
              {customers.map((customer) => (
                <div key={customer._id} className="customer-card">
                <div className="customer-header">
                  <div className="customer-name-section">
                    <h3>{customer.name}</h3>
                    {customer.customerId && (
                      <span className="customer-id">{customer.customerId}</span>
                    )}
                  </div>
                  <span className={`status-badge status-${customer.status?.toLowerCase() || 'active'}`}>
                    {customer.status || 'Active'}
                  </span>
                </div>
                <div className="customer-details">
                  <div className="detail-item">
                    <span className="detail-label">📞 Phone:</span>
                    <span className="detail-value">{customer.phoneNumber}</span>
                  </div>
                  {customer.email && (
                    <div className="detail-item">
                      <span className="detail-label">📧 Email:</span>
                      <span className="detail-value">{customer.email}</span>
                    </div>
                  )}
                  {(customer.address || customer.city) && (
                    <div className="detail-item">
                      <span className="detail-label">📍 Address:</span>
                      <span className="detail-value">
                        {customer.address || ''}
                        {customer.city && `, ${customer.city}`}
                        {customer.state && `, ${customer.state}`}
                      </span>
                    </div>
                  )}
                  <div className="customer-stats">
                    <div className="mini-stat">
                      <span className="mini-stat-label">Orders:</span>
                      <span className="mini-stat-value">{customer.totalOrders || 0}</span>
                    </div>
                    <div className="mini-stat">
                      <span className="mini-stat-label">Spent:</span>
                      <span className="mini-stat-value">₹{(customer.totalSpent || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="customer-actions">
                  <button
                    className="btn btn-info btn-sm"
                    onClick={() => handleViewOrderHistory(customer)}
                    title="View Order History"
                  >
                    📊 History
                  </button>
                  {onCustomerEdit && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onCustomerEdit(customer)}
                      title="Edit Customer"
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
            </div>
            {pagination && pagination.pages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.pages}
                totalRecords={pagination.total}
                onPageChange={(page) => {
                  if (activeFilter) {
                    handleQuickFilter(activeFilter, page);
                  } else {
                    performSearch(page);
                  }
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Customer Order History Modal */}
      {showOrderHistory && selectedCustomer && (
        <CustomerOrderHistory
          customer={selectedCustomer}
          onClose={() => {
            setShowOrderHistory(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
};

export default CustomerTracker;

