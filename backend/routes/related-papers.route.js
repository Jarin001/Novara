const express = require("express");
const router = express.Router();
const controller = require("../controllers/related-papers.controller");

router.get("/:paperId/related", controller.getRelatedPapers);

module.exports = router;
