const express = require('express');
const router = express.Router();

const {
  fetchPaperPreview,
  savePaper
} = require('../controllers/paperController');

const authMiddleware = require('../middlewares/authMiddleware');

const { authenticate } = require('../middlewares/authMiddleware');

router.post('/preview', authenticate, fetchPaperPreview);


module.exports = router;
