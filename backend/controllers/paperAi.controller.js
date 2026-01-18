const { askQuestionFromPaper } = require("../services/askAI.service");


exports.askPaperQuestion = async (req, res) => {
  try {
    const { pdfUrl, question } = req.body;

    if (!pdfUrl || !question) {
      return res.status(400).json({
        error: "Both pdfUrl and question are required in the request body",
      });
    }

    const answer = await askQuestionFromPaper(pdfUrl, question);

    res.json({ answer });
  } catch (err) {
    console.error("Error in askPaperQuestion:", err.message || err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};
