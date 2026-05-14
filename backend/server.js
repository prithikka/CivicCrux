const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

// Connect to MongoDB
connectDB();

const cron = require('node-cron');
const Complaint = require('./models/Complaint');

// Auto-escalation cron job (Runs every day at midnight)
cron.schedule('0 0 * * *', async () => {
    try {
        console.log('Running daily auto-escalation check...');
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const complaintsToEscalate = await Complaint.find({
            status: 'REPORTED',
            createdAt: { $lte: fourteenDaysAgo }
        });

        for (let complaint of complaintsToEscalate) {
            complaint.status = 'ESCALATED';
            complaint.history.push({
                status: 'ESCALATED',
                note: 'Automatically escalated due to 14 days of inactivity',
                changedByRole: 'system'
            });
            await complaint.save();
            console.log(`Complaint ${complaint._id} auto-escalated.`);
        }
    } catch (err) {
        console.error('Error in auto-escalation cron job:', err);
    }
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Test Route
app.get('/', (req, res) => {
    res.json({ message: 'CivicCrux MVP API is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
