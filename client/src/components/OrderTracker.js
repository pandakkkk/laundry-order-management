import React, { useState, useEffect, useCallback, useRef } from 'react';
import './OrderTracker.css';
import { detectSearchType, getPlaceholder } from '../utils/smartSearch';
import api from '../services/api';
import OrderTable from './OrderTable';
import StatsCards from './StatsCards';
import QRScanner from './QRScanner';

const OrderTracker = ({
  stats,
  onOrderSelect,
  onStatusUpdate,
  onRefresh,
  showForm,
  onToggleForm
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('ticketNumber'); // Default to ticket number
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null); // Track active filter
  const [isFieldManuallySelected, setIsFieldManuallySelected] = useState(false); // Track if user manually selected field
  const [showQRScanner, setShowQRScanner] = useState(false); // QR Scanner modal state
  const searchInputRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Auto-detect search type when query changes (only if user hasn't manually selected a field)
  useEffect(() => {
    // Only auto-detect if user hasn't manually selected a field
    if (searchQuery.trim() && !isFieldManuallySelected) {
      const detected = detectSearchType(searchQuery);
      // Only auto-update if detected type is valid and different from current
      if (detected !== 'all' && detected !== searchType) {
        setSearchType(detected);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, isFieldManuallySelected]); // searchType intentionally excluded to avoid infinite loop

  // Manual search (only when user clicks search or presses Enter)
  const performSearch = useCallback(async () => {
    if (isFetchingRef.current) return;
    
    const query = searchQuery.trim();
    if (!query) {
      setOrders([]);
      setHasSearched(false);
      setActiveFilter(null);
      return;
    }

    try {
      isFetchingRef.current = true;
      setIsSearching(true);
      setHasSearched(true);
      setActiveFilter(null); // Clear active filter when searching
      
      const data = await api.searchOrders(query, searchType);
      setOrders(data.data || []);
    } catch (error) {
      console.error('Error searching orders:', error);
      setOrders([]);
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
  const handleQuickFilter = async (filter) => {
    // If clicking the same filter, clear it
    if (activeFilter === filter) {
      setActiveFilter(null);
      setHasSearched(false);
      setOrders([]);
      setSearchQuery('');
      return;
    }
    
    setActiveFilter(filter);
    setSearchQuery('');
    setHasSearched(true);
    setLoading(true);
    
    try {
      let params = {};
      
      switch (filter) {
        case 'today':
          params.today = true;
          break;
        case 'ready':
          params.status = 'Ready for Pickup';
          break;
        case 'inprocess':
          params.inProcess = true;
          break;
        case 'recent':
          // Last 24 hours
          const yesterday = new Date();
          yesterday.setHours(yesterday.getHours() - 24);
          params.startDate = yesterday.toISOString();
          break;
        default:
          break;
      }
      
      const data = await api.getOrders(params);
      setOrders(data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Clear all filters and return to empty state
  const handleClearAll = () => {
    setActiveFilter(null);
    setSearchQuery('');
    setHasSearched(false);
    setOrders([]);
    searchInputRef.current?.focus();
  };

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
  }, [searchQuery, performSearch]);

  // Focus search on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Handle QR Scan result
  const handleQRScan = useCallback(async (scanResult) => {
    setShowQRScanner(false);
    
    try {
      setLoading(true);
      setHasSearched(true);
      
      let order = null;
      
      if (scanResult.orderId) {
        // Direct order ID lookup
        const result = await api.getOrderById(scanResult.orderId);
        order = result.data;
      } else if (scanResult.ticketNumber) {
        // Ticket number lookup
        const result = await api.getOrderByTicketNumber(scanResult.ticketNumber);
        order = result.data;
      }
      
      if (order) {
        // Show the order directly
        onOrderSelect(order);
        setSearchQuery(scanResult.ticketNumber || '');
        setOrders([order]);
      } else {
        alert('Order not found. Please try again.');
      }
    } catch (error) {
      console.error('QR Scan lookup error:', error);
      alert('Failed to find order: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  }, [onOrderSelect]);

  return (
    <div className="order-tracker">
      {/* Header */}
      <div className="tracker-header">
        <h2>🎫 Order Tracker</h2>
        {showForm && (
          <button className="btn btn-secondary btn-sm" onClick={onToggleForm}>
            Close Form
          </button>
        )}
      </div>

      {/* Stats Cards (always visible, compact) */}
      {stats && (
        <div className="compact-stats-wrapper">
          <StatsCards stats={stats} onFilterChange={(filter) => {
            if (filter) {
              // Map filter values to quick filter keys
              const filterMap = {
                'TODAY': 'today',
                'IN_PROCESS': 'inprocess',
                'Ready for Pickup': 'ready'
              };
              const quickFilter = filterMap[filter] || filter.toLowerCase();
              handleQuickFilter(quickFilter);
            }
          }} currentFilter={activeFilter || ''} />
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
            <option value="ticketNumber">🎫 Ticket Number</option>
            <option value="phoneNumber">📞 Phone Number</option>
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
              placeholder={getPlaceholder(searchType, 'order')}
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
                  setOrders([]);
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

          {/* QR Scanner Button */}
          <button
            className="qr-scan-button"
            onClick={() => setShowQRScanner(true)}
            title="Scan QR Code / Barcode"
          >
            📷 Scan
          </button>
        </div>

        {/* Quick Filters */}
        <div className="quick-filters">
          <button
            className={`quick-filter-btn ${activeFilter === 'today' ? 'active' : ''}`}
            onClick={() => handleQuickFilter('today')}
            title="Today's Orders"
          >
            📅 Today
          </button>
          <button
            className={`quick-filter-btn ${activeFilter === 'ready' ? 'active' : ''}`}
            onClick={() => handleQuickFilter('ready')}
            title="Ready for Pickup"
          >
            ✅ Ready
          </button>
          <button
            className={`quick-filter-btn ${activeFilter === 'inprocess' ? 'active' : ''}`}
            onClick={() => handleQuickFilter('inprocess')}
            title="In Process Orders"
          >
            🔄 In Process
          </button>
          <button
            className={`quick-filter-btn ${activeFilter === 'recent' ? 'active' : ''}`}
            onClick={() => handleQuickFilter('recent')}
            title="Recent Orders (24h)"
          >
            ⏰ Recent
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
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="no-results-state">
            <div className="empty-icon">🔍</div>
            <h3>No Orders Found</h3>
            <p>Try different keywords or check your search query</p>
            <button
              className="btn btn-secondary"
              onClick={handleClearAll}
            >
              🏠 Clear All & Return Home
            </button>
          </div>
        ) : (
          <OrderTable
            orders={orders}
            loading={false}
            pagination={null}
            currentPage={1}
            onOrderSelect={onOrderSelect}
            onStatusUpdate={onStatusUpdate}
            onPageChange={() => {}}
          />
        )}
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};

export default OrderTracker;

