const Order = require('../models/Order');

// GET /api/customer/orders?limit=&page=
exports.list = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const skip = (page - 1) * limit;

    const query = { customerRef: req.customer._id };
    const [orders, total] = await Promise.all([
      Order.find(query)
        .select(
          'ticketNumber orderNumber totalAmount discountAmount walletApplied couponCode paymentMethod paymentStatus status orderDate expectedDelivery items'
        )
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ]);

    return res.json({ success: true, data: orders, total, page, limit });
  } catch (error) {
    console.error('customer orders list error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load orders' });
  }
};

// GET /api/customer/orders/:ticketNumber
exports.get = async (req, res) => {
  try {
    const order = await Order.findOne({
      customerRef: req.customer._id,
      ticketNumber: req.params.ticketNumber
    }).lean();
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    return res.json({ success: true, data: order });
  } catch (error) {
    console.error('customer order get error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load order' });
  }
};
