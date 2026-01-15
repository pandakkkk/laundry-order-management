import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const PermissionsContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [roleInfo, setRoleInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use relative path in production (Vercel), localhost in development
  const API_BASE_URL = process.env.REACT_APP_API_URL || 
    (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPermissions();
    } else {
      setPermissions([]);
      setRoleInfo(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const fetchPermissions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/permissions`);
      setPermissions(response.data.permissions);
      setRoleInfo(response.data.roleInfo);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...perms) => {
    return perms.some(perm => permissions.includes(perm));
  };

  const hasAllPermissions = (...perms) => {
    return perms.every(perm => permissions.includes(perm));
  };

  const can = hasPermission; // Alias for readability

  const value = {
    permissions,
    roleInfo,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    role: user?.role
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

