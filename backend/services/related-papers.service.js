const axios = require("axios");

const BASE_URL = "https://api.semanticscholar.org/recommendations/v1/papers";

const FIELDS = [
  "paperId",
  "title",
  "authors",
  "year",
  "publicationDate",
  "fieldsOfStudy",
  "citationCount",
  "abstract"
].join(",");


exports.getRelatedPapers = async ({ paperId, from = "recent", limit = 15, fields = FIELDS }) => {
  const headers = {
    "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY
  };

  const params = {
    from,
    limit: Math.min(limit, 500),
    fields
  };

  try {
    const res = await axios.get(`${BASE_URL}/forpaper/${encodeURIComponent(paperId)}`, { headers, params });

    const papers = res.data.recommendedPapers || [];

    const formattedPapers = papers.map(p => ({
      paperId: p.paperId,
      title: p.title,
      authors: p.authors?.map(a => ({
        authorId: a.authorId,
        name: a.name
      })) || [],
      year: p.year,
      publicationDate: p.publicationDate,
      fieldsOfStudy: p.fieldsOfStudy || [],
      citationCount: p.citationCount || 0,
      abstract: p.abstract || []
    }));

    return { data: formattedPapers };
  } catch (error) {
    console.error("Related papers error:", error.response?.data || error.message);
    throw new Error("Failed to fetch related papers");
  }
};
