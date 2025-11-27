const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

const protect = async (req, res, next) => {
  let token;

  // Prefer Authorization header, else fall back to HttpOnly cookie 'session'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers.cookie) {
    const cookies = Object.fromEntries(
      req.headers.cookie.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );
    token = cookies.session;
  }

  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', { id: decoded.id });

    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      console.log('Invalid user ID in token:', decoded.id);
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }

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
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Not authorized, token expired' });
    }
    return res.status(401).json({ message: 'Not authorized, token failed' });
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
