// models/MilkEntry.js
const mongoose = require('mongoose');
import mysqlConnection from '../config/database';
// Define the schema for milk entry data
const milkEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  milkType: {
    type: String,
    required: true,
    enum: ['morning', 'evening']
  },
  liters: {
    type: Number,
    required: true,
    min: 0
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  cashReceived: {
    type: Number,
    required: true,
    min: 0
  },
  creditDue: {
    type: Number,
    required: true,
    min: 0
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create and export the MilkEntry model
const MilkEntry = mongoose.model('MilkEntry', milkEntrySchema);

module.exports = MilkEntry;
