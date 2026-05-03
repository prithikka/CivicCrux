const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const importData = async () => {
    try {
        await connectDB();
        const adminExists = await User.findOne({ email: 'admin@civiccrux.com' });
        if (!adminExists) {
            await User.create({
                name: 'Admin User',
                email: 'admin@civiccrux.com',
                password: 'password123',
                role: 'admin'
            });
            console.log('Created Admin User: admin@civiccrux.com | password123');
        }

        const officer1Exists = await User.findOne({ email: 'officer1@civiccrux.com' });
        if (!officer1Exists) {
            await User.create({
                name: 'Officer John',
                email: 'officer1@civiccrux.com',
                password: 'password123',
                role: 'officer',
                ward: 'Ward 1'
            });
            console.log('Created Ward 1 Officer: officer1@civiccrux.com | password123');
        }

        const officer2Exists = await User.findOne({ email: 'officer2@civiccrux.com' });
        if (!officer2Exists) {
            await User.create({
                name: 'Officer Sarah',
                email: 'officer2@civiccrux.com',
                password: 'password123',
                role: 'officer',
                ward: 'Ward 2'
            });
            console.log('Created Ward 2 Officer: officer2@civiccrux.com | password123');
        }

        console.log('Seed Complete!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-i') {
    importData();
} else {
    console.log('Usage: node seeder.js -i');
    process.exit();
}
