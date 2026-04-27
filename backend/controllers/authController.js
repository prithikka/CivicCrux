const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const registerCitizen = async (req, res) => {
    try {
        const { username, email, phone, password, dob } = req.body;

        // Check if email already exists
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

        // Check if username already exists
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ message: 'Username is already taken' });
        }

        // Check if phone already exists
        if (phone) {
            const phoneExists = await User.findOne({ phone });
            if (phoneExists) {
                return res.status(400).json({ message: 'Phone number is already registered' });
            }
        }

        let hashedDob = dob;
        if (dob) {
            const salt = await bcrypt.genSalt(10);
            hashedDob = await bcrypt.hash(dob, salt);
        }

        const user = await User.create({
            username,
            email,
            phone,
            password,
            dob: hashedDob,
            role: 'citizen',
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginCitizen = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (user && user.role === 'citizen' && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginOfficer = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (user.role === 'officer' || user.role === 'admin') && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                ward: user.ward,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid officer email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                ward: user.ward,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const forgotPasswordRequest = async (req, res) => {
    try {
        const { identifier } = req.body; // email or phone
        if (!identifier) return res.status(400).json({ message: 'Email or phone is required' });

        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }],
            role: 'citizen'
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ success: true, identifier });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const forgotPasswordVerify = async (req, res) => {
    try {
        const { identifier, dob } = req.body;
        
        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }],
            role: 'citizen'
        });

        if (!user) {
            return res.status(400).json({ message: 'Details do not match' });
        }

        // Check lock
        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(403).json({ message: 'Account locked for 15 minutes due to multiple failed attempts' });
        }

        // Verify DOB
        const isMatch = user.dob && await bcrypt.compare(dob, user.dob);

        if (!isMatch) {
            user.failedAttempts = (user.failedAttempts || 0) + 1;
            if (user.failedAttempts >= 3) {
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
            }
            await user.save();
            return res.status(400).json({ message: 'Details do not match' });
        }

        // Success - clear locks and create reset token
        user.failedAttempts = 0;
        user.lockUntil = undefined;

        const resetToken = crypto.randomBytes(20).toString('hex');
        const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        user.resetToken = hashedResetToken;
        user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
        
        await user.save();

        res.json({ success: true, resetToken });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const forgotPasswordReset = async (req, res) => {
    try {
        const { identifier, resetToken, newPassword } = req.body;

        const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }],
            role: 'citizen',
            resetToken: hashedResetToken,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        user.password = newPassword; // Will be hashed by pre-save hook in User model
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;

        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerCitizen, loginCitizen, loginOfficer, getMe, forgotPasswordRequest, forgotPasswordVerify, forgotPasswordReset };
