const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extracted from header:', token ? 'Present' : 'Missing');

      // Verify token
      console.log('Verifying token with JWT_SECRET');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', decoded);

      // Validate that the decoded ID is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
        console.log('Invalid user ID in token:', decoded.id);
        return res.status(401).json({ message: 'Not authorized, invalid token' });
      }

      // Get user from token
      console.log('Finding user by ID:', decoded.id);
      req.user = await User.findById(decoded.id).select('-password');
      console.log('User found:', req.user ? req.user.email : 'None');

      if (!req.user) {
        console.log('User not found in database');
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      if (error.name === 'JsonWebTokenError') {
        console.log('Invalid token format');
        return res.status(401).json({ message: 'Not authorized, invalid token' });
      } else if (error.name === 'TokenExpiredError') {
        console.log('Token expired');
        return res.status(401).json({ message: 'Not authorized, token expired' });
      }
      console.log('Token verification failed');
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.log('No token provided in request');
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user' });
    }
    const isAdminUser = req.user.isAdmin === true || req.user.email === 'admin@cryptozen.com' || req.user.email === 'admin@cryptoasia.com';
    if (!isAdminUser) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.requireAdmin = requireAdmin;
