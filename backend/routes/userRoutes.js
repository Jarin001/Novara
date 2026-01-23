const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  getPublicUserProfile
} = require('../controllers/userController');

// All routes require authentication
router.use(authenticate);

// User profile routes
router.get('/profile', getUserProfile);           // Get user profile
router.put('/profile', updateUserProfile);        // Update user profile
router.post('/profile-picture', uploadProfilePicture); // Upload profile picture
router.get('/profile/:user_id', getPublicUserProfile);  // Get public user profile by user ID

module.exports = router;