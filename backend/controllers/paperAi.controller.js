const { askQuestionFromPaper } = require("../services/askAI.service");


exports.askPaperQuestion = async (req, res) => {
  try {
    const { pdfUrl, question } = req.body;
    const user = req.user;
    const token = req.headers.authorization?.split(' ')[1];

    if (!pdfUrl || !question) {
      return res.status(400).json({
        error: "Both pdfUrl and question are required in the request body",
      });
    }

    console.log(`[Controller] askPaperQuestion called for user: ${user?.email}, PDF: ${pdfUrl.substring(0, 100)}`);

    const answer = await askQuestionFromPaper(pdfUrl, question, user, token);

    res.json({ answer });
  } catch (err) {
    console.error("Error in askPaperQuestion:", err.message || err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};
