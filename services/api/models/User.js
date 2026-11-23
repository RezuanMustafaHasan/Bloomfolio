const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  orderList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  portfolio: [{
    stock: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    buyPrice: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  // --- New: Transaction history for executed trades ---
  transactionHistory: [{
    action: { type: String, enum: ['BUY', 'SELL'], required: true },
    tradingCode: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    // orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    // matchedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: new Date(),
  },
  purchasePower: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

userSchema.pre("save", async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Block password changes via update operations (must use dedicated password route)
function blockPasswordUpdate(next) {
  const update = this.getUpdate() || {};
  const target = update.$set || update;
  if (Object.prototype.hasOwnProperty.call(target, 'password')) {
    return next(new Error('Password updates are not allowed via update operations'));
  }
  next();
}

userSchema.pre('findOneAndUpdate', blockPasswordUpdate);
userSchema.pre('updateOne', blockPasswordUpdate);
userSchema.pre('updateMany', blockPasswordUpdate);

module.exports = mongoose.model('User', userSchema);