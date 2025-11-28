const express = require('express');
const router = express.Router();
const {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
  logoutUser
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(registerUser);
router.route('/login').post(authUser);
router.route('/logout').post(logoutUser);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;
