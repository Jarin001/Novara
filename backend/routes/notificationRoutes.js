const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');

// All routes require authentication
router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.put('/:notification_id/read', authenticate, markAsRead);
router.put('/mark-all-read', authenticate, markAllAsRead);

module.exports = router;