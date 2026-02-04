import React, { useState, useEffect, useCallback, useRef } from 'react';
import './CustomerManagement.css';
import CustomerForm from './CustomerForm';
import CustomerOrderHistory from './CustomerOrderHistory';
import { usePermissions } from '../context/PermissionsContext';
import { PERMISSIONS } from '../config/permissions';
import api from '../services/api';
import Pagination from './Pagination';

const CustomerManagement = () => {
  const { can, loading: permissionsLoading } = usePermissions();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const isInitialMount = useRef(true);
  const isFetchingRef = useRef(false);

  const fetchCustomers = useCallback(async (page = 1, skipLoading = false) => {
    // Prevent duplicate calls
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      if (!skipLoading) {
        setLoading(true);
      }
      
      const params = {
        page,
        limit: 20,
        search: searchQuery,
        status: statusFilter // Already capitalized
      };
      const response = await api.getCustomers(params);
      setCustomers(response.data);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching customers:', error);
      alert('Failed to load customers');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [searchQuery, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.getCustomerStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Initial load - wait for permissions to load, then fetch customers and stats
  useEffect(() => {
    if (!permissionsLoading && can(PERMISSIONS.CUSTOMER_VIEW)) {
      fetchCustomers(1);
      fetchStats();
    } else if (!permissionsLoading && !can(PERMISSIONS.CUSTOMER_VIEW)) {
      // Permissions loaded but user doesn't have access
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading]);

  // Debounced search - SKIP on initial mount, only run when user changes search/filter
  useEffect(() => {
    // Skip debounce on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      if (can(PERMISSIONS.CUSTOMER_VIEW)) {
        fetchCustomers(1); // Reset to page 1 when searching/filtering
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter]);

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setShowForm(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowForm(true);
  };

  const handleViewOrderHistory = (customer) => {
    setHistoryCustomer(customer);
    setShowOrderHistory(true);
  };

  const handleDeleteCustomer = async (customer) => {
    if (!can(PERMISSIONS.CUSTOMER_DELETE)) {
      alert('You do not have permission to delete customers');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete customer "${customer.name}"?`)) {
      return;
    }

    try {
      await api.deleteCustomer(customer._id);
      alert('Customer deleted successfully');
      fetchCustomers(currentPage);
      fetchStats();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert(error.response?.data?.error || 'Failed to delete customer');
    }
  };

  const handleSubmitForm = async (customerData) => {
    try {
      if (selectedCustomer) {
        await api.updateCustomer(selectedCustomer._id, customerData);
        alert('Customer updated successfully');
      } else {
        await api.createCustomer(customerData);
        alert('Customer created successfully');
      }
      setShowForm(false);
      setSelectedCustomer(null);
      fetchCustomers(1); // Go to first page after adding/updating
      fetchStats();
    } catch (error) {
      console.error('Error saving customer:', error);
      throw error;
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleStatCardClick = (status) => {
    // If clicking the same status, clear the filter
    if (statusFilter === status) {
      setStatusFilter('');
    } else {
      setStatusFilter(status);
    }
  };

  if (!can(PERMISSIONS.CUSTOMER_VIEW)) {
    return (
      <div className="permission-denied">
        <h2>🔒 Access Denied</h2>
        <p>You don't have permission to view customers.</p>
      </div>
    );
  }

  return (
    <div className="customer-management">
      {/* Header */}
      <div className="cm-header">
        <div className="cm-header-left">
          <h1>👥 Customer Management</h1>
          <p className="cm-subtitle">Manage your customer database</p>
        </div>
        <div className="cm-header-right">
          {can(PERMISSIONS.CUSTOMER_CREATE) && (
            <button className="btn btn-primary" onClick={handleAddCustomer}>
              + Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="cm-stats">
          <div 
            className={`stat-card clickable ${statusFilter === '' ? 'active' : ''}`}
            onClick={() => handleStatCardClick('')}
            title="Click to show all customers"
          >
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalCustomers}</div>
              <div className="stat-label">Total Customers</div>
            </div>
            {statusFilter === '' && <div className="active-indicator">●</div>}
          </div>
          <div 
            className={`stat-card stat-success clickable ${statusFilter === 'Active' ? 'active' : ''}`}
            onClick={() => handleStatCardClick('Active')}
            title="Click to filter active customers"
          >
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">{stats.activeCustomers}</div>
              <div className="stat-label">Active</div>
            </div>
            {statusFilter === 'Active' && <div className="active-indicator">●</div>}
          </div>
          <div 
            className={`stat-card stat-warning clickable ${statusFilter === 'Inactive' ? 'active' : ''}`}
            onClick={() => handleStatCardClick('Inactive')}
            title="Click to filter inactive customers"
          >
            <div className="stat-icon">⏸️</div>
            <div className="stat-info">
              <div className="stat-value">{stats.inactiveCustomers}</div>
              <div className="stat-label">Inactive</div>
            </div>
            {statusFilter === 'Inactive' && <div className="active-indicator">●</div>}
          </div>
          <div 
            className={`stat-card stat-danger clickable ${statusFilter === 'Blocked' ? 'active' : ''}`}
            onClick={() => handleStatCardClick('Blocked')}
            title="Click to filter blocked customers"
          >
            <div className="stat-icon">🚫</div>
            <div className="stat-info">
              <div className="stat-value">{stats.blockedCustomers}</div>
              <div className="stat-label">Blocked</div>
            </div>
            {statusFilter === 'Blocked' && <div className="active-indicator">●</div>}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="cm-filters">
        <div className="filter-group">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search by name, phone, email, address..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <div className="filter-group">
          <select 
            className="filter-select" 
            value={statusFilter} 
            onChange={handleStatusFilter}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
        <button className="btn btn-secondary" onClick={() => fetchCustomers(currentPage)}>
          🔄 Refresh
        </button>
      </div>

      {/* Customer Table */}
      <div className="cm-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No customers found</h3>
            <p>
              {searchQuery || statusFilter
                ? 'Try adjusting your filters'
                : 'Add your first customer to get started'}
            </p>
            {can(PERMISSIONS.CUSTOMER_CREATE) && !searchQuery && !statusFilter && (
              <button className="btn btn-primary" onClick={handleAddCustomer}>
                + Add First Customer
              </button>
            )}
          </div>
        ) : (
          <table className="cm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Address</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer._id}>
                  <td>
                    <div className="customer-name">
                      <strong>{customer.name}</strong>
                    </div>
                  </td>
                  <td>
                    <a href={`tel:${customer.phoneNumber}`} className="phone-link">
                      📞 {customer.phoneNumber}
                    </a>
                  </td>
                  <td>
                    {customer.email ? (
                      <a href={`mailto:${customer.email}`} className="email-link">
                        {customer.email}
                      </a>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <div className="customer-address">
                      {customer.address || customer.city ? (
                        <>
                          {customer.address && <div>{customer.address}</div>}
                          {customer.city && (
                            <div className="text-muted">
                              {customer.city}
                              {customer.state && `, ${customer.state}`}
                              {customer.pincode && ` - ${customer.pincode}`}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">{customer.totalOrders || 0}</span>
                  </td>
                  <td>
                    <span className="amount">₹{(customer.totalSpent || 0).toFixed(2)}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${customer.status.toLowerCase()}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {can(PERMISSIONS.CUSTOMER_VIEW) && (
                        <button
                          className="btn-icon btn-history"
                          onClick={() => handleViewOrderHistory(customer)}
                          title="View Order History"
                        >
                          📊
                        </button>
                      )}
                      {can(PERMISSIONS.CUSTOMER_UPDATE) && (
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEditCustomer(customer)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                      )}
                      {can(PERMISSIONS.CUSTOMER_DELETE) && (
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDeleteCustomer(customer)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {pagination && !loading && (
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.pages}
            totalRecords={pagination.total}
            onPageChange={fetchCustomers}
          />
        )}
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <CustomerForm
          customer={selectedCustomer}
          onSubmit={handleSubmitForm}
          onClose={() => {
            setShowForm(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {/* Customer Order History Modal */}
      {showOrderHistory && historyCustomer && (
        <CustomerOrderHistory
          customer={historyCustomer}
          onClose={() => {
            setShowOrderHistory(false);
            setHistoryCustomer(null);
          }}
        />
      )}
    </div>
  );
};

export default CustomerManagement;

