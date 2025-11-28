const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

// Admin session timeout (15 minutes for admin users, 30 days for regular users)
const ADMIN_SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

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

      // Additional security checks for admin users
      const adminEmails = ['admin@cryptozen.com', 'admin@cryptoasia.com', 'Cryptozen@12345'];
      const isAdminUser = adminEmails.includes(req.user.email) || req.user.isAdmin;
      
      if (isAdminUser) {
        // Check if token was issued recently enough for admin users
        const tokenIssuedAt = decoded.iat * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const tokenAge = currentTime - tokenIssuedAt;
        
        if (tokenAge > ADMIN_SESSION_TIMEOUT) {
          console.log('Admin session expired. Token age:', tokenAge, 'ms');
          return res.status(401).json({ message: 'Admin session expired. Please log in again.' });
        }
        
        console.log('Admin session is valid. Token age:', tokenAge, 'ms');
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