const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Check if user is admin
const isAdmin = (user) => {
  return user.email === 'admin@cryptozen.com' || user.email === 'admin@cryptoasia.com' || user.isAdmin;
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    // Only allow admin to access this endpoint
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID (admin only)
const getUserById = async (req, res) => {
  try {
    // Only allow admin to access this endpoint
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    
    // Validate that the user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(id).select('-password');
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update user balance (admin only)
const updateUserBalance = async (req, res) => {
  try {
    // Only allow admin to access this endpoint
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { asset, amount } = req.body;
    
    // Validate that the user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Validate input
    if (!asset || amount === undefined) {
      return res.status(400).json({ message: 'Asset and amount are required' });
    }
    
    // Validate amount is a number
    if (isNaN(amount)) {
      return res.status(400).json({ message: 'Amount must be a valid number' });
    }

    const user = await User.findById(id);
    
    if (user) {
      // Initialize balance map if it doesn't exist
      if (!user.balance) {
        user.balance = new Map();
      }
      
      // Update balance for the specified asset
      user.balance.set(asset, parseFloat(amount));
      
      // Save updated user
      const updatedUser = await user.save();
      
      res.json({
        message: 'User balance updated successfully',
        user: {
          _id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          balance: updatedUser.balance
        }
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update user balance error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all transactions (admin only)
const getAllTransactions = async (req, res) => {
  try {
    // Only allow admin to access this endpoint
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const transactions = await Transaction.find({})
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.json(transactions);
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update transaction status (admin only)
const updateTransactionStatus = async (req, res) => {
  try {
    // Only allow admin to access this endpoint
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { status } = req.body;
    
    // Validate that the transaction ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid transaction ID' });
    }
    
    // Validate status
    const validStatuses = ['pending', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be pending, completed, or failed.' });
    }

    const transaction = await Transaction.findById(id);
    
    if (transaction) {
      transaction.status = status;
      transaction.updatedAt = Date.now();
      
      await transaction.save();
      
      res.json({
        message: 'Transaction status updated successfully',
        transaction
      });
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Suspend/activate user (admin only)
const updateUserStatus = async (req, res) => {
  try {
    // Only allow admin to access this endpoint
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { action } = req.body; // 'suspend' or 'activate'
    
    // Validate that the user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Validate action
    if (!['suspend', 'activate'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be suspend or activate.' });
    }

    const user = await User.findById(id);
    
    if (user) {
      // For this example, we'll just update a custom field
      // In a real implementation, you might want to implement a proper suspension mechanism
      user.isSuspended = action === 'suspend';
      user.updatedAt = Date.now();
      
      await user.save();
      
      res.json({
        message: `User ${action}ed successfully`,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isSuspended: user.isSuspended
        }
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserBalance,
  getAllTransactions,
  updateTransactionStatus,
  updateUserStatus
};