import React, { useState, useEffect, useCallback, useRef } from 'react';
import './CustomerManagement.css';
import CustomerForm from './CustomerForm';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../config/permissions';
import api from '../services/api';

const CustomerManagement = () => {
  const { can, loading: permissionsLoading } = usePermissions();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState(null);
  const isInitialMount = useRef(true);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: searchQuery,
        status: statusFilter,
        limit: 100
      };
      const response = await api.getCustomers(params);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      alert('Failed to load customers');
    } finally {
      setLoading(false);
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
      fetchCustomers();
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
        fetchCustomers();
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
      fetchCustomers();
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
      fetchCustomers();
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
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalCustomers}</div>
              <div className="stat-label">Total Customers</div>
            </div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">{stats.activeCustomers}</div>
              <div className="stat-label">Active</div>
            </div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-icon">⏸️</div>
            <div className="stat-info">
              <div className="stat-value">{stats.inactiveCustomers}</div>
              <div className="stat-label">Inactive</div>
            </div>
          </div>
          <div className="stat-card stat-danger">
            <div className="stat-icon">🚫</div>
            <div className="stat-info">
              <div className="stat-value">{stats.blockedCustomers}</div>
              <div className="stat-label">Blocked</div>
            </div>
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
        <button className="btn btn-secondary" onClick={fetchCustomers}>
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
                <th>Customer ID</th>
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
                    {customer.customerId ? (
                      <span className="customer-id">{customer.customerId}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
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
    </div>
  );
};

export default CustomerManagement;

