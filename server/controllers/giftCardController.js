const GiftCard = require('../models/GiftCard');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

// Check if user is admin
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

// Generate a random gift card number
const generateGiftCardNumber = () => {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};

// Generate a random PIN
const generatePIN = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN
};

// Create a new gift card
const createGiftCard = async (req, res) => {
  try {
    // Only allow admin to access this endpoint
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const { balance, currency, expiresAt } = req.body;
    
    // Validate input
    if (!balance || balance <= 0) {
      return res.status(400).json({ message: 'Balance must be greater than 0' });
    }
    
    // Generate unique card number and PIN
    let cardNumber;
    let isUnique = false;
    
    // Ensure card number is unique
    while (!isUnique) {
      cardNumber = generateGiftCardNumber();
      const existingCard = await GiftCard.findOne({ cardNumber });
      if (!existingCard) {
        isUnique = true;
      }
    }
    
    const pin = generatePIN();
    
    // Create gift card
    const giftCard = new GiftCard({
      cardNumber,
      pin,
      balance,
      initialBalance: balance,
      currency: currency || 'USD',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });
    
    // If issued to a specific user
    if (req.body.issuedTo) {
      giftCard.issuedTo = req.body.issuedTo;
    }
    
    await giftCard.save();
    
    res.status(201).json({
      message: 'Gift card created successfully',
      giftCard: {
        cardNumber: giftCard.cardNumber,
        pin: giftCard.pin,
        balance: giftCard.balance,
        currency: giftCard.currency,
        expiresAt: giftCard.expiresAt,
        issuedAt: giftCard.issuedAt
      }
    });
  } catch (error) {
    console.error('Gift card creation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Validate gift card for payment
const validateGiftCard = async (req, res) => {
  try {
    const { cardNumber, pin } = req.body;
    
    // Validate input
    if (!cardNumber || !pin) {
      return res.status(400).json({ message: 'Card number and PIN are required' });
    }
    
    // Find gift card
    const giftCard = await GiftCard.findOne({ cardNumber });
    
    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found' });
    }
    
    // Check if gift card is active
    if (giftCard.status !== 'active') {
      return res.status(400).json({ message: `Gift card is ${giftCard.status}` });
    }
    
    // Check if gift card has expired
    if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
      giftCard.status = 'expired';
      await giftCard.save();
      return res.status(400).json({ message: 'Gift card has expired' });
    }
    
    // Check PIN
    if (giftCard.pin !== pin) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }
    
    res.json({
      valid: true,
      cardNumber: giftCard.cardNumber,
      balance: giftCard.balance,
      currency: giftCard.currency,
      expiresAt: giftCard.expiresAt
    });
  } catch (error) {
    console.error('Gift card validation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Process gift card payment
const processGiftCardPayment = async (req, res) => {
  try {
    const { cardNumber, pin, amount } = req.body;
    
    // Validate input
    if (!cardNumber || !pin || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Card number, PIN, and valid amount are required' });
    }
    
    // Find gift card
    const giftCard = await GiftCard.findOne({ cardNumber });
    
    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found' });
    }
    
    // Check if gift card is active
    if (giftCard.status !== 'active') {
      return res.status(400).json({ message: `Gift card is ${giftCard.status}` });
    }
    
    // Check if gift card has expired
    if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
      giftCard.status = 'expired';
      await giftCard.save();
      return res.status(400).json({ message: 'Gift card has expired' });
    }
    
    // Check PIN
    if (giftCard.pin !== pin) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }
    
    // Check balance
    if (!giftCard.hasSufficientBalance(amount)) {
      return res.status(400).json({ 
        message: 'Insufficient balance', 
        availableBalance: giftCard.balance 
      });
    }
    
    // Deduct balance
    const deductionSuccess = giftCard.deductBalance(amount);
    if (!deductionSuccess) {
      return res.status(400).json({ message: 'Failed to deduct balance' });
    }
    
    await giftCard.save();
    
    res.json({
      message: 'Payment processed successfully',
      remainingBalance: giftCard.balance,
      cardNumber: giftCard.cardNumber
    });
  } catch (error) {
    console.error('Gift card payment processing error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user's gift cards
const getUserGiftCards = async (req, res) => {
  try {
    const giftCards = await GiftCard.find({ issuedTo: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(giftCards);
  } catch (error) {
    console.error('Get user gift cards error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all gift cards (admin only)
const getAllGiftCards = async (req, res) => {
  try {
    // Only allow admin to access this endpoint
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const giftCards = await GiftCard.find()
      .populate('issuedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await GiftCard.countDocuments();
    
    res.json({
      giftCards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all gift cards error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get gift card by ID (admin only)
const getGiftCardById = async (req, res) => {
  try {
    // Only allow admin to access this endpoint
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const giftCard = await GiftCard.findById(req.params.id)
      .populate('issuedTo', 'firstName lastName email')
      .populate('transactions');
    
    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found' });
    }
    
    res.json(giftCard);
  } catch (error) {
    console.error('Get gift card by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update gift card status (admin only)
const updateGiftCardStatus = async (req, res) => {
  try {
    // Only allow admin to access this endpoint
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const { status } = req.body;
    
    const giftCard = await GiftCard.findById(req.params.id);
    
    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found' });
    }
    
    // Validate status
    const validStatuses = ['active', 'used', 'expired', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    giftCard.status = status;
    if (status === 'used') {
      giftCard.usedAt = new Date();
    }
    
    await giftCard.save();
    
    res.json({
      message: 'Gift card status updated successfully',
      giftCard
    });
  } catch (error) {
    console.error('Update gift card status error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add balance to gift card (admin only)
const addGiftCardBalance = async (req, res) => {
  try {
    // Only allow admin to access this endpoint
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    
    const giftCard = await GiftCard.findById(req.params.id);
    
    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found' });
    }
    
    giftCard.addBalance(amount);
    await giftCard.save();
    
    res.json({
      message: 'Balance added successfully',
      giftCard
    });
  } catch (error) {
    console.error('Add gift card balance error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createGiftCard,
  validateGiftCard,
  processGiftCardPayment,
  getUserGiftCards,
  getAllGiftCards,
  getGiftCardById,
  updateGiftCardStatus,
  addGiftCardBalance
};