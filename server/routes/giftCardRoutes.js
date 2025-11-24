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
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.route('/validate').post(validateGiftCard);
router.route('/process-payment').post(processGiftCardPayment);

// User routes (protected)
router.route('/my-cards').get(protect, getUserGiftCards);

// Admin routes (protected only - admin check is done in controller)
router.route('/')
  .post(protect, createGiftCard)
  .get(protect, getAllGiftCards);

router.route('/:id')
  .get(protect, getGiftCardById)
  .put(protect, updateGiftCardStatus);

router.route('/:id/add-balance')
  .put(protect, addGiftCardBalance);

module.exports = router;