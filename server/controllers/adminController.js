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
  if (user.role === 'admin' || user.role === 'super_admin') return true;
  
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

// Modify transaction (admin or super admin)
async function modifyTransaction(req, res) {
  try {
    if (!req.user || (req.user.isAdmin !== true && req.user.role !== 'super_admin' && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    const { id } = req.params;
    const { changes, reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid transaction ID' });
    }
    const tx = await Transaction.findById(id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    const user = await User.findById(tx.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const before = tx.toObject();
    const allowed = ['type','asset','amount','price','total','status','paymentMethod','toAddress','fromAddress'];
    const applied = {};
    for (const k of Object.keys(changes || {})) {
      if (allowed.includes(k)) applied[k] = changes[k];
    }
    const effect = (t, amt) => (t === 'buy' || t === 'deposit') ? amt : (t === 'sell' || t === 'withdrawal') ? -amt : 0;
    const prevAsset = (before.asset || '').toUpperCase();
    const nextAsset = (applied.asset || before.asset || '').toUpperCase();
    const prevAmount = Number(before.amount || 0);
    const nextType = applied.type || before.type;
    const nextAmount = applied.amount !== undefined ? Number(applied.amount) : prevAmount;
    const prevEffect = effect(before.type, prevAmount);
    const nextEffect = effect(nextType, nextAmount);
    const getBal = (a) => user.balance?.get ? (user.balance.get(a) || 0) : (user.balance?.[a] || 0);
    const setBal = (a, v) => user.balance?.set ? user.balance.set(a, v) : (user.balance = { ...(user.balance || {}), [a]: v });
    const oldBal = getBal(prevAsset);
    const newBal = getBal(nextAsset);
    const adjustedOld = oldBal - prevEffect;
    const adjustedNew = newBal + nextEffect;
    if (adjustedOld < 0) {
      return res.status(400).json({ message: `Modification would result in negative ${prevAsset} balance` });
    }
    if (adjustedNew < 0) {
      return res.status(400).json({ message: `Modification would result in negative ${nextAsset} balance` });
    }
    tx.versions = tx.versions || [];
    tx.versions.push({ revision: tx.revision, snapshot: before, changedBy: req.user._id, reason });
    tx.revision = (tx.revision || 1) + 1;
    const fields = {};
    for (const k of Object.keys(applied)) {
      fields[k] = { before: before[k], after: applied[k] };
      tx[k] = applied[k];
    }
    tx.auditLogs = tx.auditLogs || [];
    tx.auditLogs.push({ action: 'modify', by: req.user._id, fields });
    await tx.save();
    setBal(prevAsset, adjustedOld);
    setBal(nextAsset, adjustedNew);
    await user.save();
    const safeBalance = user.balance?.get ? Object.fromEntries(user.balance) : user.balance;
    return res.json({ message: 'Transaction modified', transaction: tx, userBalance: safeBalance });
  } catch (error) {
    console.error('Modify transaction error:', error);
    return res.status(500).json({ message: error.message });
  }
}

// Rollback transaction to a previous revision (admin or super admin)
async function rollbackTransaction(req, res) {
  try {
    if (!req.user || (req.user.isAdmin !== true && req.user.role !== 'super_admin' && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    const { id } = req.params;
    const { toRevision } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid transaction ID' });
    }
    const tx = await Transaction.findById(id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    const user = await User.findById(tx.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const target = (tx.versions || []).find(v => v.revision === Number(toRevision));
    if (!target) return res.status(404).json({ message: 'Revision not found' });
    const before = tx.toObject();
    const effect = (t, amt) => (t === 'buy' || t === 'deposit') ? amt : (t === 'sell' || t === 'withdrawal') ? -amt : 0;
    const prevAsset = (before.asset || '').toUpperCase();
    const nextAsset = (target.snapshot.asset || before.asset || '').toUpperCase();
    const prevAmount = Number(before.amount || 0);
    const nextType = target.snapshot.type;
    const nextAmount = Number(target.snapshot.amount || 0);
    const prevEffect = effect(before.type, prevAmount);
    const nextEffect = effect(nextType, nextAmount);
    const getBal = (a) => user.balance?.get ? (user.balance.get(a) || 0) : (user.balance?.[a] || 0);
    const setBal = (a, v) => user.balance?.set ? user.balance.set(a, v) : (user.balance = { ...(user.balance || {}), [a]: v });
    const oldBal = getBal(prevAsset);
    const newBal = getBal(nextAsset);
    const adjustedOld = oldBal - prevEffect;
    const adjustedNew = newBal + nextEffect;
    if (adjustedOld < 0) {
      return res.status(400).json({ message: `Rollback would result in negative ${prevAsset} balance` });
    }
    if (adjustedNew < 0) {
      return res.status(400).json({ message: `Rollback would result in negative ${nextAsset} balance` });
    }
    const fields = {};
    const keys = ['type','asset','amount','price','total','status','paymentMethod','toAddress','fromAddress'];
    keys.forEach(k => {
      fields[k] = { before: before[k], after: target.snapshot[k] };
      tx[k] = target.snapshot[k];
    });
    tx.auditLogs = tx.auditLogs || [];
    tx.auditLogs.push({ action: 'rollback', by: req.user._id, fields });
    await tx.save();
    setBal(prevAsset, adjustedOld);
    setBal(nextAsset, adjustedNew);
    await user.save();
    const safeBalance = user.balance?.get ? Object.fromEntries(user.balance) : user.balance;
    return res.json({ message: 'Transaction rolled back', transaction: tx, userBalance: safeBalance });
  } catch (error) {
    console.error('Rollback transaction error:', error);
    return res.status(500).json({ message: error.message });
  }
}

module.exports.modifyTransaction = modifyTransaction;
module.exports.rollbackTransaction = rollbackTransaction;
