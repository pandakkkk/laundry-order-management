# 🧺 Laundry Order Monitoring System

A comprehensive full-stack web application for monitoring and managing laundry orders with a central dashboard. Built with Node.js, Express, MongoDB, and React.

## Features

### 📊 Dashboard Overview
- Real-time order statistics
- Total orders, revenue, and today's orders
- Quick status filtering (Received, In Progress, Ready, Delivered)
- Beautiful and responsive UI

### 🔍 Order Management
- **Create Orders**: Easy-to-use form for adding new orders
- **Track Status**: Monitor order progress from received to delivered
- **Customer ID System**: Unique customer identification to handle duplicate names
- **Search & Filter**: Find orders by Customer ID, ticket number, name, or phone
- **Real-time Updates**: Auto-refresh every 30 seconds
- **Overdue Alerts**: Visual indicators for overdue orders

### 📋 Order Details
- Complete order information view
- Customer details with contact information
- Itemized list with quantities and prices
- Payment tracking (Cash, Card, UPI, Online)
- Timeline tracking (order date, expected delivery, last updated)
- Quick status updates and order deletion

### 🎨 Modern UI/UX
- Clean and intuitive interface
- Mobile-responsive design
- Color-coded status badges
- Smooth animations and transitions
- Accessible and user-friendly

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB

### Frontend
- **React** - UI library
- **Axios** - HTTP client
- **date-fns** - Date formatting
- **React Icons** - Icon components

## Prerequisites

Before you begin, ensure you have installed:
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager

## Installation

### 1. Clone or Navigate to the Project
```bash
cd /Users/sanjeevmurmu/workspace/order-monitoring
```

### 2. Install Backend Dependencies
```bash
npm install
```

### 3. Install Frontend Dependencies
```bash
cd client
npm install
cd ..
```

### 4. Configure Environment Variables
The `.env` file is already created with default settings:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/laundry-orders
NODE_ENV=development
```

You can modify these values if needed.

### 5. Start MongoDB
Make sure MongoDB is running on your system:

**macOS (Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Windows:**
```bash
net start MongoDB
```

## Running the Application

### Option 1: Run Both Frontend and Backend Together
```bash
npm run dev
```

### Option 2: Run Separately

**Backend (Terminal 1):**
```bash
npm run server
```

**Frontend (Terminal 2):**
```bash
npm run client
```

### Create Users

**Option 1: Create test users for all roles (recommended for testing)**
```bash
npm run create-test-users
# Creates 6 test accounts (admin, manager, staff, frontdesk, delivery, accountant)
```

**Option 2: Create a single admin user**
```bash
npm run create-admin
# Follow the prompts to create your first admin account
```

### Access the Application
- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

**Default Test Users:**
| Role | Email | Password |
|------|-------|----------|
| 👑 Admin | admin@laundry.com | admin123 |
| 📊 Manager | manager@laundry.com | manager123 |
| 🧺 Staff | staff@laundry.com | staff123 |

## 🔐 Role-Based Access Control (RBAC)

The system implements comprehensive role-based access control with 6 distinct roles:

| Role | Icon | Access Level | Key Permissions |
|------|------|--------------|-----------------|
| **Admin** | 👑 | Full system access | Everything |
| **Manager** | 📊 | Operations & reports | Manage orders, refunds, reports |
| **Staff** | 🧺 | Order processing | Create/update orders |
| **Front Desk** | 📞 | Customer interaction | Handle customers, orders |
| **Delivery** | 🚚 | Delivery only | View/update deliveries |
| **Accountant** | 💰 | Financial view | Read-only financial data |

**See detailed documentation:**
- **[RBAC Quick Start](RBAC-QUICKSTART.md)** - Test RBAC in 5 minutes
- **[Complete RBAC Guide](RBAC-GUIDE.md)** - Full documentation

## API Endpoints

**Note:** All order endpoints require authentication. Permissions are checked automatically.

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Orders (Protected)
- `GET /api/orders` - Get all orders (requires: `order:view`)
- `GET /api/orders/:id` - Get order by ID (requires: `order:view`)
- `GET /api/orders/ticket/:ticketNumber` - Get order by ticket number (requires: `order:view`)
- `POST /api/orders` - Create new order (requires: `order:create`)
- `PATCH /api/orders/:id/status` - Update order status (requires: `order:status_update`)
- `PUT /api/orders/:id` - Update order (requires: `order:update`)
- `DELETE /api/orders/:id` - Delete order (requires: `order:delete` or `order:cancel`)

### Statistics (Protected)
- `GET /api/orders/stats/summary` - Get order statistics (requires: `order:view`)

### Search (Protected)
- `GET /api/orders/search/query?q={query}` - Search orders (requires: `order:view`)

### Users (Protected)
- `GET /api/users/permissions` - Get current user's permissions

### Health Check (Public)
- `GET /api/health` - Server health check

## JSON Data Format

Based on your laundry slip, here's the expected JSON format for creating orders:

```json
{
  "ticketNumber": "2504-143-00002",
  "orderNumber": "002",
  "customerId": "CUST001",
  "customerName": "chotu kachhap",
  "phoneNumber": "+91 79036 75932",
  "orderDate": "2025-10-22T10:54:00.000Z",
  "expectedDelivery": "2025-10-24T00:00:00.000Z",
  "servedBy": "Neha Kr",
  "items": [
    {
      "description": "Shirt (male, white, fullsleeves)",
      "quantity": 1,
      "price": 49.00
    },
    {
      "description": "Shoes (Casual, white)",
      "quantity": 1,
      "price": 159.00
    }
  ],
  "totalAmount": 208.00,
  "paymentMethod": "Cash",
  "paymentStatus": "Pending",
  "status": "Received",
  "location": "Near Kanchan Petrolium, Ranchi, JH",
  "notes": "payment will be valid only after stamp"
}
```

## Order Status Flow

Complete laundry-specific workflow with 15 statuses:

1. **📥 Received** - Order just arrived
2. **📦 Sorting** - Items being sorted by type/color
3. **🔍 Spotting** - Stain treatment
4. **🧼 Washing** - Machine washing
5. **🧴 Dry Cleaning** - Chemical cleaning for delicates
6. **💨 Drying** - Drying process
7. **👔 Ironing** - Pressing and steaming
8. **✔️ Quality Check** - Final inspection
9. **📦 Packing** - Items being packaged
10. **✅ Ready for Pickup** - Awaiting customer collection
11. **🚚 Out for Delivery** - In transit to customer
12. **✨ Delivered** - Successfully completed
13. **↩️ Return** - Customer returned items
14. **💸 Refund** - Money refunded
15. **❌ Cancelled** - Order cancelled

See [LAUNDRY-WORKFLOW.md](LAUNDRY-WORKFLOW.md) for detailed workflow guide.

## 📚 Additional Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get running in 5 minutes
- **[Customer ID Guide](CUSTOMER-ID-GUIDE.md)** - Understanding unique customer identification
- **[Laundry Workflow](LAUNDRY-WORKFLOW.md)** - Detailed status flow explanation
- **[RBAC Guide](RBAC-GUIDE.md)** - Complete role-based access control documentation
- **[RBAC Quick Start](RBAC-QUICKSTART.md)** - Test RBAC in 5 minutes

## Project Structure

```
order-monitoring/
├── server/                 # Backend
│   ├── controllers/        # Request handlers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   └── index.js           # Server entry point
├── client/                # Frontend
│   ├── public/            # Static files
│   └── src/
│       ├── components/    # React components
│       ├── services/      # API service
│       ├── App.js         # Main app component
│       └── index.js       # React entry point
├── .env                   # Environment variables
├── package.json           # Backend dependencies
└── README.md             # Documentation
```

## Using the Application

### First Time Setup
1. **Create users**: Run `npm run create-test-users` to create test accounts
2. **Login**: Go to http://localhost:3000/login
3. **Choose a role**: Login with any test account to see different access levels

### Creating an Order
1. **Login** with an account that has `order:create` permission (Admin, Manager, Staff, Front Desk)
2. Click the "**+ New Order**" button in the header
3. Fill in all required fields:
   - **Customer ID** (unique identifier like CUST001)
   - Ticket Number
   - Order Number
   - Customer Name & Phone
   - Order Date & Expected Delivery
   - Served By
   - Add items with descriptions, quantities, and prices
4. Select payment method and status
5. Click "**Create Order**"

### Monitoring Orders
- View all orders in the table
- Click on stat cards to filter by status
- Use the search bar to find specific orders
- Click on a ticket number or the eye icon to view details
- Update status directly from the table dropdown

### Managing Orders
- Click on any order to view full details
- Update status from the detail modal
- Delete orders if needed
- Track overdue orders (marked with ⚠️)

## Tips & Best Practices

1. **Customer IDs**: Always use unique Customer IDs - see [CUSTOMER-ID-GUIDE.md](CUSTOMER-ID-GUIDE.md)
2. **Role Assignment**: Give users the minimum permissions they need
3. **Regular Backups**: Set up MongoDB backups regularly
4. **Status Updates**: Keep order statuses up-to-date for accurate tracking
5. **Search by ID**: Use Customer IDs for precise customer tracking
6. **Mobile Access**: Dashboard is fully responsive for mobile devices
7. **Auto-refresh**: Dashboard refreshes every 30 seconds automatically
8. **Security**: Change default test passwords before production use

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `brew services list` (macOS)
- Check connection string in `.env` file
- Verify MongoDB port (default: 27017)

### Port Already in Use
- Change PORT in `.env` file
- Kill process using the port: `lsof -ti:5000 | xargs kill -9`

### Frontend Not Loading
- Clear browser cache
- Check if backend is running on port 5000
- Verify proxy setting in `client/package.json`

## Future Enhancements

- [x] User authentication and authorization ✅
- [x] Role-based access control ✅
- [ ] SMS/Email notifications for order status
- [ ] Receipt printing functionality
- [ ] Customer history tracking
- [ ] Advanced analytics and reporting
- [ ] Bulk order import/export
- [ ] WhatsApp integration
- [ ] Payment gateway integration
- [ ] Audit logging for sensitive operations

## Support

For issues or questions, please check:
- MongoDB is running
- All dependencies are installed
- Environment variables are configured
- Ports 3000 and 5000 are available

## License

ISC

---

Built with ❤️ for efficient laundry order management

