const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  sequence: {
    type: Number,
    default: 0
  },
  prefix: {
    type: String,
    default: ''
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Static method to get the next sequence number
counterSchema.statics.getNextSequence = async function(counterId, prefix = '') {
  const counter = await this.findByIdAndUpdate(
    counterId,
    { 
      $inc: { sequence: 1 },
      $set: { lastUpdated: new Date(), prefix: prefix }
    },
    { new: true, upsert: true }
  );
  return counter.sequence;
};

// Static method to get current sequence without incrementing
counterSchema.statics.getCurrentSequence = async function(counterId) {
  const counter = await this.findById(counterId);
  return counter ? counter.sequence : 0;
};

// Static method to reset sequence (admin use only)
counterSchema.statics.resetSequence = async function(counterId, newValue = 0) {
  const counter = await this.findByIdAndUpdate(
    counterId,
    { 
      $set: { sequence: newValue, lastUpdated: new Date() }
    },
    { new: true, upsert: true }
  );
  return counter.sequence;
};

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;
