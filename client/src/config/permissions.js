// Frontend permission constants (must match backend)

export const PERMISSIONS = {
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
  NOTIFICATION_VIEW: 'notification:view',
  
  // Product Management
  PRODUCT_VIEW: 'product:view',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete'
};

export const ROLE_DESCRIPTIONS = {
  admin: {
    name: 'Admin',
    icon: '👑',
    color: '#EF4444',
    description: 'Full system access - can do everything'
  },
  manager: {
    name: 'Manager',
    icon: '👔',
    color: '#8B5CF6',
    description: 'Manage operations, view reports, handle escalations'
  },
  hr: {
    name: 'HR',
    icon: '👥',
    color: '#10B981',
    description: 'Human Resources - manage employees, attendance, payroll'
  },
  telecalling: {
    name: 'Telecalling',
    icon: '📞',
    color: '#3B82F6',
    description: 'Customer follow-up, order confirmation, feedback'
  },
  backoffice: {
    name: 'Back Office',
    icon: '🖥️',
    color: '#F59E0B',
    description: 'Order processing, data entry, backend operations'
  },
  delivery: {
    name: 'Delivery Boy',
    icon: '🚴',
    color: '#06B6D4',
    description: 'View and update delivery orders, pickup and drop'
  },
  frontdesk: {
    name: 'Front Desk',
    icon: '🎯',
    color: '#EC4899',
    description: 'Handle customer orders, pickups, payments'
  },
  staff: {
    name: 'Staff',
    icon: '👷',
    color: '#6B7280',
    description: 'Process orders, update order status'
  },
  accountant: {
    name: 'Accountant',
    icon: '💰',
    color: '#14B8A6',
    description: 'View financial data, reports, manage payments'
  }
};
