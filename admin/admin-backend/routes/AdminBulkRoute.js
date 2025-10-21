const router = require('express').Router();
const { requireAdmin } = require('../middleware/AdminAuthMiddleware');
const bulkStockFetcher = require('../services/bulkStockFetcher');

// POST /admin/bulk-fetch - start bulk fetch
router.post('/bulk-fetch', requireAdmin, async (req, res) => {
  try {
    if (bulkStockFetcher.isRunning) {
      return res.status(409).json({ success: false, message: 'Bulk fetch is already running', data: bulkStockFetcher.getProgress() });
    }
    bulkStockFetcher.fetchAllStocks().catch(err => console.error('Bulk fetch background error:', err));
    return res.json({ success: true, message: 'Bulk fetch started', data: bulkStockFetcher.getProgress() });
  } catch (error) {
    console.error('Error starting bulk fetch:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// GET /admin/bulk-fetch/progress - get progress
router.get('/bulk-fetch/progress', requireAdmin, (req, res) => {
  try {
    const progress = bulkStockFetcher.getProgress();
    return res.json({ success: true, data: progress });
  } catch (error) {
    console.error('Error getting bulk fetch progress:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// POST /admin/bulk-fetch/stop - stop bulk fetch
router.post('/bulk-fetch/stop', requireAdmin, (req, res) => {
  try {
    bulkStockFetcher.stop();
    return res.json({ success: true, message: 'Bulk fetch stopped', data: bulkStockFetcher.getProgress() });
  } catch (error) {
    console.error('Error stopping bulk fetch:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

module.exports = router;