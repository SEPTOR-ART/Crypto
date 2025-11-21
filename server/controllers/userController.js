const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Add bcrypt for password hashing in mock mode

// In-memory storage for mock users (fallback when DB is not available)
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
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check password strength
    const strong = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
    if (!strong) {
      return res.status(400).json({ message: 'Password must be 8+ chars with upper, lower, number' });
    }

    // Try to use database first
    try {
      // Check if user already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create user in database
      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        phone
      });

      if (user) {
        return res.status(201).json({
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          token: generateToken(user._id)
        });
      } else {
        return res.status(400).json({ message: 'Invalid user data' });
      }
    } catch (dbError) {
      // Fallback to mock implementation if database is not available
      console.log('Database not available, using mock storage');
      
      // Check if user exists in mock storage
      const userExists = mockUsers.find(user => user.email === email);
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password before storing in mock storage
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user in mock storage
      const user = {
        _id: userIdCounter++,
        firstName,
        lastName,
        email,
        password: hashedPassword, // Store hashed password
        phone,
        kycStatus: 'not started',
        twoFactorEnabled: false,
        balance: new Map()
      };

      mockUsers.push(user);

      return res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Authenticate user
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Try to use database first
    try {
      // Find user in database
      const user = await User.findOne({ email });

      if (user && (await user.comparePassword(password))) {
        return res.json({
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          kycStatus: user.kycStatus,
          twoFactorEnabled: user.twoFactorEnabled,
          token: generateToken(user._id)
        });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } catch (dbError) {
      // Fallback to mock implementation if database is not available
      console.log('Database not available, using mock storage');
      
      // Find user in mock storage
      const user = mockUsers.find(user => user.email === email);

      if (user) {
        // Handle both plain text and hashed passwords for backward compatibility
        let passwordMatch = false;
        
        // Check if password is hashed (bcrypt hash starts with $2b$ or $2a$)
        if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
          // Password is hashed, use bcrypt comparison
          passwordMatch = await bcrypt.compare(password, user.password);
        } else {
          // Password is plain text, use direct comparison
          passwordMatch = user.password === password;
        }
        
        if (passwordMatch) {
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
      } else {
        res.status(401).json({ message: 'Invalid email or password' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    // Try to use database first
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
    } catch (dbError) {
      // Fallback to mock implementation if database is not available
      console.log('Database not available, using mock storage');
      
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
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    // Try to use database first
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
    } catch (dbError) {
      // Fallback to mock implementation if database is not available
      console.log('Database not available, using mock storage');
      
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