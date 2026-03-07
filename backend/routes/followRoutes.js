const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');

const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus
} = require('../controllers/followController');

// All routes require authentication
router.post('/:user_id/follow', authenticate, followUser);
router.delete('/:user_id/unfollow', authenticate, unfollowUser);
router.get('/:user_id/followers', getFollowers);
router.get('/:user_id/following', getFollowing);
router.get('/:user_id/follow-status', authenticate, getFollowStatus);

module.exports = router;