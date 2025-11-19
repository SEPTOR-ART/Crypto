const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      console.log('MONGODB_URI not set, skipping database connection');
      return;
    }
    
    // Remove deprecated options
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.log('Running in mock mode without database connection');
    // Don't exit the process, allow the app to run without DB
    return null;
  }
};

module.exports = connectDB;