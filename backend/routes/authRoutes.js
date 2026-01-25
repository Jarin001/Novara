const express = require('express');
const router = express.Router();
const {
  register,
  login,
  resendVerificationEmail,
  verifyEmail,
  refreshToken
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/resend-verification', resendVerificationEmail);
router.get('/verify-email', verifyEmail);
router.post('/refresh', refreshToken);

module.exports = router;