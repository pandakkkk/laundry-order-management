const Customer = require('../models/Customer');

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

    // Check if customerId is provided and unique
    if (customerId) {
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
      customerId,
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

