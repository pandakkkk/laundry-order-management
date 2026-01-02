import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import './App.css';
import OrderTracker from './components/OrderTracker';
import InteractiveOrderForm from './components/InteractiveOrderForm';
import OrderDetails from './components/OrderDetails';
import CustomerTracker from './components/CustomerTracker';
import CustomerForm from './components/CustomerForm';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { usePermissions } from './context/PermissionsContext';
import { PERMISSIONS } from './config/permissions';
import api from './services/api';

function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const { can } = usePermissions();
  const [orderStats, setOrderStats] = useState(null);
  const [customerStats, setCustomerStats] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  // Fetch order stats
  const fetchOrderStats = useCallback(async () => {
    try {
      const data = await api.getOrderStats();
      setOrderStats(data.data);
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  }, []);

  // Fetch customer stats
  const fetchCustomerStats = useCallback(async () => {
    try {
      const data = await api.getCustomerStats();
      setCustomerStats(data.data);
    } catch (error) {
      console.error('Error fetching customer stats:', error);
    }
  }, []);

  // Load stats on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrderStats();
      fetchCustomerStats();
    }
  }, [isAuthenticated, fetchOrderStats, fetchCustomerStats]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      fetchOrderStats(); // Refresh stats
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
      setShowOrderForm(false);
      fetchOrderStats(); // Refresh stats
      alert('Order created successfully!');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order: ' + (error.response?.data?.error || error.message));
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
              <button className="btn btn-primary" onClick={() => setShowOrderForm(!showOrderForm)}>
                {showOrderForm ? 'Close Form' : '+ New Order'}
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
        {showOrderForm && (
          <div className="interactive-form-overlay">
            <InteractiveOrderForm onSubmit={handleCreateOrder} onCancel={() => setShowOrderForm(false)} />
          </div>
        )}

        <OrderTracker
          stats={orderStats}
          onOrderSelect={setSelectedOrder}
          onStatusUpdate={handleStatusUpdate}
          onRefresh={fetchOrderStats}
          showForm={showOrderForm}
          onToggleForm={() => setShowOrderForm(!showOrderForm)}
        />

        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusUpdate={handleStatusUpdate}
            onDelete={async (orderId) => {
              if (!window.confirm('Are you sure you want to delete this order?')) {
                return;
              }
              try {
                await api.deleteOrder(orderId);
                setSelectedOrder(null);
                fetchOrderStats();
                alert('Order deleted successfully');
              } catch (error) {
                console.error('Error deleting order:', error);
                alert('Failed to delete order');
              }
            }}
          />
        )}
      </main>
    </>
  );

  const handleCustomerEdit = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleCustomerDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      await api.deleteCustomer(customerId);
      fetchCustomerStats();
      alert('Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer');
    }
  };

  const handleCustomerSubmit = async (customerData) => {
    try {
      if (selectedCustomer) {
        await api.updateCustomer(selectedCustomer._id, customerData);
        alert('Customer updated successfully!');
      } else {
        await api.createCustomer(customerData);
        alert('Customer created successfully!');
      }
      setShowCustomerForm(false);
      setSelectedCustomer(null);
      fetchCustomerStats();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer: ' + (error.response?.data?.error || error.message));
    }
  };

  const CustomerPage = () => (
    <>
      <AppHeader />
      <main className="app-main">
        {showCustomerForm && (
          <div className="interactive-form-overlay">
            <CustomerForm
              customer={selectedCustomer}
              onSubmit={handleCustomerSubmit}
              onClose={() => {
                setShowCustomerForm(false);
                setSelectedCustomer(null);
              }}
            />
          </div>
        )}

        <CustomerTracker
          stats={customerStats}
          onCustomerSelect={setSelectedCustomer}
          onCustomerEdit={handleCustomerEdit}
          onCustomerDelete={handleCustomerDelete}
        />
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

