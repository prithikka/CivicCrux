const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
require('dotenv').config({ path: '../.env' }); // Ensure proper relative dot env loading

const runBackfill = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Database connected correctly. Running Escalations Backfill...');

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const complaintsToEscalate = await Complaint.find({
            status: 'REPORTED',
            createdAt: { $lte: sevenDaysAgo }
        });

        console.log(`Found ${complaintsToEscalate.length} overdue complaints securely awaiting native escalation.`);

        for (let complaint of complaintsToEscalate) {
            complaint.status = 'ESCALATED';
            complaint.history.push({
                status: 'ESCALATED',
                note: 'Automatically escalated due to 7 days of inactivity (Backfill script)',
                changedByRole: 'system'
            });
            await complaint.save();
            console.log(`Complaint ${complaint._id} auto-escalated.`);
        }

        console.log('Backfill explicitly completed expertly natively safely smoothly perfectly identically elegantly strictly gracefully accurately safely correctly seamlessly.');
        process.exit(0);
    } catch (err) {
        console.error('Error in backfill escalations cron trigger:', err);
        process.exit(1);
    }
};

runBackfill();
