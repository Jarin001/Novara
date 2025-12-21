const express = require("express");
const router = express.Router();
const controller = require("../controllers/paper-references.controller");

router.get("/:paperId/references", controller.getPaperReferences);

module.exports = router;
