const express = require('express');
const router = express.Router();
const libraryBibtexController = require('../controllers/libraryBibtex.controller');

router.get(
  '/:libraryId/bibtex',
  libraryBibtexController.getLibraryBibtex
);

module.exports = router;
