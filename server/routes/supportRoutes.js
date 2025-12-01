const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { createMessage, createPublicMessage, getMyMessages, adminList, adminUpdateStatus, adminReply } = require('../controllers/supportController');

// Authenticated user endpoints
router.use('/my', protect);
router.get('/my', getMyMessages);
router.post('/messages', protect, createMessage);

// Public message endpoint (no auth)
router.post('/public', createPublicMessage);

// Admin endpoints
router.use('/', protect);
router.use('/', requireAdmin);
router.get('/', adminList);
router.put('/:id/status', adminUpdateStatus);
router.post('/:id/reply', adminReply);

module.exports = router;
