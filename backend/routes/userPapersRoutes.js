const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { getAllUserPapers } = require('../controllers/libraryPaperController');

// All routes require authentication
router.use(authenticate);

// Get all unique papers across all user's libraries
router.get('/', getAllUserPapers);

module.exports = router;