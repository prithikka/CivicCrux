const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        name: { type: String }, // Made optional since signup only requested username, email, password
        username: { type: String, unique: true, sparse: true, minlength: [5, "Username must be at least 5 characters long."] },
        email: { type: String, required: true, unique: true },
        phone: { type: String, unique: true, sparse: true },
        password: { type: String, required: true },
        dob: { type: String }, // Stores hashed DOB
        role: { type: String, enum: ['citizen', 'officer', 'admin'], default: 'citizen' },
        ward: { type: String }, // mostly for officers or citizens defining their base
        failedAttempts: { type: Number, default: 0 },
        lockUntil: { type: Date },
        resetToken: { type: String },
        resetTokenExpiry: { type: Date }
    },
    { timestamps: true }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
