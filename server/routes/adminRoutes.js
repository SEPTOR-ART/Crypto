const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserBalance,
  getAllTransactions,
  updateTransactionStatus,
  updateUserStatus
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// All admin routes require authentication
router.use(protect);

// User management routes
router.route('/users')
  .get(getAllUsers);

router.route('/users/:id')
  .get(getUserById)
  .put(updateUserBalance);

router.route('/users/:id/status')
  .put(updateUserStatus);

// Transaction management routes
router.route('/transactions')
  .get(getAllTransactions);

router.route('/transactions/:id/status')
  .put(updateTransactionStatus);

module.exports = router;