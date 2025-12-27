// routes/paperAi.routes.js
const express = require("express");
const router = express.Router();
const { askPaperQuestion } = require("../controllers/paperAi.controller");

router.post("/papers/ask-ai", askPaperQuestion);

module.exports = router;
