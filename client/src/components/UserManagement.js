import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'password'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff',
    department: 'Operations'
  });
  const [stats, setStats] = useState(null);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.isActive = filterStatus;
      
      const response = await api.getUsers(params);
      if (response.success) {
        setUsers(response.users);
      }
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterRole, filterStatus]);

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const response = await api.getRoles();
      if (response.success) {
        setRoles(response.roles);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.getUserStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchStats();
  }, [fetchUsers, fetchRoles, fetchStats]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Open create modal
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'staff',
      department: 'Operations'
    });
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role,
      department: user.department || 'Operations'
    });
    setShowModal(true);
  };

  // Open password reset modal
  const openPasswordModal = (user) => {
    setModalMode('password');
    setSelectedUser(user);
    setFormData(prev => ({ ...prev, password: '' }));
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (modalMode === 'create') {
        const response = await api.createUser(formData);
        if (response.success) {
          fetchUsers();
          fetchStats();
          setShowModal(false);
        }
      } else if (modalMode === 'edit') {
        const updateData = {
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          department: formData.department
        };
        const response = await api.updateUser(selectedUser._id, updateData);
        if (response.success) {
          fetchUsers();
          setShowModal(false);
        }
      } else if (modalMode === 'password') {
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
        const response = await api.resetUserPassword(selectedUser._id, formData.password);
        if (response.success) {
          setShowModal(false);
          alert('Password reset successfully!');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  // Toggle user status
  const handleToggleStatus = async (user) => {
    if (!window.confirm(`Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} ${user.name}?`)) {
      return;
    }

    try {
      const response = await api.toggleUserStatus(user._id);
      if (response.success) {
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle status');
    }
  };

  // Delete user
  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to DELETE ${user.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.deleteUser(user._id);
      if (response.success) {
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  // Get role badge
  const getRoleBadge = (role) => {
    const roleInfo = roles.find(r => r.value === role);
    if (!roleInfo) return { name: role, color: '#6B7280', icon: '👤' };
    return roleInfo;
  };

  const departments = ['Operations', 'HR', 'Finance', 'Delivery', 'Customer Service', 'Management'];

  return (
    <div className="user-management">
      {/* Header */}
      <div className="um-header">
        <div className="um-header-left">
          <h1>👥 User Management</h1>
          <p>Manage employees and their access levels</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          ➕ Add New User
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="um-stats">
          <div className="um-stat-card">
            <span className="um-stat-icon">👥</span>
            <div className="um-stat-info">
              <span className="um-stat-value">{stats.total}</span>
              <span className="um-stat-label">Total Users</span>
            </div>
          </div>
          <div className="um-stat-card active">
            <span className="um-stat-icon">✅</span>
            <div className="um-stat-info">
              <span className="um-stat-value">{stats.active}</span>
              <span className="um-stat-label">Active</span>
            </div>
          </div>
          <div className="um-stat-card inactive">
            <span className="um-stat-icon">🚫</span>
            <div className="um-stat-info">
              <span className="um-stat-value">{stats.inactive}</span>
              <span className="um-stat-label">Inactive</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="um-filters">
        <div className="um-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="um-filter-select"
        >
          <option value="">All Roles</option>
          {roles.map(role => (
            <option key={role.value} value={role.value}>
              {role.icon} {role.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="um-filter-select"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Error Message */}
      {error && <div className="um-error">{error}</div>}

      {/* Users Table */}
      <div className="um-table-container">
        {loading ? (
          <div className="um-loading">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="um-empty">No users found</div>
        ) : (
          <table className="um-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const roleInfo = getRoleBadge(user.role);
                return (
                  <tr key={user._id} className={!user.isActive ? 'inactive-row' : ''}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar" style={{ backgroundColor: roleInfo.color }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                          <span className="user-name">{user.name}</span>
                          <span className="user-email">{user.email}</span>
                          {user.phone && <span className="user-phone">📞 {user.phone}</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="role-badge" 
                        style={{ backgroundColor: `${roleInfo.color}20`, color: roleInfo.color }}
                      >
                        {roleInfo.icon} {roleInfo.name}
                      </span>
                    </td>
                    <td>
                      <span className="department-badge">{user.department || 'Operations'}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? '✅ Active' : '🚫 Inactive'}
                      </span>
                    </td>
                    <td>
                      {user.lastLogin ? (
                        <span className="last-login">
                          {new Date(user.lastLogin).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      ) : (
                        <span className="never-login">Never</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-action edit" 
                          onClick={() => openEditModal(user)}
                          title="Edit User"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-action password" 
                          onClick={() => openPasswordModal(user)}
                          title="Reset Password"
                        >
                          🔑
                        </button>
                        <button 
                          className="btn-action toggle" 
                          onClick={() => handleToggleStatus(user)}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? '🚫' : '✅'}
                        </button>
                        <button 
                          className="btn-action delete" 
                          onClick={() => handleDelete(user)}
                          title="Delete User"
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
        <div className="um-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h2>
                {modalMode === 'create' && '➕ Add New User'}
                {modalMode === 'edit' && '✏️ Edit User'}
                {modalMode === 'password' && '🔑 Reset Password'}
              </h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="um-modal-body">
                {error && <div className="um-form-error">{error}</div>}
                
                {modalMode !== 'password' && (
                  <>
                    <div className="um-form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter full name"
                      />
                    </div>
                    
                    <div className="um-form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled={modalMode === 'edit'}
                        placeholder="Enter email address"
                      />
                    </div>
                    
                    {modalMode === 'create' && (
                      <div className="um-form-group">
                        <label>Password *</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          minLength={6}
                          placeholder="Min 6 characters"
                        />
                      </div>
                    )}
                    
                    <div className="um-form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    <div className="um-form-row">
                      <div className="um-form-group">
                        <label>Role *</label>
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          required
                        >
                          {roles.map(role => (
                            <option key={role.value} value={role.value}>
                              {role.icon} {role.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="um-form-group">
                        <label>Department</label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                        >
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}
                
                {modalMode === 'password' && (
                  <div className="um-form-group">
                    <label>New Password for {selectedUser?.name} *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>
                )}
              </div>
              <div className="um-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'create' && 'Create User'}
                  {modalMode === 'edit' && 'Save Changes'}
                  {modalMode === 'password' && 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

