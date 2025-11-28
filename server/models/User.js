const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 100,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 128,
    validate: {
      validator: function(v) {
        // Ensure password meets complexity requirements
        return /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v);
      },
      message: 'Password must contain uppercase, lowercase, and number'
    }
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20,
    validate: {
      validator: function(v) {
        // Allow empty or valid phone number format
        return !v || /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(v);
      },
      message: 'Invalid phone number format'
    }
  },
  kycStatus: {
    type: String,
    enum: ['not started', 'pending', 'verified'],
    default: 'not started'
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String
  },
  twoFactorBackupCodes: [{
    type: String
  }],
  walletAddress: {
    type: String,
    // Remove unique constraint to allow multiple null values
    default: null
  },
  balance: {
    type: Map,
    of: Number,
    default: {}
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
  ,
  apiToken: {
    type: String,
    default: null,
    index: true
  },
  apiTokenExpires: {
    type: Date,
    default: null
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  // Lock account if max attempts reached
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $set: { 
      loginAttempts: 0,
      lastLoginAt: Date.now()
    },
    $unset: { lockUntil: 1 }
  });
};

// Update updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure balance is properly serialized to JSON
userSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    // Convert Map to plain object for JSON serialization
    if (ret.balance instanceof Map) {
      const balanceObj = {};
      ret.balance.forEach((value, key) => {
        balanceObj[key] = value;
      });
      ret.balance = balanceObj;
    }
    // Explicitly handle walletAddress for JSON serialization
    if (ret.walletAddress === undefined) {
      ret.walletAddress = null;
    }
    return ret;
  }
});

// Create a compound index that ensures uniqueness only for non-null, non-empty wallet addresses
userSchema.index({ walletAddress: 1 }, { 
  unique: true, 
  partialFilterExpression: { 
    walletAddress: { $type: 'string', $ne: '' } 
  } 
});

module.exports = mongoose.model('User', userSchema);
