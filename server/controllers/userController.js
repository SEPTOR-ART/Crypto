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

    // Try to use database first
    try {
      console.log('Attempting to register user in database');
      // Check if user already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        console.log('User already exists in database:', email);
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
        console.log('User created in database:', user.email);
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
      console.log('Database not available, using mock storage:', dbError.message);
      
      // Check if user exists in mock storage
      const userExists = mockUsers.find(user => user.email === email);
      if (userExists) {
        console.log('User already exists in mock storage:', email);
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password before storing in mock storage
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      console.log('Hashed password for new user:', email, hashedPassword);

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
      
      console.log('Added user to mock storage:', user);

      return res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        token: generateToken(user._id)
      });
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

    // Try to use database first
    try {
      console.log('Attempting to authenticate user in database');
      // Find user in database
      const user = await User.findOne({ email });
      console.log('User found in database:', user ? user.email : 'none');

      if (user && (await user.comparePassword(password))) {
        console.log('Database authentication successful for user:', email);
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
        console.log('Database authentication failed for user:', email);
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } catch (dbError) {
      // Fallback to mock implementation if database is not available
      console.log('Database not available, using mock storage for authentication:', dbError.message);
      
      // Find user in mock storage
      const user = mockUsers.find(user => user.email === email);
      console.log('User found in mock storage:', user ? user.email : 'none');

      if (user) {
        // Handle both plain text and hashed passwords for backward compatibility
        let passwordMatch = false;
        
        // Check if password is hashed (bcrypt hash starts with $2b$ or $2a$)
        if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
          // Password is hashed, use bcrypt comparison
          console.log('Comparing hashed password for user:', email);
          passwordMatch = await bcrypt.compare(password, user.password);
        } else {
          // Password is plain text, use direct comparison
          console.log('Comparing plain text password for user:', email);
          passwordMatch = user.password === password;
        }
        
        console.log('Password match result:', passwordMatch);
        
        if (passwordMatch) {
          console.log('Mock storage authentication successful for user:', email);
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
          console.log('Mock storage authentication failed for user:', email);
          res.status(401).json({ message: 'Invalid email or password' });
        }
      } else {
        console.log('User not found in mock storage:', email);
        res.status(401).json({ message: 'Invalid email or password' });
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
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

// For debugging purposes - get all mock users (only in development)
const getMockUsers = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }
  
  // Return mock users without sensitive information
  const safeUsers = mockUsers.map(user => ({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    kycStatus: user.kycStatus,
    twoFactorEnabled: user.twoFactorEnabled
  }));
  
  res.json(safeUsers);
};

module.exports = {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
  getMockUsers  // Export for debugging
};
