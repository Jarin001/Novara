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

const { searchAuthors } = require('../controllers/userSearch.controller');


// PUBLIC ROUTES (no authentication required)
router.get('/search', searchAuthors);
router.get('/profile/:user_id', getPublicUserProfile); 


// AUTHENTICATED ROUTES (require login)
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile);
router.post('/profile-picture', authenticate, uploadProfilePicture);
router.delete('/profile-picture', authenticate, removeProfilePicture);

module.exports = router;