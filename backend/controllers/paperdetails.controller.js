const paperDetailsService = require("../services/paperdetails.service");


exports.getPaperDetails = async (req, res) => {
  try {
    const { paperId } = req.params;
    const paper = await paperDetailsService.getPaperDetails(paperId);
    res.json(paper);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch paper details" });
  }
};
