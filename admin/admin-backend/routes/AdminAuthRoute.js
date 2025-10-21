const { AdminSignup, AdminLogin, AdminLogout } = require('../controllers/adminAuthController');
const { userVerification } = require('../middleware/AdminAuthMiddleware');
const router = require('express').Router();

router.post('/signup', AdminSignup);
router.post('/login', AdminLogin);
router.post('/logout', AdminLogout);
router.post('/verify', userVerification);

module.exports = router;