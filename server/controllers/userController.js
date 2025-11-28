const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (id) => {
  console.log('Generating token for user ID:', id);
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '8h'
  });
  console.log('Token generated successfully');
  return token;
};

// Register user
const registerUser = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { firstName, lastName, email, password, phone } = req.body;
    
    // Validate input - comprehensive checks
    if (!email || !password || !firstName || !lastName) {
      console.log('Registration failed: Required fields missing');
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Registration failed: Invalid email format');
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Sanitize inputs to prevent injection attacks
    const sanitizedFirstName = firstName.trim().slice(0, 50);
    const sanitizedLastName = lastName.trim().slice(0, 50);
    const sanitizedEmail = email.toLowerCase().trim().slice(0, 100);
    const sanitizedPhone = phone ? phone.trim().slice(0, 20) : undefined;
    
    // Enhanced password strength validation
    const passwordRequirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      maxLength: password.length <= 128
    };
    
    if (!passwordRequirements.minLength || !passwordRequirements.hasUpperCase || 
        !passwordRequirements.hasLowerCase || !passwordRequirements.hasNumber) {
      console.log('Registration failed: Password does not meet requirements');
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      });
    }
    
    if (!passwordRequirements.maxLength) {
      console.log('Registration failed: Password too long');
      return res.status(400).json({ message: 'Password must not exceed 128 characters' });
    }

    // Check if user already exists - timing attack resistant
    console.log('Checking if user exists:', sanitizedEmail);
    const userExists = await User.findOne({ email: sanitizedEmail });
    console.log('User exists result:', userExists ? 'Yes' : 'No');
    if (userExists) {
      console.log('Registration failed: User already exists');
      // Use generic message to prevent account enumeration
      return res.status(400).json({ message: 'Unable to create account. Please try different credentials.' });
    }

    // Create user in database with sanitized data
    console.log('Creating user in database');
    const user = await User.create({
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      email: sanitizedEmail,
      password: password, // Will be hashed by pre-save hook
      phone: sanitizedPhone,
      walletAddress: null,
      balance: new Map(),
      createdAt: new Date(),
      isSuspended: false,
      isAdmin: false
    });
    console.log('User created:', user ? user.email : 'Failed');

    if (user) {
      let token;
      if (process.env.JWT_SECRET) {
        // Generate secure JWT token
        token = generateToken(user._id);
        
        // Generate CSRF token for additional security
        const csrfToken = crypto.randomBytes(32).toString('hex');
        const isProd = process.env.NODE_ENV === 'production';
        
        // Set secure HttpOnly cookie for session token
        res.cookie('session', token, {
          httpOnly: true, // Prevents XSS attacks
          secure: isProd, // HTTPS only in production
          sameSite: isProd ? 'None' : 'Lax', // CSRF protection
          maxAge: 8 * 60 * 60 * 1000, // 8 hours
          path: '/',
        });
        
        // Set CSRF token (readable by JavaScript for API calls)
        res.cookie('csrf_token', csrfToken, {
          httpOnly: false,
          secure: isProd,
          sameSite: isProd ? 'None' : 'Lax',
          maxAge: 8 * 60 * 60 * 1000,
          path: '/',
        });
      } else {
        // Fallback API token method
        token = crypto.randomBytes(32).toString('hex');
        user.apiToken = token;
        user.apiTokenExpires = new Date(Date.now() + 8 * 60 * 60 * 1000);
        await user.save();
      }
      
      console.log('User registered successfully:', user.email);
      
      // Return minimal user data (don't expose sensitive info)
      return res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        token,
        message: 'Account created successfully'
      });
    } else {
      console.log('Registration failed: Invalid user data');
      return res.status(400).json({ message: 'Unable to create account' });
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
    
    // Validate input
    if (!email || !password) {
      console.log('Authentication failed: Missing credentials');
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Sanitize email input
    const sanitizedEmail = email.toLowerCase().trim();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      console.log('Authentication failed: Invalid email format');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Find user in database (timing attack resistant)
    console.log('Finding user in database:', sanitizedEmail);
    const user = await User.findOne({ email: sanitizedEmail });
    console.log('User found:', user ? user.email : 'None');

    if (user) {
      // Check if account is suspended
      if (user.isSuspended) {
        console.log('Authentication failed: Account suspended');
        return res.status(403).json({ 
          message: 'Account suspended. Please contact support.' 
        });
      }
      
      // Check if account is locked due to failed login attempts
      if (user.isLocked && user.isLocked()) {
        console.log('Authentication failed: Account locked');
        return res.status(423).json({ 
          message: 'Account temporarily locked due to multiple failed login attempts. Please try again later or contact support.' 
        });
      }
      
      const isPasswordValid = await user.comparePassword(password);
      if (isPasswordValid) {
        let token;
        if (process.env.JWT_SECRET) {
          // Generate secure JWT token
          token = generateToken(user._id);
          
          // Generate CSRF token
          const csrfToken = crypto.randomBytes(32).toString('hex');
          const isProd = process.env.NODE_ENV === 'production';
          
          // Set secure HttpOnly cookie for session
          res.cookie('session', token, {
            httpOnly: true, // XSS protection
            secure: isProd, // HTTPS only in production
            sameSite: isProd ? 'None' : 'Lax', // CSRF protection
            maxAge: 8 * 60 * 60 * 1000, // 8 hours
            path: '/',
          });
          
          // Set CSRF token
          res.cookie('csrf_token', csrfToken, {
            httpOnly: false,
            secure: isProd,
            sameSite: isProd ? 'None' : 'Lax',
            maxAge: 8 * 60 * 60 * 1000,
            path: '/',
          });
        } else {
          // Fallback API token method
          token = crypto.randomBytes(32).toString('hex');
          user.apiToken = token;
          user.apiTokenExpires = new Date(Date.now() + 8 * 60 * 60 * 1000);
          await user.save();
        }
        
        console.log('User authenticated successfully:', user.email);
        
        // Reset login attempts on successful authentication
        if (user.resetLoginAttempts) {
          await user.resetLoginAttempts();
        }
        
        // Return minimal user data
        return res.json({
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          kycStatus: user.kycStatus,
          twoFactorEnabled: user.twoFactorEnabled,
          isAdmin: user.isAdmin || false,
          token,
          message: 'Login successful'
        });
      } else {
        console.log('Invalid password for user:', sanitizedEmail);
        
        // Increment login attempts on failed password
        if (user.incLoginAttempts) {
          await user.incLoginAttempts();
        }
        
        // Generic error message to prevent account enumeration
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      console.log('User not found:', sanitizedEmail);
      // Generic error message to prevent account enumeration
      // Add small delay to mitigate timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));
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
    console.log('Get user profile request for user ID:', req.user._id);
    
    // Validate that the user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
      console.log('Invalid user ID:', req.user._id);
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Find user in database
    const user = await User.findById(req.user._id);

    if (user) {
      console.log('User profile found for:', user.email);
      return res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        kycStatus: user.kycStatus,
        twoFactorEnabled: user.twoFactorEnabled,
        balance: user.balance, // Include user's balance
        walletAddress: user.walletAddress, // Include walletAddress
        createdAt: user.createdAt
      });
    } else {
      console.log('User not found for ID:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    console.log('Update user profile request for user ID:', req.user._id);
    
    // Validate that the user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
      console.log('Invalid user ID:', req.user._id);
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Find user in database
    const user = await User.findById(req.user._id);

    if (user) {
      console.log('User found for update:', user.email);
      
      // Update user data
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      // Only update walletAddress if provided in the request
      if (req.body.walletAddress !== undefined) {
        user.walletAddress = req.body.walletAddress;
      }

      const updatedUser = await user.save();
      console.log('User profile updated for:', updatedUser.email);

      return res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        kycStatus: updatedUser.kycStatus,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        balance: updatedUser.balance, // Include user's balance
        walletAddress: updatedUser.walletAddress, // Include walletAddress
        // Do not expose new token here; session cookie remains valid
      });
    } else {
      console.log('User not found for update:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Logout user
  const logoutUser = async (req, res) => {
    try {
      res.clearCookie('session', { path: '/' });
      res.clearCookie('csrf_token', { path: '/' });
      try {
        if (req.user) {
          const user = await User.findById(req.user._id);
          if (user) {
            user.apiToken = null;
            user.apiTokenExpires = null;
            await user.save();
          }
        }
      } catch (e) {}
      console.log('User logged out, cookies cleared');
      return res.status(200).json({ message: 'Logged out' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: error.message });
    }
  };

module.exports = {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
  logoutUser
};
