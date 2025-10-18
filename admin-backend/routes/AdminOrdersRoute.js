const router = require('express').Router();
const mongoose = require('mongoose');
const { requireAdmin } = require('../middleware/AdminAuthMiddleware');

// Delete all documents from the orders collection
router.delete('/orders', requireAdmin, async (req, res) => {
  try {
    const collection = mongoose.connection.collection('orders');
    const result = await collection.deleteMany({});
    res.json({ success: true, message: 'All orders deleted', deletedCount: result?.deletedCount || 0 });
  } catch (err) {
    console.error('Error deleting all orders:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;