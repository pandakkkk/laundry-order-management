# 🚀 Quick Start Guide

Get your Laundry Order Monitoring System up and running in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js installation
node --version  # Should be v14 or higher

# Check npm installation
npm --version

# Check MongoDB installation
mongod --version  # Should be v4 or higher
```

## Installation Steps

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Start MongoDB

**macOS:**
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

### 3. Seed Sample Data (Optional)

```bash
npm run seed
```

This will create 4 sample orders in your database for testing.

### 4. Start the Application

```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend (port 3000).

## Access the Application

- **Dashboard**: Open your browser and go to http://localhost:3000
- **API**: Backend API is available at http://localhost:5000/api

## Quick Test

### Option 1: Use the Web Interface
1. Click the "**+ New Order**" button
2. Fill in the form with your order details
3. Click "**Create Order**"
4. View the order in the dashboard

### Option 2: Use the API (with curl)

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "ticketNumber": "2504-143-00010",
    "orderNumber": "010",
    "customerName": "Test Customer",
    "phoneNumber": "+91 99999 99999",
    "orderDate": "2025-10-25T10:00:00.000Z",
    "expectedDelivery": "2025-10-27T18:00:00.000Z",
    "servedBy": "Staff Name",
    "items": [
      {
        "description": "Test Item",
        "quantity": 1,
        "price": 100
      }
    ],
    "totalAmount": 100,
    "paymentMethod": "Cash",
    "paymentStatus": "Pending",
    "status": "Received",
    "location": "Test Location",
    "notes": "Test order"
  }'
```

## Common Issues

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
brew services list  # macOS
sudo systemctl status mongod  # Linux

# If not running, start it
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Linux
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Dependencies Installation Failed
```bash
# Clear npm cache and retry
npm cache clean --force
npm install
```

## What's Next?

1. ✅ Explore the dashboard
2. ✅ Create some test orders
3. ✅ Try updating order statuses
4. ✅ Search for orders
5. ✅ View order details
6. ✅ Check the statistics cards

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review the [sample-data.json](sample-data.json) for JSON format examples
- Make sure all dependencies are installed correctly

---

Happy order tracking! 🎉

