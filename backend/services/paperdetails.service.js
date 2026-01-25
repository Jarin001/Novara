// const axios = require("axios");
// const { extractKeywords } = require("./keywordExtraction.service");

// const BASE_URL = "https://api.semanticscholar.org/graph/v1/paper";

// // fields to fetch
// const ALL_FIELDS = [
//   "paperId",
//   "corpusId",
//   "externalIds",
//   "url",
//   "title",
//   "abstract",
//   "venue",
//   "year",
//   "referenceCount",
//   "citationCount",
//   "isOpenAccess",
//   "openAccessPdf",
//   "fieldsOfStudy",
//   "publicationTypes",
//   "publicationDate",
//   "journal",
//   "authors",
//   "textAvailability"
// ].join(",");


// /**
//  * Detect the type of paper identifier and format it correctly for Semantic Scholar API
//  * @param {string} paperId - Can be DOI, ArXiv ID, Corpus ID, or S2 Paper ID
//  * @returns {string} Formatted identifier for Semantic Scholar API
//  */
// function formatPaperId(paperId) {
//   const trimmedId = paperId.trim();
  
//   // Check if it's a Corpus ID (pure numbers)
//   if (/^\d+$/.test(trimmedId)) {
//     console.log('📋 Detected Corpus ID:', trimmedId);
//     return `CorpusId:${trimmedId}`;
//   }
  
//   // Check if already has CorpusId prefix
//   if (/^CorpusId:\d+$/i.test(trimmedId)) {
//     console.log('📋 Detected Corpus ID with prefix:', trimmedId);
//     return trimmedId;
//   }
  
//   // Check if it's a DOI (starts with "10." or has "doi:" prefix)
//   if (trimmedId.startsWith('10.') || trimmedId.toLowerCase().startsWith('doi:')) {
//     const doi = trimmedId.replace(/^doi:/i, '');
//     console.log('📄 Detected DOI:', doi);
//     return `DOI:${doi}`;
//   }
  
//   // Check if it's an ArXiv ID (format: YYMM.NNNNN or YYMM.NNNNNvN)
//   if (/^\d{4}\.\d{4,5}(v\d+)?$/.test(trimmedId) || trimmedId.toLowerCase().startsWith('arxiv:')) {
//     const arxivId = trimmedId.replace(/^arxiv:/i, '');
//     console.log('📚 Detected ArXiv ID:', arxivId);
//     return `ARXIV:${arxivId}`;
//   }
  
//   // Otherwise assume it's a Semantic Scholar Paper ID (internal hash)
//   console.log('🔍 Assuming S2 Paper ID:', trimmedId);
//   return trimmedId;
// }


// // call the api to fetch details
// exports.getPaperDetails = async (paperId) => {
//   // Format the paper ID based on its type
//   const formattedId = formatPaperId(paperId);
  
//   // Don't double-encode the colon in CorpusId, DOI, ARXIV prefixes
//   // encodeURIComponent would turn "CorpusId:123" into "CorpusId%3A123"
//   // which the API doesn't like. Instead, we need to keep the colon.
//   const url = `${BASE_URL}/${formattedId}`;

//   console.log('🌐 Calling Semantic Scholar API with URL:', url);

//   try {
//     const response = await axios.get(url, {
//       headers: {
//         "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY
//       },
//       params: { fields: ALL_FIELDS },
//       timeout: 60000 
//     });

//     const paper = response.data;

//     console.log('✅ Paper fetched successfully:', {
//       paperId: paper.paperId,
//       corpusId: paper.corpusId,
//       title: paper.title?.substring(0, 50) + '...'
//     });

//     // fallback if open access pdf is not returned
//     if (!paper.openAccessPdf || !paper.openAccessPdf.url) {
//       paper.openAccessPdf = await fetchPdfFallback(paper);
//     }


//     // add keywords of the paper
//     let keywords = [];

//     try {
//       // Abstract may be null → handle gracefully
//       const title = paper.title || "";
//       const abstract = paper.abstract || "";

//       if (title || abstract) {
//         keywords = await extractKeywords(title, abstract);
//       }
//     } catch (err) {
//       console.warn("⚠️ Keyword extraction failed:", err.message);
//       keywords = [];
//     }

//     paper.keywords = keywords;

//     return paper;
//   } catch (error) {
//     console.error("❌ Error fetching paper details:", error.response?.data || error.message);
    
//     // Provide more helpful error messages
//     if (error.response?.status === 404) {
//       throw new Error('Paper not found. Please check the Corpus ID, DOI, or ArXiv ID and try again.');
//     } else if (error.response?.status === 429) {
//       throw new Error('Rate limit exceeded. Please try again in a few moments.');
//     } else {
//       throw new Error('Failed to fetch paper details. Please try again later.');
//     }
//   }
// };



// //fallback function for pdf
// const fetchPdfFallback = async (paper) => {
//   const pdfFallback = {
//     url: null,
//     status: "UNAVAILABLE",
//     license: null,
//     disclaimer: null
//   };

//   try {
//     const ext = paper.externalIds || {};

//     // ArXiv fallback
//     if (ext.ArXiv) {
//       pdfFallback.url = `https://arxiv.org/pdf/${ext.ArXiv}.pdf`;
//       pdfFallback.status = "ARXIV";
//       return pdfFallback;
//     }

//     // DOI
//     if (ext.DOI) {
//       pdfFallback.url = `https://doi.org/${ext.DOI}`;
//       pdfFallback.status = "DOI";
//       return pdfFallback;
//     }

//     // PubMed Central
//     if (ext.PMCID) {
//       pdfFallback.url = `https://www.ncbi.nlm.nih.gov/pmc/articles/${ext.PMCID}/pdf/`;
//       pdfFallback.status = "PMC";
//       return pdfFallback;
//     }

//     // ACL
//     if (ext.ACL) {
//       pdfFallback.url = `https://www.aclweb.org/anthology/${ext.ACL}.pdf`;
//       pdfFallback.status = "ACL";
//       return pdfFallback;
//     }

//     // ACM
//     if (ext.ACM) {
//       pdfFallback.url = `https://dl.acm.org/doi/pdf/${ext.ACM}`;
//       pdfFallback.status = "ACM";
//       return pdfFallback;
//     }

//     // BioRxiv
//     if (ext.BIORXIV) {
//       pdfFallback.url = `https://www.biorxiv.org/content/${ext.BIORXIV}.full.pdf`;
//       pdfFallback.status = "BIORXIV";
//       return pdfFallback;
//     }

//     return pdfFallback;
//   } catch (err) {
//     console.error("⚠️ Error fetching fallback PDF:", err.message);
//     return pdfFallback;
//   }
// };

// // Export the format function for testing purposes
// exports.formatPaperId = formatPaperId;


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
 * Detect the type of paper identifier and format it correctly
 * ❗ LEFT COMPLETELY UNCHANGED
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
 * ✅ STRICT PDF VALIDATION
 * Accepts ONLY actual PDFs (Content-Type check)
 */
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

    /**
     * 🚨 Validate Semantic Scholar openAccessPdf
     * They sometimes return HTML disguised as PDF
     */
    if (paper.openAccessPdf?.url) {
      const valid = await isValidPdfUrl(paper.openAccessPdf.url);
      if (!valid) {
        paper.openAccessPdf = null;
      }
    }

    /**
     * Fallback ONLY if needed
     */
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

/**
 * ✅ SAFE FALLBACK — VERIFIED PDFs ONLY
 */
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

  /**
   * ❌ DOI — removed (never direct PDF)
   * ❌ ACM — removed (HTML paywall)
   */

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

// Export for testing
exports.formatPaperId = formatPaperId;
