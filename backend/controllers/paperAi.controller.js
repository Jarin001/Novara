// controllers/paperAi.controller.js
const { askQuestionAboutPaper } = require("../services/paperAi.service");

async function askPaperQuestion(req, res) {
  try {
    const { pdfUrl, question } = req.body;

    if (!pdfUrl || !question) {
      return res.status(400).json({
        message: "pdfUrl and question are required",
      });
    }

    const answer = await askQuestionAboutPaper(pdfUrl, question);

    res.json({
      answer,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
}

module.exports = { askPaperQuestion };
