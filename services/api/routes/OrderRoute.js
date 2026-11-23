const router = require('express').Router();
const { requireUser } = require('../middleware/AuthMiddleware');
const Order = require('../models/Order');
const User = require('../models/User');
const Stock = require('../models/Stock');
async function capacity(userId, code, type, price, qty, exclude) {
  if(!await Stock.exists({tradingCode:code})) return 'Unknown stock';
  const user=await User.findById(userId);if(!user)return 'User not found';
  const pending=await Order.find({userId,orderType:type,...(exclude?{_id:{$ne:exclude}}:{}),...(type==='SELL'?{tradingCode:code}:{})});
  const reserved=pending.reduce((n,o)=>n+(type==='BUY'?o.quantity*o.askingPrice:o.quantity),0);
  if(type==='BUY'&&user.purchasePower-reserved<price*qty)return 'Insufficient unreserved purchase power';
  if(type==='SELL'&&(user.portfolio.find(p=>p.stock===code)?.quantity || 0)-reserved<qty)return 'Insufficient unreserved holdings';
  return null;
}

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
    if(!['BUY','SELL'].includes(type)) return res.status(400).json({success:false,message:'Invalid order type'});
    const error=await capacity(req.userId,code,type,priceNum,qtyNum);
    if(error)return res.status(400).json({success:false,message:error});

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

// List current user's orders
// GET /api/orders/mine
router.get('/mine', requireUser, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders, count: orders.length });
  } catch (err) {
    console.error('Error listing my orders:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Edit and resubmit an order: cancels the original and creates a new one
// POST /api/orders/:id/resubmit { orderType?, askingPrice?, quantity?, tradingCode? }
router.post('/:id/resubmit', requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { orderType, askingPrice, quantity, tradingCode } = req.body;
    const existing = await Order.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Order not found' });
    if (String(existing.userId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const code = String(tradingCode || existing.tradingCode).toUpperCase();
    const type = String(orderType || existing.orderType).toUpperCase();
    const priceNum = Number(askingPrice ?? existing.askingPrice);
    const qtyNum = Number(quantity ?? existing.quantity);

    if (!['BUY', 'SELL'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid orderType' });
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return res.status(400).json({ success: false, message: 'askingPrice must be a positive number' });
    }
    if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
      return res.status(400).json({ success: false, message: 'quantity must be a positive integer' });
    }

    const error=await capacity(req.userId,code,type,priceNum,qtyNum,id);
    if(error)return res.status(400).json({success:false,message:error});

    // Cancel the original order by deleting it to avoid matching engine consuming it
    try {
      await Order.deleteOne({ _id: existing._id });
    } catch (_) {}

    // Compute serial for FIFO within tradingCode + type
    const serial = await Order.countDocuments({ tradingCode: code, orderType: type }) + 1;

    const newOrder = await Order.create({
      tradingCode: code,
      orderType: type,
      askingPrice: priceNum,
      quantity: qtyNum,
      userId: req.userId,
      serial,
      status: 'PENDING',
    });

    res.status(201).json({ success: true, message: 'Order resubmitted', data: newOrder });
  } catch (err) {
    console.error('Error resubmitting order:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete an order (owned by current user)
router.delete('/:id', requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (String(order.userId) !== String(req.userId)) {
      return res.status(403).json({ message: 'Not authorized to delete this order' });
    }
    await Order.deleteOne({ _id: id });
    return res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    console.error('Error deleting order:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;