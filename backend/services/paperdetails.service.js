const axios = require("axios");

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
  "tldr",
  "textAvailability"
].join(",");


// call the api to fetch details

exports.getPaperDetails = async (paperId) => {
  const url = `${BASE_URL}/${encodeURIComponent(paperId)}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY
      },
      params: { fields: ALL_FIELDS }
    });

    const paper = response.data;

    // fallback if open access pdf is not returned
    if (!paper.openAccessPdf || !paper.openAccessPdf.url) {
      paper.openAccessPdf = await fetchPdfFallback(paper);
    }

    return paper;
  } catch (error) {
    console.error("Error fetching paper details:", error.response?.data || error.message);
    throw error;
  }
};



//fallback function for pdf

const fetchPdfFallback = async (paper) => {
  const pdfFallback = {
    url: null,
    status: "UNAVAILABLE",
    license: null,
    disclaimer: null
  };

  try {
    const ext = paper.externalIds || {};

    // ArXiv fallback
    if (ext.ArXiv) {
      pdfFallback.url = `https://arxiv.org/pdf/${ext.ArXiv}.pdf`;
      pdfFallback.status = "ARXIV";
      return pdfFallback;
    }

    // DOI
    if (ext.DOI) {
      pdfFallback.url = `https://doi.org/${ext.DOI}`;
      pdfFallback.status = "DOI";
      return pdfFallback;
    }

    // PubMed Central
    if (ext.PMCID) {
      pdfFallback.url = `https://www.ncbi.nlm.nih.gov/pmc/articles/${ext.PMCID}/pdf/`;
      pdfFallback.status = "PMC";
      return pdfFallback;
    }

    // ACL
    if (ext.ACL) {
      pdfFallback.url = `https://www.aclweb.org/anthology/${ext.ACL}.pdf`;
      pdfFallback.status = "ACL";
      return pdfFallback;
    }

    // ACM
    if (ext.ACM) {
      pdfFallback.url = `https://dl.acm.org/doi/pdf/${ext.ACM}`;
      pdfFallback.status = "ACM";
      return pdfFallback;
    }

    // BioRxiv
    if (ext.BIORXIV) {
      pdfFallback.url = `https://www.biorxiv.org/content/${ext.BIORXIV}.full.pdf`;
      pdfFallback.status = "BIORXIV";
      return pdfFallback;
    }

    return pdfFallback;
  } catch (err) {
    console.error("Error fetching fallback PDF:", err.message);
    return pdfFallback;
  }
};
