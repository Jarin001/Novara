const paperCitationsService = require("../services/paper-citations.service");

/**
 * GET /api/papers/:paperId/citations
 * Same behavior as paper search, but source is paperId
 */
exports.getPaperCitations = async (req, res) => {
  try {
    const { paperId } = req.params;
    const {
      citationCount, // <-- frontend must send this
      offset = 0,
      limit = 10,
      sortByCitations = "false",
      fieldsOfStudy,
      yearFrom,
      yearTo
    } = req.query;

    if (!paperId) return res.status(400).json({ error: "paperId is required" });
    if (!citationCount) return res.status(400).json({ error: "citationCount is required from frontend" });

    const result = await paperCitationsService.getPaperCitations({
      paperId,
      citationCount: Number(citationCount),
      offset: Number(offset),
      limit: Number(limit),
      sortByCitations: sortByCitations === "true",
      fieldsOfStudy,
      yearFrom: yearFrom ? Number(yearFrom) : undefined,
      yearTo: yearTo ? Number(yearTo) : undefined
    });

    res.json(result);
  } catch (error) {
    console.error("Paper citations error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch paper citations" });
  }
};
