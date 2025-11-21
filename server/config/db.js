const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('=== Database Connection Debug Info ===');
    console.log('Environment:', process.env.NODE_ENV || 'Not set');
    console.log('Process environment keys:', Object.keys(process.env).filter(key => key.includes('MONGO') || key.includes('DB')).join(', '));
    
    // In production, prioritize the environment variable set by Render
    // In development, fall back to .env file
    let mongoUri = process.env.MONGODB_URI;
    
    console.log('Raw MONGODB_URI from environment:', mongoUri ? 'Set' : 'Not set');
    if (mongoUri) {
      console.log('MONGODB_URI length:', mongoUri.length);
      console.log('MONGODB_URI contains localhost:', mongoUri.includes('localhost'));
      console.log('MONGODB_URI value:', mongoUri.substring(0, Math.min(100, mongoUri.length)) + (mongoUri.length > 100 ? '...' : ''));
    }
    
    if (process.env.NODE_ENV === 'production') {
      console.log('Running in production mode');
      // In production, we must have a valid MONGODB_URI from Render
      if (!mongoUri) {
        console.log('MONGODB_URI not set by Render, checking for DATABASE_URL as fallback...');
        // Some Render environments use DATABASE_URL instead
        if (process.env.DATABASE_URL) {
          mongoUri = process.env.DATABASE_URL;
          console.log('Using DATABASE_URL as fallback for MongoDB connection');
          console.log('DATABASE_URL value:', process.env.DATABASE_URL.substring(0, Math.min(100, process.env.DATABASE_URL.length)) + (process.env.DATABASE_URL.length > 100 ? '...' : ''));
        } else {
          console.log('DATABASE_URL also not set');
          // Check for other common environment variables
          const possibleEnvVars = ['MONGO_URL', 'MONGODB_CONNECTION_STRING'];
          for (const varName of possibleEnvVars) {
            if (process.env[varName]) {
              mongoUri = process.env[varName];
              console.log(`Using ${varName} as fallback for MongoDB connection`);
              console.log(`${varName} value:`, process.env[varName].substring(0, Math.min(100, process.env[varName].length)) + (process.env[varName].length > 100 ? '...' : ''));
              break;
            }
          }
          
          if (!mongoUri) {
            console.log('No MongoDB connection string found in environment variables');
            console.log('IMPORTANT: You need to set MONGODB_URI in your Render environment variables');
            console.log('This should be set automatically by Render when using databases, but it is not working');
            console.log('As a workaround, you can manually set MONGODB_URI in the Render dashboard');
            // Fallback to a default MongoDB connection string
            // This is just for testing - in production you should set the proper connection string
            mongoUri = 'mongodb://localhost:27017/cryptozen';
          }
        }
      }
      
      if (mongoUri.includes('localhost')) {
        console.log('Warning: Using localhost MongoDB in production. This will only work if MongoDB is running locally.');
        console.log('For Render deployments, you should use a MongoDB Atlas cluster or Render database service');
      } else {
        console.log('Using Render-provided or manually configured MONGODB_URI');
      }
    } else {
      console.log('Running in development mode');
      // In development, use .env file if MONGODB_URI is not set
      if (!mongoUri) {
        mongoUri = 'mongodb://localhost:27017/cryptozen';
        console.log('Using default development MongoDB URI');
      }
    }
    
    // Validate that we have a URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set. Please configure it in your environment.');
    }
    
    // Log the URI being used (mask credentials for security)
    const maskedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log('Attempting to connect to MongoDB with URI:', maskedUri);
    
    // Remove deprecated options
    const conn = await mongoose.connect(mongoUri, {
      // Add connection options for better reliability
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of default 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log('=== Database Connection Successful ===');
    return conn;
  } catch (error) {
    console.error('=== Database Connection Error ===');
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error('Full error:', error);
    console.error('=== End Database Connection Error ===');
    
    // In production, we want to exit if database connection fails
    if (process.env.NODE_ENV === 'production') {
      console.error('Production environment: Exiting due to database connection failure');
      console.error('To fix this issue:');
      console.error('1. Make sure your Render database service is created and running');
      console.error('2. Check that the database name in render.yaml matches your service name');
      console.error('3. Manually set MONGODB_URI in the Render dashboard if automatic linking is not working');
      console.error('4. Consider using MongoDB Atlas for more reliable database connections');
      process.exit(1);
    } else {
      // In development, we'll throw the error to be handled by the caller
      throw error;
    }
  }
};

module.exports = connectDB;