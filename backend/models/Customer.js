const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique customer names per user
customerSchema.index({ name: 1, userId: 1 }, { unique: true });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer; 