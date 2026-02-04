const Order = require('../models/Order');
const Counter = require('../models/Counter');

// Generate ticket number in format: YYMMDD-XXX-NNNNN
// e.g., 260201-001-00001 (date-store-sequence)
const generateTicketNumber = async () => {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  
  // Use daily counter for ticket numbers
  const counterId = `ticket_${datePrefix}`;
  const sequence = await Counter.getNextSequence(counterId);
  
  return `${datePrefix}-001-${String(sequence).padStart(5, '0')}`;
};

// Generate simple order number (daily sequential)
const generateOrderNumber = async () => {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  
  // Use daily counter for order numbers
  const counterId = `order_${datePrefix}`;
  const sequence = await Counter.getNextSequence(counterId);
  
  return String(sequence).padStart(3, '0');
};

// Get next ticket and order numbers (preview for form)
exports.getNextOrderNumbers = async (req, res) => {
  try {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    // Get current sequences without incrementing
    const ticketCounterId = `ticket_${datePrefix}`;
    const orderCounterId = `order_${datePrefix}`;
    
    const ticketSeq = await Counter.getCurrentSequence(ticketCounterId);
    const orderSeq = await Counter.getCurrentSequence(orderCounterId);
    
    const nextTicketSeq = ticketSeq + 1;
    const nextOrderSeq = orderSeq + 1;
    
    res.json({
      success: true,
      data: {
        ticketNumber: `${datePrefix}-001-${String(nextTicketSeq).padStart(5, '0')}`,
        orderNumber: String(nextOrderSeq).padStart(3, '0'),
        date: datePrefix,
        ticketSequence: nextTicketSeq,
        orderSequence: nextOrderSeq
      }
    });
  } catch (error) {
    console.error('Error getting next order numbers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get next order numbers'
    });
  }
};

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
      // Handle multiple statuses (comma-separated)
      if (status.includes(',')) {
        query.status = { $in: status.split(',').map(s => s.trim()) };
      } else {
        query.status = status;
      }
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

// PUBLIC: Get order by ID for QR code scanning (no auth required)
exports.getPublicOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Return only safe, public-facing data
    res.json({
      success: true,
      data: {
        ticketNumber: order.ticketNumber,
        status: order.status,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        items: order.items?.map(item => ({
          description: item.description,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: order.totalAmount,
        orderDate: order.orderDate,
        expectedDelivery: order.expectedDelivery,
        completedDate: order.completedDate,
        rackNumber: order.rackNumber,
        _id: order._id
      }
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
    const orderData = { ...req.body };
    
    // ALWAYS auto-generate ticketNumber and orderNumber to ensure proper sequencing
    // The preview numbers shown in the form are just for display purposes
    orderData.ticketNumber = await generateTicketNumber();
    orderData.orderNumber = await generateOrderNumber();
    
    const order = await Order.create(orderData);
    
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
    const receivedInWorkshopOrders = await Order.countDocuments({ status: 'Received in Workshop' });
    const tagPrintedOrders = await Order.countDocuments({ status: 'Tag Printed' });
    const readyForProcessingOrders = await Order.countDocuments({ status: 'Ready for Processing' });
    const readyForPickupOrders = await Order.countDocuments({ status: 'Ready for Pickup' });
    const pickupInProgressOrders = await Order.countDocuments({ status: 'Pickup In Progress' });
    const sortingOrders = await Order.countDocuments({ status: 'Sorting' });
    const spottingOrders = await Order.countDocuments({ status: 'Spotting' });
    const washingOrders = await Order.countDocuments({ status: 'Washing' });
    const dryCleaningOrders = await Order.countDocuments({ status: 'Dry Cleaning' });
    const dryingOrders = await Order.countDocuments({ status: 'Drying' });
    const ironingOrders = await Order.countDocuments({ status: 'Ironing' });
    const qualityCheckOrders = await Order.countDocuments({ status: 'Quality Check' });
    const packingOrders = await Order.countDocuments({ status: 'Packing' });
    const readyForDeliveryOrders = await Order.countDocuments({ status: 'Ready for Delivery' });
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
        receivedInWorkshopOrders,
        tagPrintedOrders,
        readyForProcessingOrders,
        readyForPickupOrders,
        pickupInProgressOrders,
        sortingOrders,
        spottingOrders,
        washingOrders,
        dryCleaningOrders,
        dryingOrders,
        ironingOrders,
        qualityCheckOrders,
        packingOrders,
        readyForDeliveryOrders,
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

// Convert tag number to ticket number search pattern
// Tag format: GT-MMDD-SEQ (e.g., GT-0109-001)
// Ticket format: YYMMDD-001-NNNNN (e.g., 260109-001-00001)
const tagNumberToTicketPattern = (tagNumber) => {
  if (!tagNumber) return null;
  
  const match = tagNumber.toUpperCase().match(/^GT-(\d{4})-(\d{3,5})$/);
  if (!match) return null;
  
  const mmdd = match[1]; // e.g., "0109"
  const seq = match[2];   // e.g., "001"
  
  // Return pattern: MMDD portion and sequence (padded to 5 digits)
  // This will match tickets like "260109-001-00001"
  const paddedSeq = seq.padStart(5, '0');
  return `${mmdd}-001-${paddedSeq}`;
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
    let searchValue = q;
    
    // Handle tag number search - convert to ticket number pattern
    if (field === 'tagNumber') {
      const ticketPattern = tagNumberToTicketPattern(q);
      if (ticketPattern) {
        // Search ticket number with the converted pattern
        searchQuery = { ticketNumber: { $regex: ticketPattern, $options: 'i' } };
      } else {
        // Invalid tag format, try searching as-is
        searchQuery = { ticketNumber: { $regex: q, $options: 'i' } };
      }
    }
    // Field-specific search
    else if (field && field !== 'all') {
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
      // Search all fields - also check if query looks like a tag number
      const tagPattern = tagNumberToTicketPattern(q);
      const ticketSearches = [{ ticketNumber: { $regex: q, $options: 'i' } }];
      
      // If query looks like a tag number, also search by converted pattern
      if (tagPattern) {
        ticketSearches.push({ ticketNumber: { $regex: tagPattern, $options: 'i' } });
      }
      
      searchQuery = {
        $or: [
          ...ticketSearches,
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

// Assign order to delivery person
exports.assignOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, assignedToName } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      id,
      {
        assignedTo: assignedTo,
        assignedToName: assignedToName,
        assignedAt: new Date()
      },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      message: `Order assigned to ${assignedToName}`,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Unassign order
exports.unassignOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findByIdAndUpdate(
      id,
      {
        assignedTo: null,
        assignedToName: '',
        assignedAt: null
      },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Order unassigned',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get orders assigned to current user (for delivery dashboard)
exports.getMyAssignedOrders = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = req.user._id;
    
    // Convert to ObjectId for proper comparison (handles both string and ObjectId)
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    
    // Only return orders that need action (not completed ones)
    const orders = await Order.find({
      assignedTo: userObjectId,
      status: { 
        $in: ['Ready for Pickup', 'Ready for Delivery', 'Out for Delivery'] 
      }
    }).sort('-assignedAt');
    
    console.log(`[getMyAssignedOrders] User: ${userId}, Found: ${orders.length} orders`);
    
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('[getMyAssignedOrders] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all delivery personnel (users with delivery role)
exports.getDeliveryPersonnel = async (req, res) => {
  try {
    const User = require('../models/User');
    const deliveryUsers = await User.find({ 
      role: 'delivery',
      isActive: true
    }).select('_id name email role isActive');
    
    res.json({
      success: true,
      data: deliveryUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

