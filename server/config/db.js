const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set. Please configure it in your environment.');
    }
    
    console.log('Attempting to connect to MongoDB with URI:', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Log URI without credentials
    
    // Remove deprecated options
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Add connection options for better reliability
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of default 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error('Full error:', error);
    
    // In production, we want to exit if database connection fails
    if (process.env.NODE_ENV === 'production') {
      console.error('Production environment: Exiting due to database connection failure');
      process.exit(1);
    } else {
      // In development, we'll throw the error to be handled by the caller
      throw error;
    }
  }
};

module.exports = connectDB;