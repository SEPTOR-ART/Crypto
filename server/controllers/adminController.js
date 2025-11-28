const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Check if user is admin (shared function)
const isAdmin = (user) => {
  // Check if user object exists
  if (!user) return false;
  
  // Check for admin email addresses
  const adminEmails = ['admin@cryptozen.com', 'admin@cryptoasia.com', 'Cryptozen@12345'];
  if (adminEmails.includes(user.email)) return true;
  
  // Check for isAdmin flag
  if (user.isAdmin === true) return true;
  
  // User is not an admin
  return false;
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
      
      // Set the balance for the specified asset
      user.balance.set(asset, parseFloat(amount));
      
      const updatedUser = await user.save();
      
      res.json({
        message: 'User balance updated successfully',
        user: {
          _id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          balance: Object.fromEntries(updatedUser.balance)
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
    const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const transaction = await Transaction.findById(id);
    
    if (transaction) {
      transaction.status = status;
      transaction.updatedAt = Date.now();
      
      const updatedTransaction = await transaction.save();
      
      res.json({
        message: 'Transaction status updated successfully',
        transaction: updatedTransaction
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
    const { action } = req.body;
    
    // Validate that the user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Validate action
    const validActions = ['suspend', 'activate'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const user = await User.findById(id);
    
    if (user) {
      // Cannot suspend/activate admin users
      if (isAdmin(user)) {
        return res.status(403).json({ message: 'Cannot modify admin user status' });
      }
      
      user.isSuspended = action === 'suspend';
      user.updatedAt = Date.now();
      
      const updatedUser = await user.save();
      
      res.json({
        message: `User ${action}ed successfully`,
        user: {
          _id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          isSuspended: updatedUser.isSuspended
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
  updateUserStatus,
  isAdmin // Export the isAdmin function for consistency
};