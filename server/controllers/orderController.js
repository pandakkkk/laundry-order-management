const Order = require('../models/Order');

// Get all orders with pagination
exports.getAllOrders = async (req, res) => {
  try {
    const { 
      status, 
      startDate, 
      endDate, 
      sortBy = '-orderDate',
      page = 1,
      limit = 20
    } = req.query;
    
    let query = {};
    
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
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      count: orders.length,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get order by ticket number
exports.getOrderByTicketNumber = async (req, res) => {
  try {
    const order = await Order.findOne({ ticketNumber: req.params.ticketNumber });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    
    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update order
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    
    // Count by each status
    const receivedOrders = await Order.countDocuments({ status: 'Received' });
    const sortingOrders = await Order.countDocuments({ status: 'Sorting' });
    const spottingOrders = await Order.countDocuments({ status: 'Spotting' });
    const washingOrders = await Order.countDocuments({ status: 'Washing' });
    const dryCleaningOrders = await Order.countDocuments({ status: 'Dry Cleaning' });
    const dryingOrders = await Order.countDocuments({ status: 'Drying' });
    const ironingOrders = await Order.countDocuments({ status: 'Ironing' });
    const qualityCheckOrders = await Order.countDocuments({ status: 'Quality Check' });
    const packingOrders = await Order.countDocuments({ status: 'Packing' });
    const readyForPickupOrders = await Order.countDocuments({ status: 'Ready for Pickup' });
    const outForDeliveryOrders = await Order.countDocuments({ status: 'Out for Delivery' });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const returnOrders = await Order.countDocuments({ status: 'Return' });
    const refundOrders = await Order.countDocuments({ status: 'Refund' });
    const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });
    
    // Calculate in-process orders (all orders between Received and Ready for Pickup)
    const inProcessOrders = sortingOrders + spottingOrders + washingOrders + 
                           dryCleaningOrders + dryingOrders + ironingOrders + 
                           qualityCheckOrders + packingOrders;
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayOrders = await Order.countDocuments({
      orderDate: { $gte: todayStart }
    });
    
    res.json({
      success: true,
      data: {
        totalOrders,
        receivedOrders,
        sortingOrders,
        spottingOrders,
        washingOrders,
        dryCleaningOrders,
        dryingOrders,
        ironingOrders,
        qualityCheckOrders,
        packingOrders,
        readyForPickupOrders,
        outForDeliveryOrders,
        deliveredOrders,
        returnOrders,
        refundOrders,
        cancelledOrders,
        inProcessOrders,
        todayOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Search orders
exports.searchOrders = async (req, res) => {
  try {
    const { q, field = 'all' } = req.query;
    
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
        'ticketNumber': 'ticketNumber',
        'customerId': 'customerId',
        'customerName': 'customerName',
        'phoneNumber': 'phoneNumber'
      };
      
      const searchField = fieldMap[field];
      if (searchField) {
        searchQuery = { [searchField]: { $regex: q, $options: 'i' } };
      } else {
        // If invalid field, search all
        searchQuery = {
          $or: [
            { ticketNumber: { $regex: q, $options: 'i' } },
            { customerId: { $regex: q, $options: 'i' } },
            { customerName: { $regex: q, $options: 'i' } },
            { phoneNumber: { $regex: q, $options: 'i' } },
            { orderNumber: { $regex: q, $options: 'i' } }
          ]
        };
      }
    } else {
      // Search all fields
      searchQuery = {
        $or: [
          { ticketNumber: { $regex: q, $options: 'i' } },
          { customerId: { $regex: q, $options: 'i' } },
          { customerName: { $regex: q, $options: 'i' } },
          { phoneNumber: { $regex: q, $options: 'i' } },
          { orderNumber: { $regex: q, $options: 'i' } }
        ]
      };
    }
    
    const orders = await Order.find(searchQuery).sort('-orderDate');
    
    res.json({
      success: true,
      count: orders.length,
      field: field,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

