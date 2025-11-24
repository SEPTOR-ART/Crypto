const mongoose = require('mongoose');

const giftCardSchema = new mongoose.Schema({
  cardNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  pin: {
    type: String,
    required: true,
    trim: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  initialBalance: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired', 'cancelled'],
    default: 'active'
  },
  issuedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  usedAt: {
    type: Date
  },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt field before saving
giftCardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Check if gift card has sufficient balance
giftCardSchema.methods.hasSufficientBalance = function(amount) {
  return this.balance >= amount;
};

// Deduct amount from gift card balance
giftCardSchema.methods.deductBalance = function(amount) {
  if (this.hasSufficientBalance(amount)) {
    this.balance -= amount;
    if (this.balance === 0) {
      this.status = 'used';
      this.usedAt = new Date();
    }
    return true;
  }
  return false;
};

// Add amount to gift card balance
giftCardSchema.methods.addBalance = function(amount) {
  this.balance += amount;
  return this;
};

module.exports = mongoose.model('GiftCard', giftCardSchema);