const express = require("express");
const router = express.Router();
const controller = require("../controllers/paperdetails.controller");

router.get("/:paperId", controller.getPaperDetails);

module.exports = router;
