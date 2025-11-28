require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cryptozen';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✓ Connected to MongoDB');

    // Admin user details
    const adminEmail = 'admin@cryptozen.com';
    const adminPassword = 'Cryptozen@12345'; // Change this to a secure password
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('✓ Admin user already exists:', adminEmail);
      
      // Update to ensure admin flag is set
      existingAdmin.isAdmin = true;
      await existingAdmin.save();
      console.log('✓ Admin flag updated');
      
      mongoose.connection.close();
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const adminUser = new User({
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'CryptoZen',
      isAdmin: true,
      emailVerified: true,
      phone: '+1234567890',
      kycStatus: 'verified',
      balance: {
        BTC: 0,
        ETH: 0,
        LTC: 0,
        XRP: 0
      }
    });

    await adminUser.save();
    console.log('✓ Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

    mongoose.connection.close();
  } catch (error) {
    console.error('✗ Error creating admin user:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

createAdminUser();
