const express = require('express');
const router = express.Router();
const { registerCitizen, loginCitizen, loginOfficer, getMe, forgotPasswordRequest, forgotPasswordVerify, forgotPasswordReset } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerCitizen);
router.post('/citizen-login', loginCitizen);
router.post('/officer-login', loginOfficer);
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});
router.get('/me', protect, getMe);

// Forgot Password Routes
router.post('/forgot-password/request', forgotPasswordRequest);
router.post('/forgot-password/verify', forgotPasswordVerify);
router.post('/forgot-password/reset', forgotPasswordReset);

module.exports = router;
