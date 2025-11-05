# 👤 Customer ID Guide

## Why Customer ID is Important

In real-world scenarios, multiple customers can have the same name. The **Customer ID** field ensures each customer is uniquely identified, preventing confusion and data mix-ups.

## How It Works

### Example: Two Different "Rajesh Kumar" Customers

The system now tracks customers using unique Customer IDs:

**Customer 1:**
- **Customer ID**: `CUST001`
- **Name**: Rajesh Kumar
- **Phone**: +91 98765 43210
- **Orders**: 2 orders (Tickets: 2510-253-00067, 2510-253-00002)

**Customer 2:**
- **Customer ID**: `CUST026`
- **Name**: Rajesh Kumar (same name, but different person!)
- **Phone**: +91 79036 34567
- **Orders**: 4 orders (Tickets: 2510-253-00059, 2510-253-00072, etc.)

### Benefits

1. ✅ **Unique Identification**: Even with duplicate names, each customer is uniquely tracked
2. ✅ **Accurate History**: View all orders for a specific customer, not just by name
3. ✅ **Better Search**: Search by Customer ID for precise results
4. ✅ **Data Integrity**: Prevents mixing up orders between customers with same names

## Using Customer IDs

### Creating Orders

When creating a new order, you must provide:
- **Customer ID** (e.g., CUST001, CUST002, etc.)
- Customer Name
- Phone Number

The Customer ID is the primary identifier - if two orders have the same Customer ID, they belong to the same customer regardless of name variations.

### Searching

You can now search by:
- Customer ID (most precise)
- Customer Name (may return multiple customers)
- Phone Number
- Ticket Number
- Order Number

### Example Searches

**Search by Customer ID:**
```bash
# Returns only orders for CUST001
curl "http://localhost:5000/api/orders/search/query?q=CUST001"
```

**Search by Name:**
```bash
# May return orders from multiple customers with same name
curl "http://localhost:5000/api/orders/search/query?q=Rajesh+Kumar"
```

## Customer ID Format

- Format: `CUST` + 3-digit number (e.g., CUST001, CUST002)
- Each customer should have a unique ID
- IDs are permanent and don't change
- Current system has 30 unique customers (CUST001 to CUST030)

## Sample Data Demonstration

The 100 sample orders include intentional duplicate names to demonstrate the system:

- **Rajesh Kumar**: 2 different customers (CUST001 and CUST026)
- **Amit Sharma**: 2 different customers (CUST003 and CUST027)
- **Priya Singh**: 2 different customers (CUST002 and CUST028)
- **Sanjay Kumar**: 2 different customers (CUST009 and CUST029)
- **Deepak Kumar**: 2 different customers (CUST015 and CUST030)

## Best Practices

1. **Always use Customer ID** as the primary identifier
2. **Generate unique IDs** for new customers
3. **Never reuse IDs** even if a customer is deleted
4. **Use sequential numbering** (CUST001, CUST002, etc.)
5. **Search by ID** when you need precise customer data

## Database Schema

```javascript
{
  customerId: {
    type: String,
    required: true,
    index: true  // Indexed for fast searches
  },
  customerName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  }
}
```

## UI Updates

### Dashboard Table
Now displays Customer ID column between Ticket # and Customer Name

### Order Details Modal
Shows Customer ID prominently in the Customer Information section

### Order Creation Form
Includes Customer ID field as a required input with helper text

### Search Bar
Updated to search across Customer IDs, names, phone numbers, and ticket numbers

---

**Note**: The Customer ID system ensures accurate customer tracking even when names are identical, providing robust data management for your laundry business.

