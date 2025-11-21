const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('=== Database Connection Debug Info ===');
    console.log('Environment:', process.env.NODE_ENV || 'Not set');
    console.log('Process environment keys:', Object.keys(process.env).filter(key => key.includes('MONGO') || key.includes('DB')).join(', '));
    
    // Check for various environment variables that might contain the MongoDB connection string
    let mongoUri = process.env.MONGODB_URI || 
                   process.env.DATABASE_URL || 
                   process.env.MONGO_URL || 
                   process.env.MONGODB_CONNECTION_STRING;
    
    console.log('Raw MONGODB_URI from environment:', mongoUri ? 'Set' : 'Not set');
    if (mongoUri) {
      console.log('MONGODB_URI length:', mongoUri.length);
      console.log('MONGODB_URI contains localhost:', mongoUri.includes('localhost'));
      console.log('MONGODB_URI source:', process.env.MONGODB_URI ? 'MONGODB_URI' : 
                                         process.env.DATABASE_URL ? 'DATABASE_URL' : 
                                         process.env.MONGO_URL ? 'MONGO_URL' : 
                                         process.env.MONGODB_CONNECTION_STRING ? 'MONGODB_CONNECTION_STRING' : 'Unknown');
      console.log('MONGODB_URI value:', mongoUri.substring(0, Math.min(100, mongoUri.length)) + (mongoUri.length > 100 ? '...' : ''));
    }
    
    if (process.env.NODE_ENV === 'production') {
      console.log('Running in production mode');
      // In production, try to find any available MongoDB connection string
      if (!mongoUri) {
        console.log('No MongoDB connection string found in standard environment variables');
        console.log('Checking for Render-specific environment variables...');
        
        // Check for Render-specific environment variables
        // Render sometimes exposes database connection info through other variables
        const renderEnvVars = Object.keys(process.env).filter(key => 
          key.includes('MONGO') || key.includes('DATABASE') || key.includes('DB')
        );
        
        console.log('Found potential Render environment variables:', renderEnvVars);
        
        // Look for any variable that looks like a MongoDB connection string
        for (const key of renderEnvVars) {
          const value = process.env[key];
          if (value && (value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'))) {
            mongoUri = value;
            console.log(`Found MongoDB connection string in ${key}:`, value.substring(0, Math.min(100, value.length)) + (value.length > 100 ? '...' : ''));
            break;
          }
        }
        
        if (!mongoUri) {
          console.log('Still no MongoDB connection string found');
          console.log('IMPORTANT: For Render deployments, you should manually set one of these environment variables:');
          console.log('- MONGODB_URI (recommended)');
          console.log('- DATABASE_URL');
          console.log('- MONGO_URL');
          console.log('- MONGODB_CONNECTION_STRING');
          console.log('You can get the connection string from your Render database service dashboard');
        }
      }
      
      if (mongoUri && mongoUri.includes('localhost')) {
        console.log('Warning: Using localhost MongoDB in production. This will only work if MongoDB is running locally.');
        console.log('For Render deployments, you should use a MongoDB Atlas cluster or Render database service');
      } else if (mongoUri) {
        console.log('Using MongoDB connection string from environment variables');
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