const router = require('express').Router();
const { requireUser } = require('../middleware/AuthMiddleware');
const Order = require('../models/Order');
const User = require('../models/User');

// List orders for a trading code, optionally filtered by orderType
// GET /api/orders?tradingCode=SIBL&orderType=BUY
router.get('/', async (req, res) => {
  try {
    const { tradingCode, orderType } = req.query;
    if (!tradingCode) {
      return res.status(400).json({ success: false, message: 'tradingCode is required' });
    }
    const filter = { tradingCode: String(tradingCode).toUpperCase() };
    if (orderType) filter.orderType = String(orderType).toUpperCase();

    const orders = await Order.find(filter).sort({ createdAt: -1, serial: 1 });
    res.json({ success: true, data: orders, count: orders.length });
  } catch (err) {
    console.error('Error listing orders:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create a new order (BUY/SELL)
// POST /api/orders { tradingCode, orderType, askingPrice, quantity }
router.post('/', requireUser, async (req, res) => {
  try {
    const { tradingCode, orderType, askingPrice, quantity } = req.body;
    if (!tradingCode || !orderType) {
      return res.status(400).json({ success: false, message: 'tradingCode and orderType are required' });
    }
    const priceNum = Number(askingPrice);
    const qtyNum = Number(quantity);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return res.status(400).json({ success: false, message: 'askingPrice must be a positive number' });
    }
    if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
      return res.status(400).json({ success: false, message: 'quantity must be a positive integer' });
    }

    const code = String(tradingCode).toUpperCase();
    const type = String(orderType).toUpperCase();

    // Compute serial for FIFO within tradingCode + type
    const serial = await Order.countDocuments({ tradingCode: code, orderType: type }) + 1;

    const order = await Order.create({
      tradingCode: code,
      orderType: type,
      askingPrice: priceNum,
      quantity: qtyNum,
      userId: req.userId,
      serial,
      status: 'PENDING',
    });
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;