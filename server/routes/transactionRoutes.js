const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getUserTransactions,
  getTransactionById,
  updateTransactionStatus
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createTransaction).get(protect, getUserTransactions);
router.route('/:id').get(protect, getTransactionById).put(protect, updateTransactionStatus);

module.exports = router;