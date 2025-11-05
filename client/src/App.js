import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import InteractiveOrderForm from './components/InteractiveOrderForm';
import OrderDetails from './components/OrderDetails';
import CustomerManagement from './components/CustomerManagement';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { usePermissions } from './context/PermissionsContext';
import { PERMISSIONS } from './config/permissions';
import api from './services/api';

function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const { can } = usePermissions();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchField, setSearchField] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Stable functions using useCallback
  const fetchOrders = useCallback(async (page = 1) => {
    try {
      const params = { 
        page,
        limit: 20,
        ...(filterStatus && { status: filterStatus })
      };
      const data = await api.getOrders(params);
      setOrders(data.data);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getOrderStats();
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      fetchOrders(1); // Reset to page 1 when clearing search
      return;
    }

    try {
      setIsSearching(true);
      // Search ALL records (no pagination on search)
      const data = await api.searchOrders(searchQuery, searchField);
      setOrders(data.data);
      setPagination(null); // Clear pagination when searching
    } catch (error) {
      console.error('Error searching orders:', error);
      alert('Search failed. Please try again.');
      // If search fails, fall back to all orders
      fetchOrders(1);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchField, fetchOrders]);

  // Initial load and auto-refresh
  useEffect(() => {
    if (isAuthenticated) {
      // Only fetch if not in search mode
      if (!searchQuery.trim()) {
        fetchOrders(currentPage);
      }
      fetchStats();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchStats();
        // Only refresh orders if not in search mode
        if (!searchQuery.trim()) {
          fetchOrders(currentPage);
        }
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, filterStatus, searchQuery, currentPage, fetchOrders, fetchStats]);

  const handleSearchInputChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const handleSearchClick = useCallback(() => {
    performSearch();
  }, [performSearch]);
  
  const handleFieldChange = useCallback((field) => {
    setSearchField(field);
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      fetchOrders(currentPage); // Stay on current page
      fetchStats();
      if (selectedOrder && selectedOrder._id === orderId) {
        const updatedOrder = await api.getOrderById(orderId);
        setSelectedOrder(updatedOrder.data);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status');
    }
  };

  const handleCreateOrder = async (orderData) => {
    try {
      await api.createOrder(orderData);
      setShowForm(false);
      fetchOrders(1); // Go to first page after creating
      fetchStats();
      alert('Order created successfully!');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }
    
    try {
      await api.deleteOrder(orderId);
      setSelectedOrder(null);
      fetchOrders(currentPage); // Stay on current page
      fetchStats();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  };

  const AppHeader = () => {
    const location = useLocation();
    
    return (
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🧺 Laundry Order Monitoring</h1>
            <nav className="main-nav">
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                📦 Orders
              </Link>
              {can(PERMISSIONS.CUSTOMER_VIEW) && (
                <Link 
                  to="/customers" 
                  className={`nav-link ${location.pathname === '/customers' ? 'active' : ''}`}
                >
                  👥 Customers
                </Link>
              )}
            </nav>
          </div>
          <div className="header-actions">
            {user && (
              <div className="user-info">
                <span className="user-name">👤 {user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
            )}
            {location.pathname === '/' && can(PERMISSIONS.ORDER_CREATE) && (
              <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Close Form' : '+ New Order'}
              </button>
            )}
            <button className="btn btn-secondary" onClick={logout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </header>
    );
  };

  const DashboardPage = () => (
    <>
      <AppHeader />

      <main className="app-main">
        {showForm && (
          <div className="interactive-form-overlay">
            <InteractiveOrderForm onSubmit={handleCreateOrder} onCancel={() => setShowForm(false)} />
          </div>
        )}

        <Dashboard
          orders={orders}
          stats={stats}
          loading={loading}
          filterStatus={filterStatus}
          searchQuery={searchQuery}
          isSearching={isSearching}
          searchField={searchField}
          pagination={pagination}
          currentPage={currentPage}
          onFilterChange={setFilterStatus}
          onSearchInputChange={handleSearchInputChange}
          onSearchClick={handleSearchClick}
          onFieldChange={handleFieldChange}
          onOrderSelect={setSelectedOrder}
          onStatusUpdate={handleStatusUpdate}
          onRefresh={() => fetchOrders(currentPage)}
          onPageChange={fetchOrders}
        />

        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusUpdate={handleStatusUpdate}
            onDelete={handleDeleteOrder}
          />
        )}
      </main>
    </>
  );

  const CustomerPage = () => (
    <>
      <AppHeader />
      <main className="app-main">
        <CustomerManagement />
      </main>
    </>
  );

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/customers" element={
          <ProtectedRoute>
            <CustomerPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;

