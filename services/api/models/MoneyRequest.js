const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  action: { type: String, enum: ['Created', 'Approved', 'Rejected', 'Modified'], required: true },
  amountBefore: { type: Number },
  amountAfter: { type: Number },
  notes: { type: String, default: '' },
  actorRole: { type: String, enum: ['user', 'admin'], required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, refPath: 'actorRole', required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const moneyRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestedAmount: { type: Number, required: true, min: 0 },
  transactionId: { type: String, required: true, unique: true, trim: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Modified'], default: 'Pending' },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  history: { type: [historySchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('MoneyRequest', moneyRequestSchema);