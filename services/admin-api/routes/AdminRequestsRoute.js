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

// Modify amount with auto-approval and purchase power application
router.post('/requests/:id/modify', requireAdmin, async (req, res) => {
  try {
    const { newAmount } = req.body;
    if (typeof newAmount !== 'number' || newAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }
    const reqDoc = await MoneyRequest.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ success: false, message: 'Request not found' });

    const amountBefore = reqDoc.requestedAmount;
    reqDoc.requestedAmount = newAmount;

    // Apply to user's purchase power immediately (auto-approve on modify)
    const user = await User.findById(reqDoc.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found for request' });

    // If request had been previously approved, adjust delta; otherwise credit full new amount.
    let delta = newAmount;
    if (reqDoc.status === 'Approved') {
      delta = newAmount - amountBefore;
    }
    user.purchasePower += delta;
    await user.save();

    // Record history as modified then approved
    reqDoc.history.push({
      action: 'Modified',
      amountBefore,
      amountAfter: newAmount,
      notes: '',
      actorRole: 'admin',
      actorId: req.admin._id,
    });
    reqDoc.status = 'Approved';
    reqDoc.approvedAt = new Date();
    reqDoc.rejectedAt = undefined;
    reqDoc.history.push({
      action: 'Approved',
      amountBefore: newAmount,
      amountAfter: newAmount,
      notes: 'Auto-approved on modify',
      actorRole: 'admin',
      actorId: req.admin._id,
    });

    await reqDoc.save();
    res.json({ success: true, data: reqDoc });
  } catch (err) {
    console.error('Modify request error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete a request (for Approved/Rejected cleanup)
router.delete('/requests/:id', requireAdmin, async (req, res) => {
  try {
    const reqDoc = await MoneyRequest.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ success: false, message: 'Request not found' });
    await MoneyRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;