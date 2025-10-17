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

module.exports = router;