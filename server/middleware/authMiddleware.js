const jwt = require('jsonwebtoken');
const User = require('../models/User');

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