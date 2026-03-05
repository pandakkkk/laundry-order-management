const Order = require('../models/Order');
const Counter = require('../models/Counter');

const generateTicketNumber = async () => {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  const sequence = await Counter.getNextSequence(`ticket_${datePrefix}`);
  return `${datePrefix}-001-${String(sequence).padStart(5, '0')}`;
};

const generateOrderNumber = async () => {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  const sequence = await Counter.getNextSequence(`order_${datePrefix}`);
  return String(sequence).padStart(3, '0');
};

// POST /api/public/orders
exports.createPublicOrder = async (req, res) => {
  try {
    const { name, phone, address, pickupDate, items } = req.body;

    if (!name || !phone || !address || !pickupDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, phone, address, pickupDate'
      });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, error: 'Invalid phone number' });
    }

    const orderDate = new Date(pickupDate);
    if (isNaN(orderDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid pickupDate' });
    }

    // Build order items from cart (or fallback placeholder)
    let orderItems;
    let totalAmount;

    if (Array.isArray(items) && items.length > 0) {
      orderItems = items.map(item => ({
        description: item.name,
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        productId: item.productId || ''
      }));
      totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    } else {
      return res.status(400).json({ success: false, error: 'At least one item is required' });
    }

    // Delivery: 72h from pickup for all website bookings (staff adjusts as needed)
    const expectedDelivery = new Date(orderDate.getTime() + 72 * 60 * 60 * 1000);

    const ticketNumber = await generateTicketNumber();
    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      ticketNumber,
      orderNumber,
      customerName: name.trim(),
      phoneNumber: cleanPhone,
      orderDate,
      expectedDelivery,
      items: orderItems,
      totalAmount,
      notes: `Pickup address: ${address.trim()}`,
      location: address.trim(),
      source: 'website',
      servedBy: 'Website Booking',
      status: 'Booking Confirmed',
      paymentStatus: 'Pending',
      paymentMethod: 'Cash'
    });

    // Notify async — don't block response
    const notificationService = require('../services/notificationService');
    notificationService.sendOrderNotification(order, 'confirmation', process.env.NOTIFICATION_TYPE || 'both')
      .catch(err => console.error('Public order notification failed:', err));

    res.status(201).json({
      success: true,
      data: {
        ticketNumber: order.ticketNumber,
        orderId: order._id,
        expectedDelivery: order.expectedDelivery,
        totalAmount: order.totalAmount
      }
    });
  } catch (error) {
    console.error('createPublicOrder error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
};

// GET /api/public/orders/:ticketNumber
exports.getPublicOrderStatus = async (req, res) => {
  try {
    const order = await Order.findOne({ ticketNumber: req.params.ticketNumber });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({
      success: true,
      data: {
        ticketNumber: order.ticketNumber,
        status: order.status,
        expectedDelivery: order.expectedDelivery
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
