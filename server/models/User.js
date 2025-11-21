const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
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
    unique: true
  },
  balance: {
    type: Map,
    of: Number,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
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
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);