import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [roleInfo, setRoleInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPermissions();
    } else {
      setPermissions([]);
      setRoleInfo(null);
      setLoading(false);
    }
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

  return {
    permissions,
    roleInfo,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    role: user?.role
  };
};

