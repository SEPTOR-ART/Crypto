/**
 * Script to fix the walletAddress index issue
 * This script drops the existing unique index and creates a proper partial index
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
const connectDB = async () => {
  // Use the MONGODB_URI from environment variables, or fallback to localhost
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
  
  console.log(`Attempting to connect to MongoDB at: ${mongoUri}`);
  
  try {
    const conn = await mongoose.connect(mongoUri, {
      // Remove deprecated options
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log('Please ensure your MONGODB_URI is correctly set in your .env file');
    console.log('For Render deployments, this is typically set in the Render dashboard');
    process.exit(1);
  }
};

const fixWalletAddressIndex = async () => {
  try {
    const connection = await connectDB();
    
    // Get the collection
    const collection = mongoose.connection.collection('users');
    
    // List existing indexes
    const indexes = await collection.indexes();
    console.log('Existing indexes:');
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Check if the problematic index exists
    const walletAddressIndex = indexes.find(index => 
      index.name === 'walletAddress_1' && 
      index.unique === true && 
      (!index.partialFilterExpression || Object.keys(index.partialFilterExpression).length === 0)
    );
    
    if (walletAddressIndex) {
      console.log('Found problematic walletAddress index, dropping it...');
      await collection.dropIndex('walletAddress_1');
      console.log('Old walletAddress index dropped successfully');
    } else {
      console.log('No problematic walletAddress index found');
    }
    
    // Create the new partial index
    console.log('Creating new partial index for walletAddress...');
    await collection.createIndex(
      { walletAddress: 1 },
      {
        unique: true,
        name: 'walletAddress_1',
        partialFilterExpression: {
          walletAddress: { $type: 'string', $ne: '' }
        }
      }
    );
    console.log('New partial index created successfully');
    
    // Verify the new index
    const newIndexes = await collection.indexes();
    const newWalletAddressIndex = newIndexes.find(index => index.name === 'walletAddress_1');
    console.log('New walletAddress index details:');
    console.log(JSON.stringify(newWalletAddressIndex, null, 2));
    
    console.log('Index fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing walletAddress index:', error);
    process.exit(1);
  }
};

// Run the script
fixWalletAddressIndex();