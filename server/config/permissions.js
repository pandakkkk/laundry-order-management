// Permission definitions for the laundry management system

const PERMISSIONS = {
  // Order Management
  ORDER_VIEW: 'order:view',
  ORDER_CREATE: 'order:create',
  ORDER_UPDATE: 'order:update',
  ORDER_DELETE: 'order:delete',
  ORDER_STATUS_UPDATE: 'order:status_update',
  
  // Financial
  FINANCIAL_VIEW: 'financial:view',
  FINANCIAL_REPORTS: 'financial:reports',
  
  // Customer Management
  CUSTOMER_VIEW: 'customer:view',
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',
  
  // User Management
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Special Operations
  ORDER_CANCEL: 'order:cancel',
  ORDER_REFUND: 'order:refund',
  ORDER_RETURN: 'order:return',
  
  // Delivery
  DELIVERY_VIEW: 'delivery:view',
  DELIVERY_UPDATE: 'delivery:update',
  
  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  
  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update'
};

// Role definitions with their permissions
const ROLES = {
  admin: {
    name: 'Admin',
    description: 'Full system access',
    permissions: Object.values(PERMISSIONS) // All permissions
  },
  
  manager: {
    name: 'Manager',
    description: 'Manage operations, view reports, handle issues',
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.ORDER_CREATE,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_STATUS_UPDATE,
      PERMISSIONS.ORDER_CANCEL,
      PERMISSIONS.ORDER_REFUND,
      PERMISSIONS.ORDER_RETURN,
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.CUSTOMER_CREATE,
      PERMISSIONS.CUSTOMER_UPDATE,
      PERMISSIONS.FINANCIAL_VIEW,
      PERMISSIONS.FINANCIAL_REPORTS,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.DELIVERY_VIEW,
      PERMISSIONS.USER_VIEW
    ]
  },
  
  staff: {
    name: 'Staff/Operator',
    description: 'Process orders, update order status',
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.ORDER_CREATE,
      PERMISSIONS.ORDER_STATUS_UPDATE,
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.CUSTOMER_CREATE
    ]
  },
  
  frontdesk: {
    name: 'Front Desk',
    description: 'Handle customer orders, pickups, and inquiries',
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.ORDER_CREATE,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_STATUS_UPDATE,
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.CUSTOMER_CREATE,
      PERMISSIONS.CUSTOMER_UPDATE,
      PERMISSIONS.FINANCIAL_VIEW
    ]
  },
  
  delivery: {
    name: 'Delivery Person',
    description: 'View and update delivery orders only',
    permissions: [
      PERMISSIONS.DELIVERY_VIEW,
      PERMISSIONS.DELIVERY_UPDATE,
      PERMISSIONS.ORDER_VIEW
    ]
  },
  
  accountant: {
    name: 'Accountant',
    description: 'View financial data and reports',
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.FINANCIAL_VIEW,
      PERMISSIONS.FINANCIAL_REPORTS,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT
    ]
  }
};

// Check if role has permission
const hasPermission = (role, permission) => {
  const roleConfig = ROLES[role];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(permission);
};

// Check if role has any of the permissions
const hasAnyPermission = (role, permissions) => {
  return permissions.some(permission => hasPermission(role, permission));
};

// Check if role has all permissions
const hasAllPermissions = (role, permissions) => {
  return permissions.every(permission => hasPermission(role, permission));
};

// Get all permissions for a role
const getRolePermissions = (role) => {
  const roleConfig = ROLES[role];
  return roleConfig ? roleConfig.permissions : [];
};

module.exports = {
  PERMISSIONS,
  ROLES,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions
};

