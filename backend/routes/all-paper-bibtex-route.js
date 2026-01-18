const express = require('express');
const router = express.Router();
const allPaperBibtexController = require('../controllers/all-paper-bibtex.controller');

const { authenticate } = require('../middlewares/authMiddleware');
router.use(authenticate);


router.get('/bibtex/all', allPaperBibtexController.getAllPaperBibtex);

module.exports = router;
