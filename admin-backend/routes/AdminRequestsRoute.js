const router = require('express').Router();
const { requireAdmin } = require('../middleware/AdminAuthMiddleware');
const MoneyRequest = require('../models/MoneyRequest');
const User = require('../models/User');

router.get('/requests', requireAdmin, async (req, res) => {
  try {
    const { status = 'Pending', q = '', sort = 'createdAt:desc' } = req.query;
    const [sortField, sortDir] = sort.split(':');
    const sortSpec = { [sortField || 'createdAt']: (sortDir === 'asc' ? 1 : -1) };
    const filter = { status };
    if (q.trim()) filter.transactionId = new RegExp(q.trim(), 'i');
    const requests = await MoneyRequest.find(filter).sort(sortSpec);
    res.json({ success: true, data: requests, count: requests.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/requests/:id/accept', requireAdmin, async (req, res) => {
  try {
    const reqDoc = await MoneyRequest.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ success: false, message: 'Request not found' });
    const before = reqDoc.requestedAmount;
    const user = await User.findById(reqDoc.userId);
    user.purchasePower += before;
    await user.save();
    reqDoc.status = 'Approved';
    reqDoc.approvedAt = new Date();
    reqDoc.history.push({
      action: 'Approved',
      amountBefore: before,
      amountAfter: before,
      notes: '',
      actorRole: 'admin',
      actorId: req.admin._id,
    });
    await reqDoc.save();
    res.json({ success: true, data: reqDoc });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/requests/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { reason = '' } = req.body;
    const reqDoc = await MoneyRequest.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ success: false, message: 'Request not found' });
    const before = reqDoc.requestedAmount;
    reqDoc.status = 'Rejected';
    reqDoc.rejectedAt = new Date();
    reqDoc.history.push({
      action: 'Rejected',
      amountBefore: before,
      amountAfter: before,
      notes: reason,
      actorRole: 'admin',
      actorId: req.admin._id,
    });
    await reqDoc.save();
    res.json({ success: true, data: reqDoc });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/requests/:id/modify', requireAdmin, async (req, res) => {
  try {
    const { newAmount } = req.body;
    if (typeof newAmount !== 'number' || newAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }
    const reqDoc = await MoneyRequest.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ success: false, message: 'Request not found' });
    const before = reqDoc.requestedAmount;
    reqDoc.requestedAmount = newAmount;
    reqDoc.status = 'Modified';
    reqDoc.history.push({
      action: 'Modified',
      amountBefore: before,
      amountAfter: newAmount,
      notes: '',
      actorRole: 'admin',
      actorId: req.admin._id,
    });
    await reqDoc.save();
    res.json({ success: true, data: reqDoc });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;