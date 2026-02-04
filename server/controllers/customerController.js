const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Counter = require('../models/Counter');

// Generate next customer ID
const generateCustomerId = async () => {
  const sequence = await Counter.getNextSequence('customerId');
  return `CUST${String(sequence).padStart(5, '0')}`; // e.g., CUST00001
};

// Get next customer ID (preview without incrementing, then generate on create)
exports.getNextCustomerId = async (req, res) => {
  try {
    const currentSeq = await Counter.getCurrentSequence('customerId');
    const nextSeq = currentSeq + 1;
    const nextCustomerId = `CUST${String(nextSeq).padStart(5, '0')}`;
    
    res.json({
      success: true,
      data: {
        nextCustomerId,
        sequence: nextSeq
      }
    });
  } catch (error) {
    console.error('Error getting next customer ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get next customer ID'
    });
  }
};

// Get customer by phone number (for auto-populate)
exports.getCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Find exact match for phone number
    const customer = await Customer.findOne({ phoneNumber: phone });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
        exists: false
      });
    }

    res.json({
      success: true,
      exists: true,
      data: {
        _id: customer._id,
        customerId: customer.customerId,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent
      }
    });
  } catch (error) {
    console.error('Error getting customer by phone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer'
    });
  }
};

// Get all customers with pagination and filtering
exports.getCustomers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const customers = await Customer.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch customers' 
    });
  }
};

// Get single customer by ID or phone
exports.getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by _id first, then by phoneNumber
    let customer = await Customer.findById(id).catch(() => null);
    
    if (!customer) {
      customer = await Customer.findOne({ phoneNumber: id });
    }

    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch customer' 
    });
  }
};

// Search customers by phone number
exports.searchByPhone = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number is required' 
      });
    }

    const customers = await Customer.find({
      phoneNumber: { $regex: phone, $options: 'i' }
    }).limit(10);

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search customers' 
    });
  }
};

// Search customers by multiple fields
exports.searchCustomers = async (req, res) => {
  try {
    const { q, field, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    let searchQuery;

    // Field-specific search
    if (field && field !== 'all') {
      const fieldMap = {
        'customerName': 'name',
        'phoneNumber': 'phoneNumber'
      };

      const searchField = fieldMap[field];
      if (searchField) {
        searchQuery = { [searchField]: { $regex: q, $options: 'i' } };
      } else {
        // If invalid field, search all
        searchQuery = {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { phoneNumber: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        };
      }
    } else {
      // Search all fields
      searchQuery = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { phoneNumber: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const customers = await Customer.find(searchQuery)
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Customer.countDocuments(searchQuery);

    res.json({
      success: true,
      count: customers.length,
      field: field,
      data: customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search customers'
    });
  }
};

// Create new customer
exports.createCustomer = async (req, res) => {
  try {
    const { phoneNumber, name, email, address, city, state, pincode, customerId, notes, tags } = req.body;

    // Validate required fields
    if (!phoneNumber || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and name are required' 
      });
    }

    // Check if customer with phone already exists
    const existingCustomer = await Customer.findOne({ phoneNumber });
    if (existingCustomer) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer with this phone number already exists' 
      });
    }

    // Auto-generate customerId if not provided
    let finalCustomerId = customerId;
    if (!finalCustomerId) {
      finalCustomerId = await generateCustomerId();
    } else {
      // Check if provided customerId is unique
      const existingCustomerId = await Customer.findOne({ customerId });
      if (existingCustomerId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Customer ID already exists' 
        });
      }
    }

    const customer = new Customer({
      phoneNumber,
      name,
      email,
      address,
      city,
      state,
      pincode,
      customerId: finalCustomerId,
      notes,
      tags
    });

    await customer.save();

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        error: `${field} already exists` 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create customer' 
    });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { phoneNumber, name, email, address, city, state, pincode, customerId, notes, status, tags } = req.body;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }

    // Check if phone number is being changed and if it's unique
    if (phoneNumber && phoneNumber !== customer.phoneNumber) {
      const existingCustomer = await Customer.findOne({ phoneNumber });
      if (existingCustomer) {
        return res.status(400).json({ 
          success: false, 
          error: 'Phone number already exists' 
        });
      }
      customer.phoneNumber = phoneNumber;
    }

    // Check if customerId is being changed and if it's unique
    if (customerId && customerId !== customer.customerId) {
      const existingCustomerId = await Customer.findOne({ customerId });
      if (existingCustomerId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Customer ID already exists' 
        });
      }
      customer.customerId = customerId;
    }

    // Update fields
    if (name !== undefined) customer.name = name;
    if (email !== undefined) customer.email = email;
    if (address !== undefined) customer.address = address;
    if (city !== undefined) customer.city = city;
    if (state !== undefined) customer.state = state;
    if (pincode !== undefined) customer.pincode = pincode;
    if (notes !== undefined) customer.notes = notes;
    if (status !== undefined) customer.status = status;
    if (tags !== undefined) customer.tags = tags;

    await customer.save();

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        error: `${field} already exists` 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update customer' 
    });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }

    // Check if customer has orders (optional safety check)
    if (customer.totalOrders > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete customer with existing orders. Set status to Inactive instead.' 
      });
    }

    await Customer.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete customer' 
    });
  }
};

// Get customer statistics
exports.getCustomerStats = async (req, res) => {
  try {
    // Disable caching for stats - they change frequently
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: 'Active' });
    const inactiveCustomers = await Customer.countDocuments({ status: 'Inactive' });
    const blockedCustomers = await Customer.countDocuments({ status: 'Blocked' });

    // Top customers by spending
    const topCustomers = await Customer.find()
      .sort({ totalSpent: -1 })
      .limit(10)
      .select('name phoneNumber totalOrders totalSpent');

    // Recent customers
    const recentCustomers = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name phoneNumber createdAt');

    res.json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        blockedCustomers,
        topCustomers,
        recentCustomers
      }
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch customer statistics' 
    });
  }
};

// Get customer order history
exports.getCustomerOrderHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    // Find customer by ID or phone
    let customer = await Customer.findById(id).catch(() => null);
    if (!customer) {
      customer = await Customer.findOne({ phoneNumber: id });
    }
    if (!customer) {
      customer = await Customer.findOne({ customerId: id });
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Build query for orders
    const query = {
      $or: [
        { customerId: customer.customerId || customer._id.toString() },
        { phoneNumber: customer.phoneNumber }
      ]
    };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        customer: {
          id: customer._id,
          name: customer.name,
          phoneNumber: customer.phoneNumber,
          customerId: customer.customerId
        },
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching customer order history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer order history'
    });
  }
};

// Get customer analytics
exports.getCustomerAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    // Find customer by ID or phone
    let customer = await Customer.findById(id).catch(() => null);
    if (!customer) {
      customer = await Customer.findOne({ phoneNumber: id });
    }
    if (!customer) {
      customer = await Customer.findOne({ customerId: id });
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Get all orders for this customer
    const orders = await Order.find({
      $or: [
        { customerId: customer.customerId || customer._id.toString() },
        { phoneNumber: customer.phoneNumber }
      ]
    }).sort({ orderDate: -1 });

    // Calculate analytics
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Calculate favorite services/products
    const serviceCount = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const service = item.description.split('(')[0].trim(); // Get main service name
        serviceCount[service] = (serviceCount[service] || 0) + item.quantity;
      });
    });
    const favoriteServices = Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([service, count]) => ({ service, count }));

    // Calculate order frequency
    let orderFrequency = 'New';
    if (totalOrders > 0) {
      const daysSinceFirstOrder = (new Date() - orders[orders.length - 1].orderDate) / (1000 * 60 * 60 * 24);
      const ordersPerMonth = totalOrders / (daysSinceFirstOrder / 30);
      
      if (ordersPerMonth >= 4) {
        orderFrequency = 'Regular';
      } else if (ordersPerMonth >= 1) {
        orderFrequency = 'Occasional';
      }
    }

    // Get order status breakdown
    const statusBreakdown = {};
    orders.forEach(order => {
      statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
    });

    // Get payment method breakdown
    const paymentMethodBreakdown = {};
    orders.forEach(order => {
      paymentMethodBreakdown[order.paymentMethod] = (paymentMethodBreakdown[order.paymentMethod] || 0) + 1;
    });

    // Get monthly spending trend (last 6 months)
    const monthlySpending = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    orders
      .filter(order => new Date(order.orderDate) >= sixMonthsAgo)
      .forEach(order => {
        const month = new Date(order.orderDate).toLocaleString('en-US', { month: 'short', year: 'numeric' });
        monthlySpending[month] = (monthlySpending[month] || 0) + order.totalAmount;
      });

    res.json({
      success: true,
      data: {
        customer: {
          id: customer._id,
          name: customer.name,
          phoneNumber: customer.phoneNumber,
          customerId: customer.customerId
        },
        analytics: {
          totalOrders,
          totalSpent,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
          orderFrequency,
          favoriteServices,
          lastOrderDate: customer.lastOrderDate,
          statusBreakdown,
          paymentMethodBreakdown,
          monthlySpending
        }
      }
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer analytics'
    });
  }
};

// Bulk import customers
exports.bulkImportCustomers = async (req, res) => {
  try {
    const { customers } = req.body;

    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid customers data' 
      });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const customerData of customers) {
      try {
        // Check if customer already exists
        const existingCustomer = await Customer.findOne({ phoneNumber: customerData.phoneNumber });
        
        if (existingCustomer) {
          results.failed.push({
            phoneNumber: customerData.phoneNumber,
            reason: 'Phone number already exists'
          });
          continue;
        }

        const customer = new Customer(customerData);
        await customer.save();
        results.success.push(customer);
      } catch (error) {
        results.failed.push({
          phoneNumber: customerData.phoneNumber,
          reason: error.message
        });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Imported ${results.success.length} customers, ${results.failed.length} failed`
    });
  } catch (error) {
    console.error('Error importing customers:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to import customers' 
    });
  }
};

