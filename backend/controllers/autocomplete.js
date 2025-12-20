const {
  fetchPaperAutocomplete
} = require("../services/autocomplete.service");


async function autocompleteController(req, res) {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        error: "Query parameter is required"
      });
    }

    const matches = await fetchPaperAutocomplete(query);

    res.json({ matches });
  } catch (error) {
    console.error("Autocomplete error:", error.message);

    res.status(500).json({
      error: "Failed to fetch autocomplete results"
    });
  }
}

module.exports = {
  autocompleteController
};
