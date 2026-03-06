const express = require('express');
const router = express.Router();
const libraryBibtexController = require('../controllers/libraryBibtex.controller');

const { authenticate } = require('../middlewares/authMiddleware');
router.use(authenticate);

router.get(
  '/:libraryId',
  libraryBibtexController.getLibraryBibtex
);

router.get(
  '/:libraryId/citations',
  libraryBibtexController.getLibraryCitationKeys
);

module.exports = router;
