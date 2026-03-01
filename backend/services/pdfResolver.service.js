const axios = require("axios");

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

const fetchPdfFallback = async (paper) => {
  const pdfFallback = {
    url: null,
    status: "UNAVAILABLE"
  };

  const ext = paper.externalIds || {};
  const candidates = [];

  if (ext.ArXiv) {
    candidates.push({
      url: `https://arxiv.org/pdf/${ext.ArXiv}.pdf`,
      status: "ARXIV"
    });
  }

  if (ext.PMCID) {
    candidates.push({
      url: `https://www.ncbi.nlm.nih.gov/pmc/articles/${ext.PMCID}/pdf/`,
      status: "PMC"
    });
  }

  if (ext.ACL) {
    candidates.push({
      url: `https://aclanthology.org/${ext.ACL}.pdf`,
      status: "ACL"
    });
  }

  if (ext.BIORXIV) {
    candidates.push({
      url: `https://www.biorxiv.org/content/${ext.BIORXIV}.full.pdf`,
      status: "BIORXIV"
    });
  }

  for (const candidate of candidates) {
    const valid = await isValidPdfUrl(candidate.url);
    if (valid) {
      return candidate;
    }
  }

  return pdfFallback;
};

const resolvePdfUrl = async (paper) => {
  // 1. Check Semantic Scholar PDF
  if (paper.openAccessPdf?.url) {
    const valid = await isValidPdfUrl(paper.openAccessPdf.url);
    if (valid) {
      return {
        url: paper.openAccessPdf.url,
        status: "SEMANTIC_SCHOLAR"
      };
    }
  }

  // 2. Try fallback
  return await fetchPdfFallback(paper);
};

module.exports = { resolvePdfUrl };