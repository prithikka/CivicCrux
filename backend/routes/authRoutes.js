const express = require('express');
const router = express.Router();
const { registerCitizen, loginCitizen, loginOfficer, getMe, forgotPasswordRequest, forgotPasswordVerify, forgotPasswordReset, getAllUsers, deleteUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerCitizen);
router.post('/citizen-login', loginCitizen);
router.post('/officer-login', loginOfficer);
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});
router.get('/me', protect, getMe);

router.get('/me', protect, getMe);

// Admin User Management
router.get('/users', protect, authorize('admin'), getAllUsers);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

// Forgot Password Routes
router.post('/forgot-password/request', forgotPasswordRequest);
router.post('/forgot-password/verify', forgotPasswordVerify);
router.post('/forgot-password/reset', forgotPasswordReset);

module.exports = router;
