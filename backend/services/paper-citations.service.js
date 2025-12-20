const axios = require("axios");

const BASE_PAPER_URL = "https://api.semanticscholar.org/graph/v1/paper";

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

exports.getPaperCitations = async ({
  paperId,
  citationCount, // <-- frontend provides this
  offset,
  limit,
  sortByCitations,
  fieldsOfStudy,
  yearFrom,
  yearTo
}) => {
  if (typeof citationCount !== "number") {
    throw new Error("citationCount is required from frontend");
  }

  const headers = {
    "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY
  };

  const safeLimit = Math.min(limit || 10, 100);

  const params = {
    offset,
    limit: safeLimit,
    fields: FIELDS
  };

  const citationsRes = await axios.get(
    `${BASE_PAPER_URL}/${encodeURIComponent(paperId)}/citations`,
    { headers, params }
  );

  let papers = citationsRes.data.data.map(c => c.citingPaper);

  // Apply filters same as search
  if (fieldsOfStudy) {
    papers = papers.filter(p => p.fieldsOfStudy?.includes(fieldsOfStudy));
  }

  if (yearFrom || yearTo) {
    papers = papers.filter(p => {
      if (!p.year) return false;
      if (yearFrom && p.year < yearFrom) return false;
      if (yearTo && p.year > yearTo) return false;
      return true;
    });
  }

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
    tldr: [], 
    citationCount: paper.citationCount || 0,
    abstract: paper.abstract || []
  }));

  return {
    total: citationCount, 
    offset: citationsRes.data.offset,
    next: citationsRes.data.next,
    data: formattedPapers
  };
};
