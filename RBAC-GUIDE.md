# 🔐 Role-Based Access Control (RBAC) Guide

## Overview

Your Laundry Management System now has comprehensive role-based access control with granular permissions. Each role has specific permissions that control what they can and cannot do.

---

## 🎭 Available Roles

### 1. 👑 **Admin**
**Full system access**

**Can:**
- Everything in the system
- Manage users
- View all financial data
- Delete orders
- Process refunds
- Access all settings

**Use Case:** System administrators, business owners

---

### 2. 📊 **Manager**
**Manage operations, view reports, handle issues**

**Can:**
- ✅ View, create, update orders
- ✅ Update order statuses
- ✅ Cancel orders
- ✅ Process returns and refunds
- ✅ View financial reports
- ✅ Manage customers
- ✅ View staff members
- ✅ Export reports

**Cannot:**
- ❌ Delete users
- ❌ Change system settings
- ❌ Manage user accounts

**Use Case:** Store managers, supervisors

---

### 3. 🧺 **Staff/Operator**
**Process orders, update order status**

**Can:**
- ✅ View orders
- ✅ Create new orders
- ✅ Update order statuses (Sorting, Washing, Ironing, etc.)
- ✅ View customer information
- ✅ Create new customers

**Cannot:**
- ❌ Delete orders
- ❌ Cancel orders
- ❌ Process refunds
- ❌ View financial reports
- ❌ Update prices

**Use Case:** Laundry operators, processing staff

---

### 4. 📞 **Front Desk**
**Handle customer orders, pickups, and inquiries**

**Can:**
- ✅ View all orders
- ✅ Create new orders
- ✅ Update order details
- ✅ Update order statuses
- ✅ Manage customer information
- ✅ View payment information
- ✅ Handle pickups and deliveries

**Cannot:**
- ❌ Delete orders
- ❌ Process refunds
- ❌ View detailed financial reports
- ❌ Cancel completed orders

**Use Case:** Reception staff, customer service

---

### 5. 🚚 **Delivery Person**
**View and update delivery orders only**

**Can:**
- ✅ View orders assigned for delivery
- ✅ Update delivery status
- ✅ Mark orders as "Out for Delivery"
- ✅ Mark orders as "Delivered"

**Cannot:**
- ❌ Create new orders
- ❌ Modify order details
- ❌ View financial information
- ❌ Access processing statuses

**Use Case:** Delivery staff, drivers

---

### 6. 💰 **Accountant**
**View financial data and reports (read-only)**

**Can:**
- ✅ View all orders
- ✅ View financial data
- ✅ View revenue reports
- ✅ Export financial reports
- ✅ View payment status

**Cannot:**
- ❌ Create or modify orders
- ❌ Update order statuses
- ❌ Delete anything
- ❌ Process refunds

**Use Case:** Accounting staff, financial auditors

---

## 🔑 Permission System

### Permission Categories

#### Order Management
- `order:view` - View orders
- `order:create` - Create new orders
- `order:update` - Modify order details
- `order:delete` - Delete orders
- `order:status_update` - Update order status

#### Special Operations
- `order:cancel` - Cancel orders
- `order:refund` - Process refunds
- `order:return` - Handle returns

#### Financial
- `financial:view` - View financial data
- `financial:reports` - Access financial reports

#### Customer Management
- `customer:view` - View customer info
- `customer:create` - Add new customers
- `customer:update` - Update customer details

#### Delivery
- `delivery:view` - View delivery orders
- `delivery:update` - Update delivery status

#### Reports
- `reports:view` - View reports
- `reports:export` - Export reports

#### User Management
- `user:view` - View users
- `user:create` - Create users
- `user:update` - Update users
- `user:delete` - Delete users

#### Settings
- `settings:view` - View settings
- `settings:update` - Modify settings

---

## 📋 Permission Matrix

| Permission | Admin | Manager | Staff | Front Desk | Delivery | Accountant |
|------------|-------|---------|-------|------------|----------|------------|
| View Orders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Orders | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update Orders | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Delete Orders | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Update Status | ✅ | ✅ | ✅ | ✅ | ✅* | ❌ |
| Cancel Orders | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Process Refunds | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Financial | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Financial Reports | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Export Reports | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

*Delivery can only update delivery-related statuses

---

## 💻 Implementation Examples

### Backend - Protecting Routes

```javascript
// In your route file
const { checkPermission, checkAnyPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

// Single permission required
router.post('/orders', 
  protect, 
  checkPermission(PERMISSIONS.ORDER_CREATE),
  orderController.createOrder
);

// Any of multiple permissions
router.delete('/orders/:id',
  protect,
  checkAnyPermission(PERMISSIONS.ORDER_DELETE, PERMISSIONS.ORDER_CANCEL),
  orderController.deleteOrder
);

// Multiple permissions required
router.post('/orders/:id/refund',
  protect,
  checkAllPermissions(PERMISSIONS.ORDER_REFUND, PERMISSIONS.FINANCIAL_VIEW),
  orderController.refundOrder
);
```

### Frontend - Conditional Rendering

```javascript
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../config/permissions';

function MyComponent() {
  const { can, hasAnyPermission, role } = usePermissions();

  return (
    <div>
      {/* Show only if user can create orders */}
      {can(PERMISSIONS.ORDER_CREATE) && (
        <button>+ New Order</button>
      )}

      {/* Show if user has any of these permissions */}
      {hasAnyPermission(PERMISSIONS.ORDER_DELETE, PERMISSIONS.ORDER_CANCEL) && (
        <button>Delete Order</button>
      )}

      {/* Show based on role */}
      {role === 'admin' && (
        <button>Admin Settings</button>
      )}
    </div>
  );
}
```

---

## 🚀 Creating Users with Different Roles

### Via Registration Page

1. Go to http://localhost:3000/login
2. Click "Create one"
3. Fill in details and select role (defaults to 'staff')

### Via API

```bash
# Create Manager
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@laundry.com",
    "password": "manager123",
    "name": "Store Manager",
    "role": "manager"
  }'

# Create Front Desk Staff
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "frontdesk@laundry.com",
    "password": "frontdesk123",
    "name": "Front Desk Agent",
    "role": "frontdesk"
  }'

# Create Delivery Person
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "delivery@laundry.com",
    "password": "delivery123",
    "name": "Delivery Driver",
    "role": "delivery"
  }'
```

### Via Admin Script

```bash
npm run create-admin
# Then enter:
# Email: role@laundry.com
# Name: Role Name
# Password: password123
# (Script creates admin by default, modify script for other roles)
```

---

## 🧪 Testing Permissions

### 1. Test Staff Access
```bash
# Login as staff
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@laundry.com",
    "password": "staff123"
  }'

# Try to delete order (should fail)
curl -X DELETE http://localhost:5000/api/orders/ORDER_ID \
  -H "Authorization: Bearer STAFF_TOKEN"
# Response: 403 Forbidden
```

### 2. Check User Permissions
```bash
curl -X GET http://localhost:5000/api/users/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "role": "staff",
  "roleInfo": {
    "name": "Staff/Operator",
    "description": "Process orders, update order status"
  },
  "permissions": [
    "order:view",
    "order:create",
    "order:status_update",
    "customer:view",
    "customer:create"
  ]
}
```

---

## 🎨 UI Adaptations Based on Role

The frontend automatically adapts based on user role:

### Admin View
- All features visible
- Delete buttons enabled
- Settings menu accessible
- User management visible

### Manager View
- Most features visible
- Can handle returns/refunds
- Financial reports accessible
- Cannot delete users

### Staff View
- Order processing focused
- Status update dropdowns
- Limited financial visibility
- No deletion capabilities

### Front Desk View
- Customer-centric
- Order creation prominent
- Pickup/delivery management
- Payment viewing only

### Delivery View
- Minimal interface
- Only delivery-related orders
- Simple status updates
- No order creation

### Accountant View
- Read-only mode
- Financial dashboards
- Report exports
- No modifications

---

## 📊 Permission Hierarchy

```
Admin
├── Manager
│   ├── Front Desk
│   └── Staff
│       └── Delivery
└── Accountant (separate branch)
```

---

## 🔧 Customizing Permissions

### Add New Permission

1. **Backend** (`server/config/permissions.js`):
```javascript
const PERMISSIONS = {
  // ... existing permissions
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_UPDATE: 'inventory:update'
};

// Add to role
manager: {
  permissions: [
    // ... existing
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_UPDATE
  ]
}
```

2. **Frontend** (`client/src/config/permissions.js`):
```javascript
export const PERMISSIONS = {
  // ... existing
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_UPDATE: 'inventory:update'
};
```

3. **Use in Route**:
```javascript
router.get('/inventory', 
  protect,
  checkPermission(PERMISSIONS.INVENTORY_VIEW),
  inventoryController.getAll
);
```

---

## 🛡️ Security Best Practices

1. ✅ **Least Privilege**: Give users minimum permissions needed
2. ✅ **Regular Audits**: Review user permissions periodically
3. ✅ **Role Separation**: Keep financial and operational roles separate
4. ✅ **Permission Checks**: Always check on both frontend and backend
5. ✅ **Activity Logging**: Log sensitive actions (future feature)

---

## 📱 Real-World Usage Scenarios

### Scenario 1: New Staff Member
1. Create account with **staff** role
2. They can process orders
3. Cannot access financial data
4. Cannot delete orders

### Scenario 2: Promote to Manager
1. Update user role to **manager**
2. Gains report access
3. Can handle refunds
4. Can manage other staff

### Scenario 3: Seasonal Delivery Driver
1. Create with **delivery** role
2. Only sees delivery orders
3. Updates delivery status
4. No access to other data

### Scenario 4: External Accountant
1. Create with **accountant** role
2. Read-only financial access
3. Can export reports
4. Cannot modify any orders

---

## 🚀 Next Steps

1. **Create test users** for each role
2. **Test permissions** in the UI
3. **Train staff** on their access levels
4. **Monitor usage** and adjust as needed
5. **Add audit logging** (future enhancement)

---

**Your laundry system now has enterprise-grade access control!** 🎉

Each role has precisely what they need - no more, no less.

