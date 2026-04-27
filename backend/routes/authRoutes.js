const express = require('express');
const router = express.Router();
const { registerCitizen, loginCitizen, loginOfficer, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerCitizen);
router.post('/citizen-login', loginCitizen);
router.post('/officer-login', loginOfficer);
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});
router.get('/me', protect, getMe);

module.exports = router;
