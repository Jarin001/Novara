const express = require("express");
const router = express.Router();
const controller = require("../controllers/paper-citations.controller");


router.get("/:paperId/citations", controller.getPaperCitations);

module.exports = router;
