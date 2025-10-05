const { AdminSignup, AdminLogin } = require('../controllers/adminAuthController');
const { userVerification } = require('../middleware/AdminAuthMiddleware');
const router = require('express').Router();

router.post('/signup', AdminSignup);
router.post('/login', AdminLogin);
router.post('/verify', userVerification);

module.exports = router;