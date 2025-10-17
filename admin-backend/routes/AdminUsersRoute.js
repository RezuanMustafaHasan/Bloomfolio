const router = require('express').Router();
const { requireAdmin } = require('../middleware/AdminAuthMiddleware');
const mongoose = require('mongoose');

// Reuse existing User model from main backend (sibling directory)
const User = require('../models/User');

// List users with optional search query
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    let filter = {};
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      filter = { $or: [{ name: regex }, { email: regex }] };
    }
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users, count: users.length });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get single user
router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete user
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/assign-stock', requireAdmin, async (req, res) => {
  try {
    const { email, tradingCode, quantity } = req.body;
    if (!email || !tradingCode || typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Provide email, tradingCode, and positive quantity' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const existing = user.portfolio.find(p => p.stock === tradingCode);
    if (existing) {
      existing.quantity += quantity;
    } else {
      user.portfolio.push({ stock: tradingCode, quantity, buyPrice: 0, date: new Date() });
    }
    await user.save();
    res.json({ success: true, message: 'Stock assigned successfully', data: { email, tradingCode, quantity } });
  } catch (error) {
    console.error('Assign stock error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;