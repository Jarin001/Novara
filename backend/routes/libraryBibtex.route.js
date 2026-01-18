const express = require('express');
const router = express.Router();
const libraryBibtexController = require('../controllers/libraryBibtex.controller');

const { authenticate } = require('../middlewares/authMiddleware');
router.use(authenticate);

router.get(
  '/:libraryId/bibtex',
  libraryBibtexController.getLibraryBibtex
);

module.exports = router;
