const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

// Track failed authentication attempts for rate limiting
const failedAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of failedAttempts.entries()) {
    if (now - data.firstAttempt > RATE_LIMIT_WINDOW) {
      failedAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

const protect = async (req, res, next) => {
  let token;
  
  // Get client IP for rate limiting
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Check rate limiting
  const attempts = failedAttempts.get(clientIP);
  if (attempts && attempts.count >= MAX_ATTEMPTS) {
    const timeSinceFirst = Date.now() - attempts.firstAttempt;
    if (timeSinceFirst < RATE_LIMIT_WINDOW) {
      console.log('Rate limit exceeded for IP:', clientIP);
      return res.status(429).json({ 
        message: 'Too many authentication attempts. Please try again later.' 
      });
    } else {
      // Reset if window has passed
      failedAttempts.delete(clientIP);
    }
  }

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
    console.log('No token provided in request from IP:', clientIP);
    // Track failed attempt
    const attempts = failedAttempts.get(clientIP) || { count: 0, firstAttempt: Date.now() };
    attempts.count++;
    if (attempts.count === 1) attempts.firstAttempt = Date.now();
    failedAttempts.set(clientIP, attempts);
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    let decoded;
    if (process.env.JWT_SECRET) {
      // Verify JWT token
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Validate user ID format
      if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
        console.log('Invalid user ID in token:', decoded.id);
        throw new Error('Invalid token');
      }
      
      // Fetch user from database
      req.user = await User.findById(decoded.id).select('-password -apiToken -twoFactorSecret');
    } else {
      // Fallback: API token method
      const user = await User.findOne({ 
        apiToken: token,
        apiTokenExpires: { $gt: new Date() } // Ensure token hasn't expired
      }).select('-password -twoFactorSecret');
      
      if (user) {
        req.user = user;
      }
    }
    
    if (!req.user) {
      console.log('User not found or token invalid');
      // Track failed attempt
      const attempts = failedAttempts.get(clientIP) || { count: 0, firstAttempt: Date.now() };
      attempts.count++;
      if (attempts.count === 1) attempts.firstAttempt = Date.now();
      failedAttempts.set(clientIP, attempts);
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    
    // Check if user is suspended
    if (req.user.isSuspended) {
      console.log('Suspended user attempted access:', req.user.email);
      return res.status(403).json({ message: 'Account suspended. Please contact support.' });
    }
    
    // Clear failed attempts on successful authentication
    failedAttempts.delete(clientIP);
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    // Track failed attempt
    const attempts = failedAttempts.get(clientIP) || { count: 0, firstAttempt: Date.now() };
    attempts.count++;
    if (attempts.count === 1) attempts.firstAttempt = Date.now();
    failedAttempts.set(clientIP, attempts);
    
    if (!process.env.JWT_SECRET) {
      try {
        const user = await User.findOne({ 
          apiToken: token,
          apiTokenExpires: { $gt: new Date() }
        });
        if (user && !user.isSuspended) {
          req.user = user;
          // Clear failed attempts on success
          failedAttempts.delete(clientIP);
          return next();
        }
      } catch (e) {}
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
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
