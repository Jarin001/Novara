const express = require('express');
const router = express.Router();

const {
  fetchPaperPreview,
  addUserPublication,
  getUserPublications,
  removeUserPublication
} = require('../controllers/paperController');

const { authenticate } = require('../middlewares/authMiddleware');

// PUBLIC ROUTES (no authentication)


// PROTECTED ROUTES (require authentication)
router.post('/preview', authenticate , fetchPaperPreview);
router.post('/publications', authenticate, addUserPublication);
router.get('/publications', authenticate, getUserPublications);
router.delete('/publications/:publication_id', authenticate, removeUserPublication);

module.exports = router;