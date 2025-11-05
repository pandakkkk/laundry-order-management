// Frontend permission constants (must match backend)

export const PERMISSIONS = {
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

export const ROLE_DESCRIPTIONS = {
  admin: {
    name: 'Admin',
    icon: '👑',
    description: 'Full system access'
  },
  manager: {
    name: 'Manager',
    icon: '📊',
    description: 'Manage operations and reports'
  },
  staff: {
    name: 'Staff',
    icon: '🧺',
    description: 'Process orders'
  },
  frontdesk: {
    name: 'Front Desk',
    icon: '📞',
    description: 'Handle customers'
  },
  delivery: {
    name: 'Delivery',
    icon: '🚚',
    description: 'Delivery operations'
  },
  accountant: {
    name: 'Accountant',
    icon: '💰',
    description: 'Financial access'
  }
};

