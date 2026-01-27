const axios = require("axios");
const { extractKeywords } = require("./keywordExtraction.service");

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

// Validate that a URL points to a PDF file

const isValidPdfUrl = async (url) => {
  try {
    const response = await axios.head(url, {
      maxRedirects: 5,
      timeout: 15000,
      validateStatus: (status) => status >= 200 && status < 400
    });

    const contentType = response.headers["content-type"] || "";
    return contentType.toLowerCase().startsWith("application/pdf");
  } catch {
    return false;
  }
};

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


    if (paper.openAccessPdf?.url) {
      const valid = await isValidPdfUrl(paper.openAccessPdf.url);
      if (!valid) {
        paper.openAccessPdf = null;
      }
    }


    //Fallback

    if (!paper.openAccessPdf || !paper.openAccessPdf.url) {
      paper.openAccessPdf = await fetchPdfFallback(paper);
    }

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


//Fallback function

const fetchPdfFallback = async (paper) => {
  const pdfFallback = {
    url: null,
    status: "UNAVAILABLE",
    license: null,
    disclaimer: null
  };

  const ext = paper.externalIds || {};
  const candidates = [];

  // ArXiv
  if (ext.ArXiv) {
    candidates.push({
      url: `https://arxiv.org/pdf/${ext.ArXiv}.pdf`,
      status: "ARXIV"
    });
  }

  // PubMed Central
  if (ext.PMCID) {
    candidates.push({
      url: `https://www.ncbi.nlm.nih.gov/pmc/articles/${ext.PMCID}/pdf/`,
      status: "PMC"
    });
  }

  // ACL Anthology
  if (ext.ACL) {
    candidates.push({
      url: `https://aclanthology.org/${ext.ACL}.pdf`,
      status: "ACL"
    });
  }

  // BioRxiv
  if (ext.BIORXIV) {
    candidates.push({
      url: `https://www.biorxiv.org/content/${ext.BIORXIV}.full.pdf`,
      status: "BIORXIV"
    });
  }


  for (const candidate of candidates) {
    const valid = await isValidPdfUrl(candidate.url);
    if (valid) {
      pdfFallback.url = candidate.url;
      pdfFallback.status = candidate.status;
      return pdfFallback;
    }
  }

  return pdfFallback;
};

exports.formatPaperId = formatPaperId;
