// Permission definitions for the laundry management system
// =========================================================

const PERMISSIONS = {
  // Order Management
  ORDER_VIEW: 'order:view',
  ORDER_CREATE: 'order:create',
  ORDER_UPDATE: 'order:update',
  ORDER_DELETE: 'order:delete',
  ORDER_STATUS_UPDATE: 'order:status_update',
  ORDER_ASSIGN: 'order:assign',
  
  // Financial
  FINANCIAL_VIEW: 'financial:view',
  FINANCIAL_REPORTS: 'financial:reports',
  FINANCIAL_PAYMENTS: 'financial:payments',
  
  // Customer Management
  CUSTOMER_VIEW: 'customer:view',
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',
  CUSTOMER_CONTACT: 'customer:contact',
  
  // User/Employee Management
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ROLE_ASSIGN: 'user:role_assign',
  
  // Special Operations
  ORDER_CANCEL: 'order:cancel',
  ORDER_REFUND: 'order:refund',
  ORDER_RETURN: 'order:return',
  
  // Delivery
  DELIVERY_VIEW: 'delivery:view',
  DELIVERY_UPDATE: 'delivery:update',
  DELIVERY_ASSIGN: 'delivery:assign',
  
  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  REPORTS_ANALYTICS: 'reports:analytics',
  
  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',
  
  // HR Specific
  HR_VIEW: 'hr:view',
  HR_MANAGE: 'hr:manage',
  HR_ATTENDANCE: 'hr:attendance',
  HR_PAYROLL: 'hr:payroll',
  
  // Telecalling Specific
  TELECALLING_VIEW: 'telecalling:view',
  TELECALLING_CALL: 'telecalling:call',
  TELECALLING_FOLLOWUP: 'telecalling:followup',
  
  // Notifications
  NOTIFICATION_SEND: 'notification:send',
  NOTIFICATION_VIEW: 'notification:view'
};

// Role definitions with their permissions
const ROLES = {
  // ============================================
  // ADMIN - Full System Access
  // ============================================
  admin: {
    name: 'Admin',
    description: 'Full system access - can do everything',
    color: '#EF4444', // Red
    icon: '👑',
    permissions: Object.values(PERMISSIONS) // All permissions
  },
  
  // ============================================
  // MANAGER - Operations Management
  // ============================================
  manager: {
    name: 'Manager',
    description: 'Manage operations, view reports, handle escalations',
    color: '#8B5CF6', // Purple
    icon: '👔',
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.ORDER_CREATE,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_STATUS_UPDATE,
      PERMISSIONS.ORDER_CANCEL,
      PERMISSIONS.ORDER_REFUND,
      PERMISSIONS.ORDER_RETURN,
      PERMISSIONS.ORDER_ASSIGN,
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.CUSTOMER_CREATE,
      PERMISSIONS.CUSTOMER_UPDATE,
      PERMISSIONS.CUSTOMER_CONTACT,
      PERMISSIONS.FINANCIAL_VIEW,
      PERMISSIONS.FINANCIAL_REPORTS,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.REPORTS_ANALYTICS,
      PERMISSIONS.DELIVERY_VIEW,
      PERMISSIONS.DELIVERY_ASSIGN,
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.NOTIFICATION_SEND,
      PERMISSIONS.NOTIFICATION_VIEW
    ]
  },
  
  // ============================================
  // HR - Human Resources
  // ============================================
  hr: {
    name: 'HR',
    description: 'Human Resources - manage employees, attendance, payroll',
    color: '#10B981', // Green
    icon: '👥',
    permissions: [
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.HR_VIEW,
      PERMISSIONS.HR_MANAGE,
      PERMISSIONS.HR_ATTENDANCE,
      PERMISSIONS.HR_PAYROLL,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT
    ]
  },
  
  // ============================================
  // TELECALLING - Customer Follow-up
  // ============================================
  telecalling: {
    name: 'Telecalling',
    description: 'Customer follow-up, order confirmation, feedback collection',
    color: '#3B82F6', // Blue
    icon: '📞',
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.CUSTOMER_CREATE,
      PERMISSIONS.CUSTOMER_UPDATE,
      PERMISSIONS.CUSTOMER_CONTACT,
      PERMISSIONS.TELECALLING_VIEW,
      PERMISSIONS.TELECALLING_CALL,
      PERMISSIONS.TELECALLING_FOLLOWUP,
      PERMISSIONS.NOTIFICATION_SEND,
      PERMISSIONS.NOTIFICATION_VIEW
    ]
  },
  
  // ============================================
  // BACKOFFICE - Back Office Operations
  // ============================================
  backoffice: {
    name: 'Back Office',
    description: 'Order processing, data entry, backend operations',
    color: '#F59E0B', // Amber
    icon: '🖥️',
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.ORDER_CREATE,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_STATUS_UPDATE,
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.CUSTOMER_CREATE,
      PERMISSIONS.CUSTOMER_UPDATE,
      PERMISSIONS.FINANCIAL_VIEW,
      PERMISSIONS.REPORTS_VIEW
    ]
  },
  
  // ============================================
  // DELIVERY - Delivery Personnel
  // ============================================
  delivery: {
    name: 'Delivery Boy',
    description: 'View and update delivery orders, pickup and drop',
    color: '#06B6D4', // Cyan
    icon: '🚴',
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_STATUS_UPDATE,
      PERMISSIONS.DELIVERY_VIEW,
      PERMISSIONS.DELIVERY_UPDATE,
      PERMISSIONS.CUSTOMER_VIEW
    ]
  },
  
  // ============================================
  // DRYCLEANER - Dry Cleaning Operations
  // ============================================
  drycleaner: {
    name: 'Dry Cleaner',
    description: 'Handle dry cleaning workflow: Spotting, Dry Clean, Ironing, QC, Packing',
    color: '#0891B2', // Cyan-600
    icon: '🫧',
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_STATUS_UPDATE,
      PERMISSIONS.CUSTOMER_VIEW
    ]
  },
  
  // ============================================
  // LINENTRACKER - Linen Tracking Operations
  // ============================================
  linentracker: {
    name: 'Linen Tracker',
    description: 'Track linens: Packing, Rack Assignment, Delivery Assignment',
    color: '#059669', // Emerald-600
    icon: '📋',
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_STATUS_UPDATE,
      PERMISSIONS.ORDER_ASSIGN,
      PERMISSIONS.DELIVERY_VIEW,
      PERMISSIONS.DELIVERY_ASSIGN,
      PERMISSIONS.CUSTOMER_VIEW
    ]
  },
  
  // ============================================
  // FRONTDESK - Front Desk Operations
  // ============================================
  frontdesk: {
    name: 'Front Desk',
    description: 'Handle customer orders, pickups, payments, and inquiries',
    color: '#EC4899', // Pink
    icon: '🎯',
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.ORDER_CREATE,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_STATUS_UPDATE,
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.CUSTOMER_CREATE,
      PERMISSIONS.CUSTOMER_UPDATE,
      PERMISSIONS.FINANCIAL_VIEW,
      PERMISSIONS.FINANCIAL_PAYMENTS,
      PERMISSIONS.NOTIFICATION_SEND
    ]
  },
  
  // ============================================
  // STAFF - General Staff/Operator
  // ============================================
  staff: {
    name: 'Staff',
    description: 'Process orders, update order status, basic operations',
    color: '#6B7280', // Gray
    icon: '👷',
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.ORDER_CREATE,
      PERMISSIONS.ORDER_STATUS_UPDATE,
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.CUSTOMER_CREATE
    ]
  },
  
  // ============================================
  // ACCOUNTANT - Financial Operations
  // ============================================
  accountant: {
    name: 'Accountant',
    description: 'View financial data, reports, and manage payments',
    color: '#14B8A6', // Teal
    icon: '💰',
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.FINANCIAL_VIEW,
      PERMISSIONS.FINANCIAL_REPORTS,
      PERMISSIONS.FINANCIAL_PAYMENTS,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.REPORTS_ANALYTICS
    ]
  }
};

// =========================================================
// Helper Functions
// =========================================================

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

// Get role info (name, description, etc.)
const getRoleInfo = (role) => {
  return ROLES[role] || null;
};

// Get all available roles
const getAllRoles = () => {
  return Object.keys(ROLES).map(key => ({
    value: key,
    ...ROLES[key]
  }));
};

// Check if user can manage another role
const canManageRole = (userRole, targetRole) => {
  const hierarchy = {
    admin: 10,
    manager: 8,
    hr: 7,
    accountant: 5,
    backoffice: 4,
    frontdesk: 4,
    linentracker: 3,
    telecalling: 3,
    drycleaner: 3,
    staff: 2,
    delivery: 2
  };
  
  return (hierarchy[userRole] || 0) > (hierarchy[targetRole] || 0);
};

module.exports = {
  PERMISSIONS,
  ROLES,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  getRoleInfo,
  getAllRoles,
  canManageRole
};
