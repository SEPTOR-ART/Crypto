const express = require('express');
const router = express.Router();
const {
  generateMFAQRCode,
  verifyMFA,
  disableMFA,
  verifyBackupCode
} = require('../controllers/mfaController');
const { protect } = require('../middleware/authMiddleware');

router.route('/setup').post(protect, generateMFAQRCode);
router.route('/verify').post(protect, verifyMFA);
router.route('/disable').post(protect, disableMFA);
router.route('/backup').post(protect, verifyBackupCode);

module.exports = router;