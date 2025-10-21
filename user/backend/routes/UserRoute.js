const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireUser } = require('../middleware/AuthMiddleware');

// GET /users/:id -> return user document (without password)
router.get('/:id', requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password -__v');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /users/:id/portfolio/:tradingCode -> return holding info for a specific stock
router.get('/:id/portfolio/:tradingCode', requireUser, async (req, res) => {
  try {
    const { id, tradingCode } = req.params;
    // Ensure a user can only access their own portfolio
    if (String(req.userId) !== String(id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const user = await User.findById(id).select('portfolio');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const code = String(tradingCode).toUpperCase();
    const entry = user.portfolio.find(p => String(p.stock).toUpperCase() === code);
    const quantity = entry ? Number(entry.quantity) : 0;
    const buyPrice = entry ? Number(entry.buyPrice) : 0;

    return res.json({ success: true, data: { stock: code, quantity, buyPrice, date: entry?.date || null } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;