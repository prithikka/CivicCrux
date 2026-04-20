const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const importData = async () => {
    try {
        await connectDB();
        await User.deleteMany();

        await User.create({
            name: 'Admin User',
            email: 'admin@civiccrux.com',
            password: 'password123',
            role: 'admin'
        });

        await User.create({
            name: 'Officer John',
            email: 'john@civiccrux.com',
            password: 'password123',
            role: 'officer',
            ward: 'Ward 1'
        });

        console.log('Data Imported!');
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
