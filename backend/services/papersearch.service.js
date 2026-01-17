const axios = require("axios");

const BASE_URL = "https://api.semanticscholar.org/graph/v1/paper/search";

const FIELDS = [
  "paperId",
  "title",
  "authors",
  "year",
  "publicationDate",
  "fieldsOfStudy",
  "citationCount",
  "abstract",
  "citationStyles"
].join(",");

exports.searchPapers = async ({
  query,
  offset,
  limit,
  sortByCitations,
  fieldsOfStudy,
  yearFrom,
  yearTo
}) => {
  const params = {
    query,
    offset,
    limit: Math.min(limit, 100),
    fields: FIELDS
  };

  // Optional filters
  if (fieldsOfStudy) {
    params.fieldsOfStudy = fieldsOfStudy;
  }

  if (yearFrom || yearTo) {
    params.year = `${yearFrom || ""}-${yearTo || ""}`;
  }

  const response = await axios.get(BASE_URL, {
    headers: {
      "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY
    },
    params
  });

  let papers = response.data.data;

  // Optional sorting by citation count
  if (sortByCitations) {
    papers = papers.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
  }

 
  const formattedPapers = papers.map(paper => ({
    paperId: paper.paperId,
    title: paper.title,
    authors: paper.authors?.map(a => ({ authorId: a.authorId, name: a.name })) || [],
    year: paper.year,
    publicationDate: paper.publicationDate,
    fieldsOfStudy: paper.fieldsOfStudy || [],
    citationCount: paper.citationCount || 0,
    abstract: paper.abstract || [],
    bibtex: paper.citationStyles?.bibtex || []
  }));

  return {
    total: response.data.total,
    offset: response.data.offset,
    next: response.data.next,
    data: formattedPapers
  };
};
