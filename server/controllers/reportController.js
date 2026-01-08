const Order = require('../models/Order');
const Customer = require('../models/Customer');
const User = require('../models/User');

// Helper to get date ranges
const getDateRange = (period) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  switch (period) {
    case 'today':
      return { start: startOfToday, end: endOfToday };
    case 'yesterday':
      const yesterday = new Date(startOfToday);
      yesterday.setDate(yesterday.getDate() - 1);
      const endYesterday = new Date(yesterday);
      endYesterday.setHours(23, 59, 59, 999);
      return { start: yesterday, end: endYesterday };
    case 'week':
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      return { start: startOfWeek, end: endOfToday };
    case 'month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfMonth, end: endOfToday };
    case 'lastMonth':
      const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start: startLastMonth, end: endLastMonth };
    case 'year':
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { start: startOfYear, end: endOfToday };
    case 'last7days':
      const last7 = new Date(startOfToday);
      last7.setDate(last7.getDate() - 7);
      return { start: last7, end: endOfToday };
    case 'last30days':
      const last30 = new Date(startOfToday);
      last30.setDate(last30.getDate() - 30);
      return { start: last30, end: endOfToday };
    default:
      return { start: startOfToday, end: endOfToday };
  }
};

// Get dashboard overview
exports.getDashboardStats = async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    const { start, end } = getDateRange(period);
    const prevPeriod = getDateRange(period === 'today' ? 'yesterday' : 'lastMonth');

    // Current period stats
    const currentOrders = await Order.find({
      orderDate: { $gte: start, $lte: end }
    });

    const currentRevenue = currentOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const currentOrderCount = currentOrders.length;
    const currentDelivered = currentOrders.filter(o => o.status === 'Delivered').length;

    // Previous period stats for comparison
    const prevOrders = await Order.find({
      orderDate: { $gte: prevPeriod.start, $lte: prevPeriod.end }
    });
    const prevRevenue = prevOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const prevOrderCount = prevOrders.length;

    // New customers this period
    const newCustomers = await Customer.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // Calculate growth
    const revenueGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 0;
    const orderGrowth = prevOrderCount > 0 ? ((currentOrderCount - prevOrderCount) / prevOrderCount * 100).toFixed(1) : 0;

    // Average order value
    const avgOrderValue = currentOrderCount > 0 ? (currentRevenue / currentOrderCount).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        period,
        dateRange: { start, end },
        orders: {
          total: currentOrderCount,
          delivered: currentDelivered,
          pending: currentOrderCount - currentDelivered,
          growth: parseFloat(orderGrowth)
        },
        revenue: {
          total: currentRevenue,
          growth: parseFloat(revenueGrowth),
          avgOrderValue: parseFloat(avgOrderValue)
        },
        customers: {
          new: newCustomers
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get revenue trends
exports.getRevenueTrends = async (req, res) => {
  try {
    const { period = 'last30days' } = req.query;
    const { start, end } = getDateRange(period);

    const orders = await Order.find({
      orderDate: { $gte: start, $lte: end }
    }).sort({ orderDate: 1 });

    // Group by date
    const dailyRevenue = {};
    orders.forEach(order => {
      const date = order.orderDate.toISOString().split('T')[0];
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = { date, revenue: 0, orders: 0 };
      }
      dailyRevenue[date].revenue += order.totalAmount || 0;
      dailyRevenue[date].orders += 1;
    });

    const trends = Object.values(dailyRevenue).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get orders by status
exports.getOrdersByStatus = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { start, end } = getDateRange(period);

    const statusCounts = await Order.aggregate([
      { $match: { orderDate: { $gte: start, $lte: end } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const data = statusCounts.map(s => ({
      status: s._id,
      count: s.count
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get top customers
exports.getTopCustomers = async (req, res) => {
  try {
    const { period = 'month', limit = 10 } = req.query;
    const { start, end } = getDateRange(period);

    const topCustomers = await Order.aggregate([
      { $match: { orderDate: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$phoneNumber',
          customerName: { $first: '$customerName' },
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: topCustomers.map((c, idx) => ({
        rank: idx + 1,
        phone: c._id,
        name: c.customerName,
        totalSpent: c.totalSpent,
        orders: c.orderCount
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get popular services
exports.getPopularServices = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { start, end } = getDateRange(period);

    const orders = await Order.find({
      orderDate: { $gte: start, $lte: end }
    });

    // Extract and count services from items
    const serviceCounts = {};
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        const service = item.description || 'Unknown';
        if (!serviceCounts[service]) {
          serviceCounts[service] = { name: service, count: 0, revenue: 0 };
        }
        serviceCounts[service].count += item.quantity || 1;
        serviceCounts[service].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });

    const data = Object.values(serviceCounts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get staff performance
exports.getStaffPerformance = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { start, end } = getDateRange(period);

    const staffStats = await Order.aggregate([
      { $match: { orderDate: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$servedBy',
          ordersHandled: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { ordersHandled: -1 } }
    ]);

    res.json({
      success: true,
      data: staffStats.map((s, idx) => ({
        rank: idx + 1,
        name: s._id || 'Unknown',
        ordersHandled: s.ordersHandled,
        totalRevenue: s.totalRevenue,
        avgOrderValue: Math.round(s.avgOrderValue)
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get peak hours analysis
exports.getPeakHours = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { start, end } = getDateRange(period);

    const orders = await Order.find({
      orderDate: { $gte: start, $lte: end }
    });

    // Analyze by day of week and hour
    const hourlyData = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    orders.forEach(order => {
      const date = new Date(order.orderDate);
      const day = dayNames[date.getDay()];
      const hour = date.getHours();
      
      const key = `${day}-${hour}`;
      if (!hourlyData[key]) {
        hourlyData[key] = { day, hour, count: 0, revenue: 0 };
      }
      hourlyData[key].count += 1;
      hourlyData[key].revenue += order.totalAmount || 0;
    });

    // Also get hourly summary
    const hourlySummary = {};
    orders.forEach(order => {
      const hour = new Date(order.orderDate).getHours();
      if (!hourlySummary[hour]) {
        hourlySummary[hour] = { hour, count: 0 };
      }
      hourlySummary[hour].count += 1;
    });

    res.json({
      success: true,
      data: {
        heatmap: Object.values(hourlyData),
        hourly: Object.values(hourlySummary).sort((a, b) => a.hour - b.hour)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Export report data
exports.exportReport = async (req, res) => {
  try {
    const { type = 'orders', period = 'month', format = 'csv' } = req.query;
    const { start, end } = getDateRange(period);

    let data = [];
    let filename = '';

    if (type === 'orders') {
      const orders = await Order.find({
        orderDate: { $gte: start, $lte: end }
      }).sort({ orderDate: -1 });

      data = orders.map(o => ({
        'Ticket Number': o.ticketNumber,
        'Customer Name': o.customerName,
        'Phone': o.phoneNumber,
        'Order Date': o.orderDate.toISOString().split('T')[0],
        'Status': o.status,
        'Total Amount': o.totalAmount,
        'Payment Status': o.paymentStatus,
        'Payment Method': o.paymentMethod
      }));
      filename = `orders_report_${period}`;
    } else if (type === 'revenue') {
      const orders = await Order.find({
        orderDate: { $gte: start, $lte: end }
      });

      // Group by date
      const dailyRevenue = {};
      orders.forEach(order => {
        const date = order.orderDate.toISOString().split('T')[0];
        if (!dailyRevenue[date]) {
          dailyRevenue[date] = { date, orders: 0, revenue: 0 };
        }
        dailyRevenue[date].orders += 1;
        dailyRevenue[date].revenue += order.totalAmount || 0;
      });

      data = Object.values(dailyRevenue).sort((a, b) => new Date(a.date) - new Date(b.date));
      data = data.map(d => ({
        'Date': d.date,
        'Orders': d.orders,
        'Revenue': d.revenue
      }));
      filename = `revenue_report_${period}`;
    } else if (type === 'customers') {
      const topCustomers = await Order.aggregate([
        { $match: { orderDate: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: '$phoneNumber',
            customerName: { $first: '$customerName' },
            totalSpent: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalSpent: -1 } }
      ]);

      data = topCustomers.map((c, idx) => ({
        'Rank': idx + 1,
        'Customer Name': c.customerName,
        'Phone': c._id,
        'Total Spent': c.totalSpent,
        'Order Count': c.orderCount
      }));
      filename = `customers_report_${period}`;
    }

    if (format === 'csv') {
      // Generate CSV
      if (data.length === 0) {
        return res.status(404).json({ success: false, error: 'No data to export' });
      }

      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      
      data.forEach(row => {
        const values = headers.map(h => {
          const val = row[h];
          // Escape commas and quotes
          if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        });
        csvRows.push(values.join(','));
      });

      const csv = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
      res.send(csv);
    } else {
      res.json({ success: true, data, filename });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get summary for a custom date range
exports.getCustomRangeReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Start and end dates required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      orderDate: { $gte: start, $lte: end }
    });

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const delivered = orders.filter(o => o.status === 'Delivered').length;

    // Status breakdown
    const statusCounts = {};
    orders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        dateRange: { start, end },
        totalOrders: orders.length,
        totalRevenue,
        delivered,
        avgOrderValue: orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : 0,
        statusBreakdown: statusCounts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

