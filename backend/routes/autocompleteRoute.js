const express = require("express");
const router = express.Router();

const {
  autocompleteController
} = require("../controllers/autocomplete");

router.get("/", autocompleteController);

module.exports = router;
