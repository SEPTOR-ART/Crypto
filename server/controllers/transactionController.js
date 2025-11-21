const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Simulate blockchain transaction processing
const processBlockchainTransaction = async (transactionData) => {
  // In a real implementation, this would interact with actual blockchain networks
  // For demonstration, we'll simulate a successful transaction
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate a mock transaction hash
  const transactionHash = '0x' + Array.from({length: 64}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  // Simulate 95% success rate
  const isSuccess = Math.random() > 0.05;
  
  return {
    success: isSuccess,
    transactionHash: isSuccess ? transactionHash : null,
    error: isSuccess ? null : 'Blockchain network error'
  };
};

// Create transaction
const createTransaction = async (req, res) => {
  try {
    const { type, asset, amount, price, paymentMethod, toAddress, fromAddress } = req.body;
    
    // Validate required fields
    if (!type || !asset || !amount || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate amount and price
    if (isNaN(amount) || isNaN(price) || amount <= 0 || price <= 0) {
      return res.status(400).json({ message: 'Invalid amount or price' });
    }
    
    // Calculate total
    const total = amount * price;
    
    console.log('Creating transaction:', { type, asset, amount, price, total });
    
    // For sell transactions, check if user has enough balance
    if (type === 'sell') {
      const user = await User.findById(req.user._id);
      if (user) {
        const currentBalance = user.balance.get(asset) || 0;
        if (amount > currentBalance) {
          return res.status(400).json({ message: `Insufficient ${asset} balance` });
        }
      }
    }
    
    // Create transaction in database
    const transaction = new Transaction({
      userId: req.user._id,
      type,
      asset,
      amount,
      price,
      total,
      paymentMethod,
      toAddress,
      fromAddress,
      status: 'pending'
    });
    
    // Save to database
    await transaction.save();
    console.log('Transaction saved:', transaction._id);
    
    // Process blockchain transaction
    const blockchainResult = await processBlockchainTransaction({
      type,
      asset,
      amount,
      toAddress,
      fromAddress
    });
    
    if (blockchainResult.success) {
      // Update transaction with blockchain hash and mark as completed
      transaction.status = 'completed';
      transaction.transactionHash = blockchainResult.transactionHash;
      await transaction.save();
      console.log('Transaction completed:', transaction._id);
      
      // Update user's balance based on transaction type
      const user = await User.findById(req.user._id);
      if (user) {
        console.log('User found for balance update:', user.email);
        
        // Initialize balance map if it doesn't exist
        if (!user.balance) {
          user.balance = new Map();
          console.log('Initialized new balance map');
        }
        
        // Get current balance for this asset
        const currentBalance = user.balance.get(asset) || 0;
        console.log(`Current balance for ${asset}:`, currentBalance);
        
        // Update balance based on transaction type
        if (type === 'buy') {
          const newBalance = currentBalance + amount;
          user.balance.set(asset, newBalance);
          console.log(`Updated balance for ${asset} after buy:`, newBalance);
        } else if (type === 'sell') {
          const newBalance = Math.max(0, currentBalance - amount);
          user.balance.set(asset, newBalance);
          console.log(`Updated balance for ${asset} after sell:`, newBalance);
        }
        
        // Save updated user
        const updatedUser = await user.save();
        console.log('User balance updated:', updatedUser.balance);
        
        // Return the updated user data along with the transaction
        return res.status(201).json({
          transaction: transaction,
          userBalance: Object.fromEntries(updatedUser.balance)
        });
      }
    } else {
      // Mark transaction as failed
      transaction.status = 'failed';
      await transaction.save();
      console.log('Transaction failed:', transaction._id);
      
      return res.status(400).json({ 
        message: 'Blockchain transaction failed', 
        error: blockchainResult.error 
      });
    }
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user transactions
const getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
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
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (transaction) {
      transaction.status = req.body.status || transaction.status;
      transaction.updatedAt = Date.now();
      
      await transaction.save();
      
      res.json(transaction);
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