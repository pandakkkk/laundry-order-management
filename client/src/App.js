import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import './App.css';
import OrderTracker from './components/OrderTracker';
import InteractiveOrderForm from './components/InteractiveOrderForm';
import OrderDetails from './components/OrderDetails';
import CustomerTracker from './components/CustomerTracker';
import CustomerForm from './components/CustomerForm';
import UserManagement from './components/UserManagement';
import DeliveryDashboard from './components/DeliveryDashboard';
import OperationsDashboard from './components/OperationsDashboard';
import DryCleanerDashboard from './components/DryCleanerDashboard';
import LinenTrackerDashboard from './components/LinenTrackerDashboard';
import BackOfficeDashboard from './components/BackOfficeDashboard';
import FrontdeskDashboard from './components/FrontdeskDashboard';
import ReportsDashboard from './components/ReportsDashboard';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ReceiptModal from './components/ReceiptModal';
import OrderQRView from './components/OrderQRView';
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
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

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
      // Extract notification preference before creating order
      const notificationType = orderData.sendNotification;
      delete orderData.sendNotification; // Remove from order data
      
      const response = await api.createOrder(orderData);
      setShowOrderForm(false);
      fetchOrderStats(); // Refresh stats
      
      // Show receipt modal with the created order
      setCreatedOrder(response.data);
      setShowReceiptModal(true);
      
      // Send WhatsApp/SMS notification if enabled
      if (notificationType && notificationType !== 'none') {
        try {
          await api.sendOrderNotification(response.data._id, 'confirmation', notificationType);
          console.log(`✅ ${notificationType} notification sent successfully`);
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
          // Don't block the flow if notification fails
        }
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    setCreatedOrder(null);
  };


  const AppHeader = () => {
    const location = useLocation();
    
    return (
      <header className="app-header">
        {/* Top Row: Title + User Info + Actions */}
        <div className="header-top">
          <h1>🧺 Laundry Management</h1>
          <div className="header-actions">
            {user && (
              <div className="user-info">
                <span className="user-name">👤 {user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
            )}
            {can(PERMISSIONS.ORDER_CREATE) && user?.role !== 'manager' && user?.role !== 'backoffice' && (user?.role === 'frontdesk' || location.pathname === '/') && (
              <button className="btn btn-primary" onClick={() => setShowOrderForm(!showOrderForm)}>
                {showOrderForm ? 'Close Form' : '+ New Order'}
              </button>
            )}
            <button className="btn btn-secondary" onClick={logout}>
              🚪 Logout
            </button>
          </div>
        </div>
        
        {/* Bottom Row: Navigation */}
        <nav className="main-nav">
          {/* Manager only sees Operations */}
          {user?.role === 'manager' ? (
            <Link 
              to="/operations" 
              className={`nav-link ${location.pathname === '/operations' ? 'active' : ''}`}
            >
              🏭 Operations
            </Link>
          ) : user?.role === 'drycleaner' ? (
            /* Dry Cleaner only sees Dry Cleaner Dashboard */
            <Link 
              to="/drycleaner" 
              className={`nav-link ${location.pathname === '/drycleaner' ? 'active' : ''}`}
            >
              🫧 Dry Cleaner
            </Link>
          ) : user?.role === 'linentracker' ? (
            /* Linen Tracker only sees Linen Tracker Dashboard */
            <Link 
              to="/linentracker" 
              className={`nav-link ${location.pathname === '/linentracker' ? 'active' : ''}`}
            >
              📋 Linen Tracker
            </Link>
          ) : user?.role === 'backoffice' ? (
            /* Back Office only sees Back Office Dashboard */
            <Link 
              to="/backoffice" 
              className={`nav-link ${location.pathname === '/backoffice' ? 'active' : ''}`}
            >
              🏢 Back Office
            </Link>
          ) : user?.role === 'frontdesk' ? (
            /* Frontdesk sees Orders, Customers, and Frontdesk Dashboard */
            <>
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                📦 Orders
              </Link>
              <Link 
                to="/customers" 
                className={`nav-link ${location.pathname === '/customers' ? 'active' : ''}`}
              >
                👥 Customers
              </Link>
              <Link 
                to="/frontdesk" 
                className={`nav-link ${location.pathname === '/frontdesk' ? 'active' : ''}`}
              >
                🎫 Operations
              </Link>
            </>
          ) : (
            <>
          {/* Hide Orders for delivery role - they only see Delivery section */}
          {user?.role !== 'delivery' && (
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              📦 Orders
            </Link>
          )}
          {/* Hide Customers for delivery role */}
          {can(PERMISSIONS.CUSTOMER_VIEW) && user?.role !== 'delivery' && (
            <Link 
              to="/customers" 
              className={`nav-link ${location.pathname === '/customers' ? 'active' : ''}`}
            >
              👥 Customers
            </Link>
          )}
          {can(PERMISSIONS.USER_VIEW) && (
            <Link 
              to="/users" 
              className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}
            >
              🔐 Users
            </Link>
          )}
          {can(PERMISSIONS.DELIVERY_VIEW) && (
            <Link 
              to="/delivery" 
              className={`nav-link ${location.pathname === '/delivery' ? 'active' : ''}`}
            >
              🚴 Delivery
            </Link>
          )}
          {can(PERMISSIONS.REPORTS_VIEW) && user?.role !== 'delivery' && (
            <Link 
              to="/reports" 
              className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`}
            >
              📊 Reports
            </Link>
              )}
            </>
          )}
        </nav>
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

        {/* Receipt Modal - shows after order creation */}
        {showReceiptModal && createdOrder && (
          <ReceiptModal
            order={createdOrder}
            onClose={handleCloseReceiptModal}
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
        {/* Order Form for frontdesk users */}
        {showOrderForm && user?.role === 'frontdesk' && (
          <div className="interactive-form-overlay">
            <InteractiveOrderForm onSubmit={handleCreateOrder} onCancel={() => setShowOrderForm(false)} />
          </div>
        )}

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

  const UserManagementPage = () => (
    <>
      <AppHeader />
      <main className="app-main">
        <UserManagement />
      </main>
    </>
  );

  const DeliveryPage = () => (
    <>
      <AppHeader />
      <main className="app-main delivery-main">
        <DeliveryDashboard />
      </main>
    </>
  );

  const OperationsPage = () => (
    <>
      <AppHeader />
      <main className="app-main operations-main">
        <OperationsDashboard />
      </main>
    </>
  );

  const DryCleanerPage = () => (
    <>
      <AppHeader />
      <main className="app-main drycleaner-main">
        <DryCleanerDashboard />
      </main>
    </>
  );

  const LinenTrackerPage = () => (
    <>
      <AppHeader />
      <main className="app-main linentracker-main">
        <LinenTrackerDashboard />
      </main>
    </>
  );

  const BackOfficePage = () => (
    <>
      <AppHeader />
      <main className="app-main backoffice-main">
        <BackOfficeDashboard />
      </main>
    </>
  );

  const FrontdeskPage = () => (
    <>
      <AppHeader />
      <main className="app-main frontdesk-main">
        {/* Order Form for frontdesk users */}
        {showOrderForm && (
          <div className="interactive-form-overlay">
            <InteractiveOrderForm onSubmit={handleCreateOrder} onCancel={() => setShowOrderForm(false)} />
          </div>
        )}
        <FrontdeskDashboard />
      </main>
    </>
  );

  const ReportsPage = () => (
    <>
      <AppHeader />
      <main className="app-main">
        <ReportsDashboard />
      </main>
    </>
  );

  // Track Order Page - for QR code scanning
  const TrackOrderPage = () => (
    <>
      <AppHeader />
      <main className="app-main">
        <OrderQRView />
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
            {/* Redirect specialized roles to their dashboards */}
            {user?.role === 'manager' ? <Navigate to="/operations" replace /> : 
             user?.role === 'drycleaner' ? <Navigate to="/drycleaner" replace /> :
             user?.role === 'linentracker' ? <Navigate to="/linentracker" replace /> :
             user?.role === 'backoffice' ? <Navigate to="/backoffice" replace /> :
             user?.role === 'delivery' ? <Navigate to="/delivery" replace /> : <DashboardPage />}
          </ProtectedRoute>
        } />
        <Route path="/customers" element={
          <ProtectedRoute>
            {/* Block specialized roles */}
            {user?.role === 'manager' ? <Navigate to="/operations" replace /> :
             user?.role === 'drycleaner' ? <Navigate to="/drycleaner" replace /> :
             user?.role === 'linentracker' ? <Navigate to="/linentracker" replace /> :
             user?.role === 'backoffice' ? <Navigate to="/backoffice" replace /> :
             user?.role === 'delivery' ? <Navigate to="/delivery" replace /> : <CustomerPage />}
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute>
            {/* Block specialized roles */}
            {user?.role === 'manager' ? <Navigate to="/operations" replace /> : 
             user?.role === 'drycleaner' ? <Navigate to="/drycleaner" replace /> :
             user?.role === 'linentracker' ? <Navigate to="/linentracker" replace /> :
             user?.role === 'backoffice' ? <Navigate to="/backoffice" replace /> :
             user?.role === 'frontdesk' ? <Navigate to="/frontdesk" replace /> :
             user?.role === 'delivery' ? <Navigate to="/delivery" replace /> : <UserManagementPage />}
          </ProtectedRoute>
        } />
        <Route path="/delivery" element={
          <ProtectedRoute>
            {/* Block specialized roles */}
            {user?.role === 'manager' ? <Navigate to="/operations" replace /> : 
             user?.role === 'drycleaner' ? <Navigate to="/drycleaner" replace /> :
             user?.role === 'linentracker' ? <Navigate to="/linentracker" replace /> :
             user?.role === 'backoffice' ? <Navigate to="/backoffice" replace /> : <DeliveryPage />}
          </ProtectedRoute>
        } />
        <Route path="/operations" element={
          <ProtectedRoute>
            {user?.role === 'manager' ? <OperationsPage /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        } />
        <Route path="/drycleaner" element={
          <ProtectedRoute>
            {user?.role === 'drycleaner' ? <DryCleanerPage /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        } />
        <Route path="/linentracker" element={
          <ProtectedRoute>
            {user?.role === 'linentracker' ? <LinenTrackerPage /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        } />
        <Route path="/backoffice" element={
          <ProtectedRoute>
            {user?.role === 'backoffice' ? <BackOfficePage /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        } />
        <Route path="/frontdesk" element={
          <ProtectedRoute>
            {user?.role === 'frontdesk' ? <FrontdeskPage /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            {/* Block specialized roles */}
            {user?.role === 'manager' ? <Navigate to="/operations" replace /> : 
             user?.role === 'drycleaner' ? <Navigate to="/drycleaner" replace /> :
             user?.role === 'linentracker' ? <Navigate to="/linentracker" replace /> :
             user?.role === 'backoffice' ? <Navigate to="/backoffice" replace /> :
             user?.role === 'delivery' ? <Navigate to="/delivery" replace /> : <ReportsPage />}
          </ProtectedRoute>
        } />
        <Route path="/order/:orderId" element={
          <ProtectedRoute>
            <TrackOrderPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;

