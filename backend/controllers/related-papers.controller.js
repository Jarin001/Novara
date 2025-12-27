const relatedPapersService = require("../services/related-papers.service");

exports.getRelatedPapers = async (req, res) => {
  try {
    const { paperId } = req.params;
    const { from = "recent", limit = 10, fields } = req.query;

    if (!paperId) return res.status(400).json({ error: "paperId is required" });

    const result = await relatedPapersService.getRelatedPapers({
      paperId,
      from,
      limit: Number(limit),
      fields
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
