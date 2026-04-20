const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        // If we can't connect to mongo, don't crash the whole server yet 
        // unless you want a hard fail on start. For local dev softly logging is okay.
        // process.exit(1); 
    }
};

module.exports = connectDB;
