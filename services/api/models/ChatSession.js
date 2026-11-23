const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: { type: String, enum: ['user', 'ai'], required: true },
  text: { type: String, required: true },
  ts: { type: Date, default: Date.now },
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  title: { type: String, required: true, trim: true },
  tradingCodes: { type: [String], default: [] },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true });

// Indexes for fast per-user listing and recent sessions
chatSessionSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);