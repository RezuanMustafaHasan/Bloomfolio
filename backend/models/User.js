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

userSchema.pre("save", async function () {
  this.password = await bcrypt.hash(this.password, 12);
});



module.exports = mongoose.model('User', userSchema);