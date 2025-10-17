const express = require('express');
const router = express.Router();

router.use('/requests', require('./RequestRoute'));

// Example route
router.get('/test', (req, res) => {
  res.json({ message: 'API routes are working!' });
});

// Add more routes here as needed
// router.use('/auth', require('./auth'));
// router.use('/users', require('./users'));
// router.use('/stocks', require('./stocks'));


module.exports = router;