const express = require('express');
const router = express.Router();

const {
  fetchPaperPreview,
  savePaper
} = require('../controllers/paperController');

const authMiddleware = require('../middlewares/authMiddleware');

const { authenticate } = require('../middlewares/authMiddleware');

router.post('/preview', authenticate, fetchPaperPreview);
router.post('/save', authenticate, savePaper);


module.exports = router;
