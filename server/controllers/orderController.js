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
      limit = 20,
      inProcess,
      today
    } = req.query;
    
    let query = {};
    
    // Handle special "In Process" filter
    if (inProcess === 'true') {
      query.status = { 
        $in: ['Sorting', 'Spotting', 'Washing', 'Dry Cleaning', 'Drying', 'Ironing', 'Quality Check', 'Packing'] 
      };
    } else if (status) {
      query.status = status;
    }
    
    // Handle special "Today" filter
    if (today === 'true') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      query.orderDate = { $gte: todayStart, $lte: todayEnd };
    } else if (startDate || endDate) {
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
    
    // Send order confirmation notification (async, don't wait)
    const notificationService = require('../services/notificationService');
    const notificationType = process.env.NOTIFICATION_TYPE || 'both'; // sms, whatsapp, or both
    notificationService.sendOrderNotification(order, 'confirmation', notificationType)
      .catch(err => console.error('Failed to send order confirmation notification:', err));
    
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
    
    // Get previous status before update
    const previousOrder = await Order.findById(req.params.id);
    const previousStatus = previousOrder ? previousOrder.status : null;
    
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
    
    // Send notifications based on status change (async, don't wait)
    const notificationService = require('../services/notificationService');
    const notificationType = process.env.NOTIFICATION_TYPE || 'both';
    
    // Send notification for important status changes
    if (status === 'Ready for Pickup') {
      notificationService.sendOrderNotification(order, 'ready', notificationType)
        .catch(err => console.error('Failed to send ready notification:', err));
    } else if (status === 'Delivered') {
      notificationService.sendOrderNotification(order, 'delivered', notificationType)
        .catch(err => console.error('Failed to send delivered notification:', err));
    } else if (['Sorting', 'Washing', 'Ironing', 'Quality Check', 'Packing', 'Out for Delivery'].includes(status)) {
      // Send status update for key processing stages
      notificationService.sendOrderNotification(order, 'statusUpdate', notificationType, previousStatus)
        .catch(err => console.error('Failed to send status update notification:', err));
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
    // Disable caching for stats - they change frequently
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
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

