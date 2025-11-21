const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set. Please configure the environment variable.');
    }
    
    // Remove deprecated options
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // In production, we want to exit if database connection fails
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      // In development, we'll throw the error to be handled by the caller
      throw error;
    }
  }
};

module.exports = connectDB;