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

exports.getPaperRelations = async ({
  paperId,
  totalCount,          // (citationCount / referenceCount)
  offset,
  limit,
  sortByCitations,
  fieldsOfStudy,
  yearFrom,
  yearTo,
  endpoint,            // "citations" | "references"
  paperKey             // "citingPaper" | "citedPaper"
}) => {
  if (typeof totalCount !== "number") {
    throw new Error("totalCount is required");
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

  const res = await axios.get(
    `${BASE_PAPER_URL}/${encodeURIComponent(paperId)}/${endpoint}`,
    { headers, params }
  );

  let papers = res.data.data.map(item => item[paperKey]);

  //filters 

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
    papers.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
  }

  const formatted = papers.map(p => ({
    paperId: p.paperId,
    title: p.title,
    authors: p.authors?.map(a => ({
      authorId: a.authorId,
      name: a.name
    })) || [],
    year: p.year,
    publicationDate: p.publicationDate,
    fieldsOfStudy: p.fieldsOfStudy || [],
    tldr: [],
    citationCount: p.citationCount || 0,
    abstract: p.abstract || []
  }));

  return {
    total: totalCount,
    offset: res.data.offset,
    next: res.data.next,
    data: formatted
  };
};
