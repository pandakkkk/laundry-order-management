const EventEmitter = require('events');

class OrderEventEmitter extends EventEmitter {}

const orderEvents = new OrderEventEmitter();

const ORDER_EVENTS = {
  CREATED: 'order:created',
  STATUS_UPDATED: 'order:status_updated',
  CANCELLED: 'order:cancelled',
  DELIVERED: 'order:delivered'
};

module.exports = {
  orderEvents,
  ORDER_EVENTS
};
