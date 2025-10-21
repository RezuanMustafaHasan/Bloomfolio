const router = require('express').Router();
const { requireUser } = require('../middleware/AuthMiddleware');
const MoneyRequest = require('../models/MoneyRequest');

router.post('/', requireUser, async (req, res) => {
  try {
    const { requestedAmount, transactionId } = req.body;
    if (typeof requestedAmount !== 'number' || requestedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }
    const exists = await MoneyRequest.findOne({ transactionId });
    if (exists) return res.status(409).json({ success: false, message: 'Transaction ID already exists' });

    const doc = await MoneyRequest.create({
      userId: req.userId,
      requestedAmount,
      transactionId,
      status: 'Pending',
      history: [{
        action: 'Created',
        amountBefore: null,
        amountAfter: requestedAmount,
        notes: '',
        actorRole: 'user',
        actorId: req.userId,
      }],
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/mine', requireUser, async (req, res) => {
  try {
    const list = await MoneyRequest.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: list, count: list.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;