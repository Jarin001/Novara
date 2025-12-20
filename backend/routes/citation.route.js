const express = require('express');
const router = express.Router();
const citationController = require('../controllers/citation.controller');

// GET /api/citations/:paperId
router.get('/:paperId', citationController.getPaperCitations);

module.exports = router;