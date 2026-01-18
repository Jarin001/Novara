const express = require("express");
const router = express.Router();
const { askPaperQuestion } = require("../controllers/paperAi.controller");

const { authenticate } = require('../middlewares/authMiddleware');
router.use(authenticate);

router.post("/ask", askPaperQuestion);

module.exports = router;

