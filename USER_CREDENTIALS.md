# 🔑 User Credentials

## System Users

| Role | Email | Password | Name | Department |
|------|-------|----------|------|------------|
| **Admin** | `admin@laundry.com` | `admin123` | System Administrator | Operations |
| **Manager** | `manager@laundry.com` | `manager123` | Rahul Manager | Management |
| **Staff** | `staff@laundry.com` | `staff123` | Vijay Staff | Operations |
| **Frontdesk** | `frontdesk@laundry.com` | `frontdesk123` | Sunita Frontdesk | Operations |
| **Backoffice** | `backoffice@laundry.com` | `backoffice123` | Neha Backoffice | Operations |
| **Delivery** | `delivery@laundry.com` | `delivery123` | Raju Delivery | Delivery |
| **Telecalling** | `telecalling@laundry.com` | `telecalling123` | Amit Telecaller | Customer Service |
| **HR** | `hr@laundry.com` | `hr123` | Priya HR | HR |
| **Accountant** | `accountant@laundry.com` | `accountant123` | Meera Accountant | Finance |
| **Dry Cleaner** | `drycleaner@laundry.com` | `drycleaner123` | Suresh Dry Cleaner | Dry Cleaning |
| **Linen Tracker** | `linentracker@laundry.com` | `linentracker123` | Ramesh Linen Tracker | Linen Tracking |

## Delivery Personnel

| Role | Email | Password | Name |
|------|-------|----------|------|
| **Delivery** | `raju@laundry.com` | `delivery123` | Raju Kumar |
| **Delivery** | `amit@laundry.com` | `delivery123` | Amit Singh |
| **Delivery** | `vikram@laundry.com` | `delivery123` | Vikram Yadav |
| **Delivery** | `sanjay@laundry.com` | `delivery123` | Sanjay Sharma |
| **Delivery** | `deepak@laundry.com` | `delivery123` | Deepak Verma |

## Custom Users

| Role | Email | Password | Name |
|------|-------|----------|------|
| **Admin** | `sanjeevmurmu761@gmail.com` | *(user set)* | SANJEEV MURMU |
| **Staff** | `anandboombhagat@gmail.com` | *(user set)* | Anand |
| **Staff** | `preetimarandi123@gmail.com` | *(user set)* | Preeti Marandi |

---

## Password Pattern

For system-created users, passwords follow the pattern: `{role}123`

**Examples:**
- Admin → `admin123`
- Manager → `manager123`
- Staff → `staff123`
- Delivery → `delivery123`
- Frontdesk → `frontdesk123`

---

## Role Permissions

| Role | Access |
|------|--------|
| **Admin** | Full access to all features |
| **Manager** | Operations Dashboard only (Ready for Processing → Sorting → Spotting) |
| **Dry Cleaner** | Dry Cleaner Dashboard only (Spotting → Dry Clean → Ironing → QC → Packing) |
| **Linen Tracker** | Linen Tracker Dashboard only (Packing → Rack Assignment → Ready for Delivery + Assign Delivery Boy) |
| **Back Office** | Back Office Dashboard only (Received → Tagging → Ready for Processing) |
| **Frontdesk** | Orders, Customers, New Order Creation + Assign Pickup Dashboard |
| **Staff** | Orders, Customers (limited) |
| **Delivery** | Delivery dashboard only |
| **Telecalling** | Customers, Orders (view) |
| **HR** | Users management |
| **Accountant** | Reports, Orders (view) |

---

## Quick Login

**For testing, use:**
```
Email: admin@laundry.com
Password: admin123
```

