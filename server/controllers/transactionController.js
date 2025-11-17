const Transaction = require('../models/Transaction');
const User = require('../models/User');

// In-memory storage for mock transactions
let mockTransactions = [];
let transactionIdCounter = 1;

// Create transaction
const createTransaction = async (req, res) => {
  try {
    const { type, asset, amount, price, paymentMethod, toAddress, fromAddress } = req.body;
    
    // Calculate total
    const total = amount * price;
    
    // Create transaction in mock storage
    const transaction = {
      _id: `txn_${transactionIdCounter++}`,
      userId: req.user._id,
      type,
      asset,
      amount,
      price,
      total,
      paymentMethod,
      toAddress,
      fromAddress,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockTransactions.push(transaction);
    
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user transactions
const getUserTransactions = async (req, res) => {
  try {
    const transactions = mockTransactions
      .filter(txn => txn.userId === req.user._id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const transaction = mockTransactions.find(
      txn => txn._id === req.params.id && txn.userId === req.user._id
    );
    
    if (transaction) {
      res.json(transaction);
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update transaction status
const updateTransactionStatus = async (req, res) => {
  try {
    const transactionIndex = mockTransactions.findIndex(
      txn => txn._id === req.params.id && txn.userId === req.user._id
    );
    
    if (transactionIndex !== -1) {
      mockTransactions[transactionIndex] = {
        ...mockTransactions[transactionIndex],
        status: req.body.status || mockTransactions[transactionIndex].status,
        updatedAt: new Date()
      };
      
      const updatedTransaction = mockTransactions[transactionIndex];
      res.json(updatedTransaction);
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTransaction,
  getUserTransactions,
  getTransactionById,
  updateTransactionStatus
};