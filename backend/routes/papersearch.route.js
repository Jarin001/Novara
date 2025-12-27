const express = require("express");
const router = express.Router();
const paperSearchController = require("../controllers/papersearch.controller");

router.get("/", paperSearchController.searchPapers);

module.exports = router;
