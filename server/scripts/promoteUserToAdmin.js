require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const promoteToAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cryptozen';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✓ Connected to MongoDB');

    // Email to promote (change this to your email)
    const emailToPromote = 'ko.nwankpa@unizik.edu.ng';
    
    // Find user
    const user = await User.findOne({ email: emailToPromote });
    
    if (!user) {
      console.log('✗ User not found:', emailToPromote);
      mongoose.connection.close();
      return;
    }

    // Promote to admin
    user.isAdmin = true;
    await user.save();
    
    console.log('✓ User promoted to admin successfully!');
    console.log('Email:', user.email);
    console.log('Name:', user.firstName, user.lastName);
    console.log('Admin status:', user.isAdmin);

    mongoose.connection.close();
  } catch (error) {
    console.error('✗ Error promoting user:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

promoteToAdmin();
