const express = require('express');
const router = express.Router();

const { authorAutocomplete } = require('../controllers/authorAutocomplete.controller');

// Public route (no auth needed)
router.get('/', authorAutocomplete);

module.exports = router;
