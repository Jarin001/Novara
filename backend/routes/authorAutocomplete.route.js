const express = require('express');
const router = express.Router();

const { authorAutocomplete } = require('../controllers/authorAutocomplete.controller');

router.get('/', authorAutocomplete);

module.exports = router;
