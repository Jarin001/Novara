const paperSearchService = require("../services/papersearch.service");

exports.searchPapers = async (req, res) => {
  try {
    const {
      query,
      offset = 0,
      limit = 10,
      sortByCitations = "false",
      fieldsOfStudy,
      yearFrom,
      yearTo
    } = req.query;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    const result = await paperSearchService.searchPapers({
      query,
      offset: Number(offset),
      limit: Number(limit),
      sortByCitations: sortByCitations === "true",
      fieldsOfStudy,
      yearFrom,
      yearTo
    });

    res.json(result);
  } catch (error) {
    console.error(
      "Paper search error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch papers" });
  }
};
