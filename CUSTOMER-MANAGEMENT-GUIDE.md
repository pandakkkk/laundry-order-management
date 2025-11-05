# 👥 Customer Management System - Complete Guide

## 🎉 Overview

Your laundry management system now includes a **comprehensive Customer Management System** with phone number as the unique identifier!

---

## ✨ Key Features

### 1. **Customer Database**
- ✅ Store complete customer information
- ✅ Phone number as unique identifier (no duplicates)
- ✅ Optional custom Customer ID
- ✅ Email, address, city, state, pincode
- ✅ Notes and tags
- ✅ Customer status (Active/Inactive/Blocked)

### 2. **Smart Search**
- 🔍 Search by name, phone, email, address, city
- 📱 Auto-complete customer search while creating orders
- ⚡ Real-time phone number lookup (3+ digits)
- 🎯 Instant customer selection

### 3. **Customer Analytics**
- 📊 Total customers count
- ✅ Active customers
- ⏸️ Inactive customers
- 🚫 Blocked customers
- 💰 Total orders & spending per customer

### 4. **CRUD Operations**
- ➕ Add new customers
- ✏️ Edit customer details
- 🗑️ Delete customers (with safety checks)
- 🔄 Bulk import (CSV/JSON support)

### 5. **Order Integration**
- 🔗 Auto-fill customer data in order creation
- 📈 Track order history per customer
- 💵 Track total spending
- 📅 Last order date

---

## 🗂️ Customer Data Structure

### **Fields**

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `phoneNumber` | String | ✅ Yes | ✅ Yes | Primary identifier |
| `name` | String | ✅ Yes | ❌ No | Customer full name |
| `email` | String | ❌ No | ❌ No | Email address |
| `address` | String | ❌ No | ❌ No | Street address |
| `city` | String | ❌ No | ❌ No | City |
| `state` | String | ❌ No | ❌ No | State |
| `pincode` | String | ❌ No | ❌ No | 6-digit pincode |
| `customerId` | String | ❌ No | ✅ Yes | Custom ID (e.g., CUST001) |
| `notes` | String | ❌ No | ❌ No | Additional notes |
| `status` | Enum | ❌ No | ❌ No | Active, Inactive, Blocked |
| `totalOrders` | Number | Auto | ❌ No | Order count (auto-updated) |
| `totalSpent` | Number | Auto | ❌ No | Total spending (auto-updated) |
| `lastOrderDate` | Date | Auto | ❌ No | Last order date (auto-updated) |

---

## 🚀 How to Use

### **1. Access Customer Management**

Navigate to: **👥 Customers** tab in the header

Or go to: **http://localhost:3000/customers**

### **2. Add New Customer**

1. Click **"+ Add Customer"** button
2. Fill in required fields:
   - Phone Number (required, must be unique)
   - Customer Name (required)
3. Fill optional fields:
   - Email
   - Address, City, State, Pincode
   - Custom Customer ID
   - Notes
   - Status
4. Click **"Add Customer"**

**Example:**
```
Phone: +91 98765 43210
Name: Rajesh Kumar
Email: rajesh@example.com
Address: 123 MG Road
City: Bangalore
State: Karnataka
Pincode: 560001
Customer ID: CUST001
Status: Active
```

### **3. Edit Customer**

1. Find customer in the list
2. Click **✏️ Edit** button
3. Update fields (phone number cannot be changed)
4. Click **"Update Customer"**

### **4. Delete Customer**

1. Find customer in the list
2. Click **🗑️ Delete** button
3. Confirm deletion

**Note**: Customers with existing orders cannot be deleted (set to Inactive instead)

### **5. Search Customers**

Use the search bar at the top:
- Type name, phone, email, or address
- Results update in real-time
- Filter by status (All/Active/Inactive/Blocked)
- Click 🔄 Refresh to reload

---

## 🛒 Integration with Orders

### **Auto-Fill Customer Data**

When creating a new order:

1. Click **"+ New Order"**
2. Add products to cart
3. Click **"📋 Proceed to Booking"**
4. Enter phone number (3+ digits)
5. **Matching customers appear automatically!**
6. Click on a customer to auto-fill:
   - Customer Name
   - Customer ID
   - Address/Location
7. Complete the order

**Screenshot Flow:**
```
Type Phone: +91 987...
    ↓
Dropdown shows: "Found 2 existing customer(s)"
    ↓
Click customer → Auto-fills all data
    ↓
Complete order ✅
```

---

## 📊 Customer Statistics

View at the top of Customer Management page:

### **Stats Cards**
1. **👥 Total Customers** - All customers in database
2. **✅ Active** - Customers with Active status
3. **⏸️ Inactive** - Customers with Inactive status
4. **🚫 Blocked** - Customers with Blocked status

---

## 🔐 Permissions & RBAC

### **Required Permissions**

| Action | Permission | Admin | Manager | Staff | Front Desk | Delivery | Accountant |
|--------|-----------|-------|---------|-------|------------|----------|------------|
| View Customers | `customer:view` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Add Customer | `customer:create` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Customer | `customer:update` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete Customer | `customer:delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 📡 API Endpoints

### **Backend Routes** (`/api/customers`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | Get all customers (with filters) | `customer:view` |
| GET | `/stats` | Get customer statistics | `customer:view` |
| GET | `/search?phone=XXX` | Search by phone | `customer:view` |
| GET | `/:id` | Get single customer | `customer:view` |
| POST | `/` | Create new customer | `customer:create` |
| POST | `/bulk-import` | Bulk import customers | `customer:create` |
| PUT | `/:id` | Update customer | `customer:update` |
| DELETE | `/:id` | Delete customer | `customer:delete` |

### **Query Parameters**

**GET `/api/customers`**:
```
?page=1                    // Page number
&limit=50                  // Items per page
&search=rajesh            // Search query
&status=Active            // Filter by status
&sortBy=createdAt         // Sort field
&sortOrder=desc           // Sort direction
```

### **Example API Calls**

**Search customers:**
```bash
curl -X GET "http://localhost:5000/api/customers/search?phone=9876" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create customer:**
```bash
curl -X POST "http://localhost:5000/api/customers" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+91 98765 43210",
    "name": "Rajesh Kumar",
    "email": "rajesh@example.com"
  }'
```

---

## 🔒 Data Validation

### **Phone Number**
- **Required**: Yes
- **Unique**: Yes (per phone number)
- **Format**: Accepts digits, +, -, spaces, parentheses
- **Examples**: 
  - ✅ `+91 98765 43210`
  - ✅ `9876543210`
  - ✅ `(987) 654-3210`

### **Email**
- **Required**: No
- **Format**: Standard email format
- **Example**: ✅ `customer@example.com`

### **Pincode**
- **Required**: No
- **Format**: 6 digits (Indian pincode)
- **Example**: ✅ `560001`

### **Custom Customer ID**
- **Required**: No
- **Unique**: Yes (if provided)
- **Example**: ✅ `CUST001`

---

## 🛡️ Safety Features

### **1. Duplicate Prevention**
- Phone number uniqueness enforced at database level
- Friendly error message if duplicate detected
- Custom ID uniqueness check

### **2. Delete Protection**
- Cannot delete customers with order history
- Set status to "Inactive" instead
- Prevents data integrity issues

### **3. Validation**
- Frontend validation before submission
- Backend validation as second layer
- Clear error messages

### **4. Auto-Update Order Stats**
- Order count updates automatically
- Total spent calculation
- Last order date tracking

---

## 📱 Mobile Responsive

The Customer Management system is fully responsive:

- ✅ Desktop: Full table view
- ✅ Tablet: Horizontal scroll for table
- ✅ Mobile: Stacked layout, full-width forms

---

## 🎯 Use Cases

### **Scenario 1: New Customer**
```
1. Customer calls for first time
2. Staff opens "+ New Order"
3. Types phone number
4. No match found
5. Adds products
6. Proceeds to booking
7. Fills customer details
8. Order created + Customer saved!
```

### **Scenario 2: Returning Customer**
```
1. Customer calls again
2. Staff opens "+ New Order"
3. Types phone: +91 987...
4. Dropdown shows customer!
5. Clicks customer name
6. All details auto-filled!
7. Just add products and book
```

### **Scenario 3: Update Customer Address**
```
1. Go to Customers page
2. Search customer name
3. Click ✏️ Edit
4. Update address
5. Save changes
6. Next order uses new address!
```

### **Scenario 4: Block Spam Customer**
```
1. Go to Customers page
2. Find problem customer
3. Click ✏️ Edit
4. Set Status: Blocked
5. Staff can see status in order creation
```

---

## 💡 Pro Tips

### **1. Use Customer IDs**
Assign memorable IDs for VIP customers:
```
CUST001, CUST002, VIP001, CORP001
```

### **2. Add Tags** (Future Enhancement)
Tag customers for segmentation:
```
VIP, Corporate, Wholesale, Regular
```

### **3. Use Notes**
Store important info:
```
"Prefers express delivery"
"Allergic to fabric softener"
"Pay by company account"
```

### **4. Status Management**
- **Active**: Regular customers
- **Inactive**: Haven't ordered in 6+ months
- **Blocked**: Problematic customers

### **5. Bulk Import**
Import from Excel/CSV:
```json
[
  {
    "phoneNumber": "+91 9876543210",
    "name": "Customer 1",
    "email": "c1@example.com"
  },
  {
    "phoneNumber": "+91 9876543211",
    "name": "Customer 2"
  }
]
```

---

## 🐛 Troubleshooting

### **Problem**: "Phone number already exists"
**Solution**: This phone is already in database. Search for existing customer and edit instead.

### **Problem**: "Cannot delete customer"
**Solution**: Customer has order history. Set status to Inactive instead of deleting.

### **Problem**: Customer search not working
**Solution**: 
- Type at least 3 digits
- Check internet connection
- Verify you have `customer:view` permission

### **Problem**: Customer data not auto-filling
**Solution**:
- Make sure you click the customer in dropdown
- Phone number must match exactly
- Check for JavaScript errors in console

---

## 📈 Future Enhancements (Roadmap)

### **Phase 2 Features**
- [ ] Customer loyalty points
- [ ] Referral tracking
- [ ] Customer groups/segments
- [ ] Birthday/anniversary reminders
- [ ] Email marketing integration
- [ ] SMS notifications
- [ ] WhatsApp integration
- [ ] Customer portal (self-service)

### **Phase 3 Features**
- [ ] Customer feedback/ratings
- [ ] Preferred services
- [ ] Automated follow-ups
- [ ] Customer lifetime value (CLV)
- [ ] Churn prediction
- [ ] AI-powered recommendations

---

## 🎓 Training Your Staff

### **Quick Training Checklist**

✅ Show how to add new customer
✅ Demonstrate phone number search
✅ Practice auto-fill in order creation
✅ Explain status meanings
✅ Show how to edit customer info
✅ Warn about delete restrictions

### **5-Minute Training Script**
```
1. "This is Customers tab - all customer info here"
2. "Add Customer button - fill name & phone, that's it!"
3. "When taking order, type phone - customer pops up!"
4. "Click customer - all details filled automatically"
5. "Edit button - update info anytime"
6. "Don't delete old customers - mark Inactive instead"
```

---

## 📊 Success Metrics

Track these KPIs:

1. **Customer Retention Rate**
   - Returning customers / Total customers
   
2. **Average Order Value per Customer**
   - Total spent / Total orders

3. **Customer Acquisition**
   - New customers per month

4. **Active vs Inactive Ratio**
   - Active customers / Total customers

---

## 🎉 Summary

Your Customer Management System provides:

✅ **Centralized Database** - All customer info in one place
✅ **Unique Phone Numbers** - No duplicates, clean data
✅ **Smart Search** - Find customers instantly
✅ **Auto-Fill Integration** - Speeds up order creation
✅ **Order Tracking** - Know customer history
✅ **RBAC Protected** - Role-based access control
✅ **Mobile Responsive** - Works on all devices
✅ **Production Ready** - Scalable and secure

---

## 🚀 Get Started

1. **Access**: Go to 👥 Customers tab
2. **Add**: Click "+ Add Customer" button
3. **Test**: Try creating an order with auto-fill
4. **Train**: Show your staff the features

**That's it! You're ready to manage customers professionally!** 🎊

---

**Questions? Check the main README or contact support.**

