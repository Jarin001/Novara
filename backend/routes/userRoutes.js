const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');

const {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  removeProfilePicture,
  getPublicUserProfile
} = require('../controllers/userController');

const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus
} = require('../controllers/followController');

const { searchAuthors } = require('../controllers/userSearch.controller');


// PUBLIC ROUTES (no authentication required)
router.get('/search', searchAuthors);

// AUTHENTICATED USER PROFILE ROUTES (must come before parameterized routes)
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile);
router.post('/profile-picture', authenticate, uploadProfilePicture);
router.delete('/profile-picture', authenticate, removeProfilePicture);

// FOLLOW ROUTES 
router.post('/:user_id/follow', authenticate, followUser);
router.delete('/:user_id/unfollow', authenticate, unfollowUser);
router.get('/:user_id/followers', getFollowers);
router.get('/:user_id/following', getFollowing);
router.get('/:user_id/follow-status', authenticate, getFollowStatus);

// PUBLIC USER PROFILE 
router.get('/profile/:user_id', getPublicUserProfile);

module.exports = router;