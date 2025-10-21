const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  tradingCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  orderType: {
    type: String,
    required: true,
    enum: ['BUY', 'SELL'],
    uppercase: true
  },
  askingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serial: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for FIFO ordering
orderSchema.index({ tradingCode: 1, orderType: 1, serial: 1 });

// Index for user orders
orderSchema.index({ userId: 1 });

module.exports = mongoose.model('Order', orderSchema);