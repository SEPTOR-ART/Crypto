const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Register user
const registerUser = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { firstName, lastName, email, password, phone } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check password strength
    const strong = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
    if (!strong) {
      return res.status(400).json({ message: 'Password must be 8+ chars with upper, lower, number' });
    }

    // Check if user already exists
    console.log('Checking if user exists:', email);
    const userExists = await User.findOne({ email });
    console.log('User exists result:', userExists ? 'Yes' : 'No');
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user in database
    console.log('Creating user in database');
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone
    });
    console.log('User created:', user ? user.email : 'Failed');

    if (user) {
      const token = generateToken(user._id);
      console.log('Generated token for user:', user.email, token ? 'Success' : 'Failed');
      return res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        token: token
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Authenticate user
const authUser = async (req, res) => {
  try {
    console.log('Authentication request received:', req.body);
    const { email, password } = req.body;

    // Find user in database
    console.log('Finding user in database:', email);
    const user = await User.findOne({ email });
    console.log('User found:', user ? user.email : 'None');

    if (user) {
      console.log('Comparing password for user:', email);
      const isPasswordValid = await user.comparePassword(password);
      console.log('Password valid:', isPasswordValid);
      
      if (isPasswordValid) {
        const token = generateToken(user._id);
        console.log('Generated token for user:', user.email, token ? 'Success' : 'Failed');
        return res.json({
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          kycStatus: user.kycStatus,
          twoFactorEnabled: user.twoFactorEnabled,
          token: token
        });
      } else {
        console.log('Invalid password for user:', email);
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    // Find user in database
    const user = await User.findById(req.user._id);

    if (user) {
      return res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        kycStatus: user.kycStatus,
        twoFactorEnabled: user.twoFactorEnabled,
        balance: user.balance,
        createdAt: user.createdAt
      });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    // Find user in database
    const user = await User.findById(req.user._id);

    if (user) {
      // Update user data
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;

      const updatedUser = await user.save();

      return res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        kycStatus: updatedUser.kycStatus,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        token: generateToken(updatedUser._id)
      });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile
};
