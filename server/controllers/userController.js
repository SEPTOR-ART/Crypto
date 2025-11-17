const User = require('../models/User');
const jwt = require('jsonwebtoken');

// In-memory storage for mock users
let mockUsers = [];
let userIdCounter = 1;

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Register user
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user exists in mock storage
    const userExists = mockUsers.find(user => user.email === email);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user in mock storage
    const user = {
      _id: userIdCounter++,
      firstName,
      lastName,
      email,
      password, // In a real app, this would be hashed
      phone,
      kycStatus: 'not started',
      twoFactorEnabled: false,
      balance: new Map()
    };

    mockUsers.push(user);

    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Authenticate user
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user in mock storage
    const user = mockUsers.find(user => user.email === email);

    if (user && user.password === password) {
      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        kycStatus: user.kycStatus,
        twoFactorEnabled: user.twoFactorEnabled,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    // Find user in mock storage
    const user = mockUsers.find(user => user._id === req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        kycStatus: user.kycStatus,
        twoFactorEnabled: user.twoFactorEnabled,
        balance: user.balance,
        createdAt: new Date()
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    // Find user in mock storage
    const userIndex = mockUsers.findIndex(user => user._id === req.user._id);

    if (userIndex !== -1) {
      // Update user data
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        firstName: req.body.firstName || mockUsers[userIndex].firstName,
        lastName: req.body.lastName || mockUsers[userIndex].lastName,
        email: req.body.email || mockUsers[userIndex].email,
        phone: req.body.phone || mockUsers[userIndex].phone
      };

      const updatedUser = mockUsers[userIndex];

      res.json({
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
      res.status(404).json({ message: 'User not found' });
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