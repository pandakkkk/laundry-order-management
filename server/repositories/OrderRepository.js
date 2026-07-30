const Order = require('../models/Order');
const Counter = require('../models/Counter');

class OrderRepository {
  async generateTicketNumber() {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    const counterId = `ticket_${datePrefix}`;
    const sequence = await Counter.getNextSequence(counterId);
    
    return `${datePrefix}-001-${String(sequence).padStart(5, '0')}`;
  }

  async generateOrderNumber() {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    const counterId = `order_${datePrefix}`;
    const sequence = await Counter.getNextSequence(counterId);
    
    return String(sequence).padStart(3, '0');
  }

  async findById(id) {
    return Order.findById(id);
  }

  async findOne(query) {
    return Order.findOne(query);
  }

  async findAll(query, { sortBy = '-orderDate', limit = 20, skip = 0 }) {
    return Order.find(query).sort(sortBy).limit(parseInt(limit)).skip(parseInt(skip));
  }

  async count(query) {
    return Order.countDocuments(query);
  }

  async create(orderData) {
    // If ticketNumber is missing or already exists in DB, generate a new ticket number
    if (!orderData.ticketNumber || (await Order.exists({ ticketNumber: orderData.ticketNumber }))) {
      orderData.ticketNumber = await this.generateTicketNumber();
    }
    if (!orderData.orderNumber) {
      orderData.orderNumber = await this.generateOrderNumber();
    }

    try {
      return await Order.create(orderData);
    } catch (err) {
      // Fail-safe: Handle race conditions or duplicate ticketNumber key errors
      if (err.code === 11000 && (err.message?.includes('ticketNumber') || err.keyPattern?.ticketNumber)) {
        orderData.ticketNumber = await this.generateTicketNumber();
        orderData.orderNumber = await this.generateOrderNumber();
        return await Order.create(orderData);
      }
      throw err;
    }
  }

  async updateById(id, updateData, options = { new: true }) {
    return Order.findByIdAndUpdate(id, updateData, options);
  }

  async deleteById(id) {
    return Order.findByIdAndDelete(id);
  }
}

module.exports = new OrderRepository();
