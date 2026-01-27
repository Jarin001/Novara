const BASE_URL = "https://api.semanticscholar.org/graph/v1";


async function fetchPaperAutocomplete(query) {
  const url = `${BASE_URL}/paper/autocomplete?query=${encodeURIComponent(
    query.slice(0, 100)
  )}`;

  const response = await fetch(url, {
    headers: {
      "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Semantic Scholar API error");
  }

  const data = await response.json();

  
  return (data.matches || []).map(item => ({
    paperId: item.id,
    title: item.title,
    authorsYear: item.authorsYear
  }));
}

module.exports = {
  fetchPaperAutocomplete
};
