# 🚀 RBAC Quick Start Guide

## 5-Minute Setup

### Step 1: Create Test Users (All Roles)

```bash
npm run create-test-users
```

This creates 6 test accounts:

| Role | Email | Password |
|------|-------|----------|
| 👑 **Admin** | admin@laundry.com | admin123 |
| 📊 **Manager** | manager@laundry.com | manager123 |
| 🧺 **Staff** | staff@laundry.com | staff123 |
| 📞 **Front Desk** | frontdesk@laundry.com | frontdesk123 |
| 🚚 **Delivery** | delivery@laundry.com | delivery123 |
| 💰 **Accountant** | accountant@laundry.com | accountant123 |

---

### Step 2: Test Different Roles

1. **Open the app**: http://localhost:3000

2. **Login as different users** and see how the UI changes:

#### 🧺 Staff View (staff@laundry.com / staff123)
- ✅ Can create orders
- ✅ Can update order status
- ❌ Cannot delete orders
- ❌ Cannot see financial reports
- ❌ No "Delete" button in order details

#### 📊 Manager View (manager@laundry.com / manager123)
- ✅ Everything staff can do
- ✅ Can process refunds
- ✅ Can view financial reports
- ✅ Can cancel orders
- ❌ Cannot delete users

#### 👑 Admin View (admin@laundry.com / admin123)
- ✅ Full access to everything

#### 🚚 Delivery View (delivery@laundry.com / delivery123)
- ✅ Can view orders
- ✅ Can update delivery status
- ❌ Cannot create new orders
- ❌ Minimal UI (delivery-focused)

---

### Step 3: See Permissions in Action

**Test Permission Denial:**

1. Login as **Staff** (staff@laundry.com)
2. Open an order
3. Notice: **No "Delete" button** (permission denied)
4. Try to update status: **Works!** ✅

**Compare with Admin:**

1. Logout and login as **Admin** (admin@laundry.com)
2. Open same order
3. Notice: **"Delete" button appears** ✅
4. All features are visible

---

## 🎯 What Each Role Sees

### UI Elements by Role

| Feature | Admin | Manager | Staff | Front Desk | Delivery | Accountant |
|---------|-------|---------|-------|------------|----------|------------|
| **"+ New Order" button** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Status update dropdown** | ✅ | ✅ | ✅ | ✅ | ✅* | ❌ |
| **Delete button** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Financial stats** | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Edit order details** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |

*Delivery can only update delivery-related statuses

---

## 🧪 Testing API Permissions

### Get Your Token

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@laundry.com",
    "password": "staff123"
  }'

# Copy the token from response
```

### Check Your Permissions

```bash
curl -X GET http://localhost:5000/api/users/permissions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Response shows your permissions:
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

### Test Permission Denial

```bash
# Staff trying to delete (should fail)
curl -X DELETE http://localhost:5000/api/orders/ORDER_ID \
  -H "Authorization: Bearer STAFF_TOKEN"

# Response: 403 Forbidden
{
  "success": false,
  "error": "You do not have permission to perform this action",
  "required": "order:delete"
}
```

---

## 🎨 Frontend Code Examples

### Hide Button Based on Permission

```javascript
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../config/permissions';

function OrderActions({ orderId }) {
  const { can } = usePermissions();

  return (
    <div>
      {/* Only admins can delete */}
      {can(PERMISSIONS.ORDER_DELETE) && (
        <button onClick={() => deleteOrder(orderId)}>
          🗑️ Delete
        </button>
      )}
      
      {/* Staff and above can update */}
      {can(PERMISSIONS.ORDER_STATUS_UPDATE) && (
        <button onClick={() => updateStatus(orderId)}>
          ✏️ Update Status
        </button>
      )}
    </div>
  );
}
```

### Check Multiple Permissions

```javascript
const { hasAnyPermission, hasAllPermissions } = usePermissions();

// User needs ANY of these
{hasAnyPermission(
  PERMISSIONS.ORDER_DELETE, 
  PERMISSIONS.ORDER_CANCEL
) && (
  <button>Remove Order</button>
)}

// User needs ALL of these
{hasAllPermissions(
  PERMISSIONS.ORDER_REFUND,
  PERMISSIONS.FINANCIAL_VIEW
) && (
  <button>Process Refund</button>
)}
```

---

## 📊 Role Comparison Chart

### What Can Each Role Do?

```
👑 ADMIN
├── Everything below +
├── Delete users
├── System settings
└── Full access

📊 MANAGER  
├── View/Create/Update orders
├── Cancel orders
├── Process refunds & returns
├── Financial reports
└── Manage customers

🧺 STAFF
├── View orders
├── Create orders
├── Update order status
└── View customers

📞 FRONT DESK
├── Everything staff can do +
├── Edit order details
├── View payments
└── Handle pickups

🚚 DELIVERY
├── View orders
└── Update delivery status ONLY

💰 ACCOUNTANT
├── View orders (read-only)
├── View financial data
└── Export reports
```

---

## 🔥 Common Scenarios

### Scenario 1: New Employee

**Question:** I hired a new washing staff member. What role?

**Answer:** Use **staff** role
```bash
# They can process orders but not delete or handle money
email: newstaff@laundry.com
role: staff
```

### Scenario 2: Trusted Manager

**Question:** My manager should handle refunds and reports.

**Answer:** Use **manager** role
```bash
email: manager@laundry.com
role: manager
# They can do everything except delete users
```

### Scenario 3: Delivery Driver

**Question:** Driver should only update delivery status.

**Answer:** Use **delivery** role
```bash
email: driver@laundry.com
role: delivery
# They see minimal UI, only delivery-related features
```

### Scenario 4: External Accountant

**Question:** Accountant needs to see reports but not modify anything.

**Answer:** Use **accountant** role
```bash
email: accountant@laundry.com
role: accountant
# Read-only access to financial data
```

---

## 🛠️ Troubleshooting

### Issue: "Permission denied" error

**Check your role:**
```bash
curl -X GET http://localhost:5000/api/users/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Solution:** Ask admin to update your role if needed.

### Issue: Button not showing up

**Reason:** You don't have the required permission.

**Check:** Login as admin to see all features.

### Issue: Can't delete orders

**Reason:** Only **admin** can delete orders.

**Solution:** Contact your admin or ask them to change your role to admin if appropriate.

---

## 🎓 Next Steps

1. ✅ **Created test users** - Done with `npm run create-test-users`
2. 🧪 **Test each role** - Login and try different actions
3. 📖 **Read full guide** - See `RBAC-GUIDE.md` for complete details
4. 👥 **Create real users** - Use `npm run create-admin` for production
5. 🔒 **Review access** - Audit user roles periodically

---

## 📞 Support

**Having issues?**
- Check `RBAC-GUIDE.md` for detailed documentation
- Verify MongoDB is running: `brew services list`
- Check server logs for permission errors
- Test with admin account first

---

**Your laundry system now has professional role-based access control!** 🎉

Every user sees exactly what they need - nothing more, nothing less.

