const express = require('express');
const router = express.Router();
const {
  createGiftCard,
  validateGiftCard,
  processGiftCardPayment,
  getUserGiftCards,
  getAllGiftCards,
  getGiftCardById,
  updateGiftCardStatus,
  addGiftCardBalance
} = require('../controllers/giftCardController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.route('/validate').post(validateGiftCard);
router.route('/process-payment').post(processGiftCardPayment);

// User routes (protected)
router.route('/my-cards').get(protect, getUserGiftCards);

// Admin routes (protected and admin only)
router.route('/')
  .post(protect, admin, createGiftCard)
  .get(protect, admin, getAllGiftCards);

router.route('/:id')
  .get(protect, admin, getGiftCardById)
  .put(protect, admin, updateGiftCardStatus);

router.route('/:id/add-balance')
  .put(protect, admin, addGiftCardBalance);

module.exports = router;