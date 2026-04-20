const express = require('express');
const router = express.Router();
const { registerCitizen, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerCitizen);
router.post('/citizen-login', loginUser);
router.post('/officer-login', loginUser);
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});
router.get('/me', protect, getMe);

module.exports = router;
