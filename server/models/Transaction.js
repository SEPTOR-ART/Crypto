const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['buy', 'sell', 'deposit', 'withdrawal'],
    required: true
  },
  asset: {
    type: String,
    required: true,
    uppercase: true
  },
  amount: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit', 'bank', 'gift', 'wallet'],
    required: true
  },
  // Gift card specific fields
  giftCardNumber: {
    type: String,
    trim: true
  },
  fromAddress: {
    type: String
  },
  toAddress: {
    type: String
  },
  transactionHash: {
    type: String
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

// Update updatedAt field before saving
transactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);