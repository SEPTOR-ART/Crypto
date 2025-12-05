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
const { protect, requireAdmin, requireSuperAdmin } = require('../middleware/authMiddleware');
const { modifyTransaction, rollbackTransaction } = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(protect);
router.use(requireAdmin);

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

// Transaction modification and rollback (super admin only)
router.route('/transactions/:id/modify')
  .put(requireSuperAdmin, modifyTransaction);

router.route('/transactions/:id/rollback')
  .post(requireSuperAdmin, rollbackTransaction);

module.exports = router;
