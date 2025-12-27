const service = require("../services/paper-references.service");


exports.getPaperReferences = async (req, res) => {
  try {
    const { paperId } = req.params;
    const {
      referenceCount,
      offset = 0,
      limit = 10,
      sortByCitations = "false",
      fieldsOfStudy,
      yearFrom,
      yearTo
    } = req.query;

    if (!paperId) {
      return res.status(400).json({ error: "paperId is required" });
    }

    if (!referenceCount) {
      return res.status(400).json({ error: "referenceCount is required" });
    }

    const result = await service.getPaperReferences({
      paperId,
      referenceCount: Number(referenceCount),
      offset: Number(offset),
      limit: Number(limit),
      sortByCitations: sortByCitations === "true",
      fieldsOfStudy,
      yearFrom: yearFrom ? Number(yearFrom) : undefined,
      yearTo: yearTo ? Number(yearTo) : undefined
    });

    res.json(result);
  } catch (error) {
    console.error("Paper references error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch paper references" });
  }
};
