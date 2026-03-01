const axios = require("axios");
const { extractKeywords } = require("./keywordExtraction.service");
const { resolvePdfUrl } = require("./pdfResolver.service");

const BASE_URL = "https://api.semanticscholar.org/graph/v1/paper";

// fields to fetch
const ALL_FIELDS = [
  "paperId",
  "corpusId",
  "externalIds",
  "url",
  "title",
  "abstract",
  "venue",
  "year",
  "referenceCount",
  "citationCount",
  "isOpenAccess",
  "openAccessPdf",
  "fieldsOfStudy",
  "publicationTypes",
  "publicationDate",
  "journal",
  "authors",
  "textAvailability"
].join(",");

/**
 Detect the type of paper identifier and format it correctly
 */
function formatPaperId(paperId) {
  const trimmedId = paperId.trim();

  if (/^\d+$/.test(trimmedId)) {
    return `CorpusId:${trimmedId}`;
  }

  if (/^CorpusId:\d+$/i.test(trimmedId)) {
    return trimmedId;
  }

  if (trimmedId.startsWith("10.") || trimmedId.toLowerCase().startsWith("doi:")) {
    const doi = trimmedId.replace(/^doi:/i, "");
    return `DOI:${doi}`;
  }

  if (
    /^\d{4}\.\d{4,5}(v\d+)?$/.test(trimmedId) ||
    trimmedId.toLowerCase().startsWith("arxiv:")
  ) {
    const arxivId = trimmedId.replace(/^arxiv:/i, "");
    return `ARXIV:${arxivId}`;
  }

  return trimmedId;
}


/**
 * Fetch paper details
 */
exports.getPaperDetails = async (paperId) => {
  const formattedId = formatPaperId(paperId);
  const url = `${BASE_URL}/${formattedId}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY
      },
      params: { fields: ALL_FIELDS },
      timeout: 60000
    });

    const paper = response.data;


    paper.openAccessPdf = await resolvePdfUrl(paper);

    // Keywords
    let keywords = [];
    try {
      const title = paper.title || "";
      const abstract = paper.abstract || "";
      if (title || abstract) {
        keywords = await extractKeywords(title, abstract);
      }
    } catch {
      keywords = [];
    }

    paper.keywords = keywords;
    return paper;

  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("Paper not found.");
    }
    if (error.response?.status === 429) {
      throw new Error("Rate limit exceeded.");
    }
    throw new Error("Failed to fetch paper details.");
  }
};



exports.formatPaperId = formatPaperId;
