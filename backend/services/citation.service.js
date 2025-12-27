// const axios = require('axios');
// const { Cite, plugins } = require('@citation-js/core');
// require('@citation-js/plugin-bibtex');
// require('@citation-js/plugin-csl');
// const { tidy } = require('bibtex-tidy');

// // Helper to fetch and register a style from the web
// const registerRemoteStyle = async (name, url) => {
//     const config = plugins.config.get('@csl');
//     if (!config.templates.has(name)) {
//         const { data } = await axios.get(url);
//         config.templates.add(name, data);
//     }
// };

// // Start-up function to prepare styles
// const initStyles = async () => {
//     await registerRemoteStyle('ieee', 'https://raw.githubusercontent.com/citation-style-language/styles/master/ieee.csl');
//     await registerRemoteStyle('mla', 'https://raw.githubusercontent.com/citation-style-language/styles/master/modern-language-association.csl');
// };

// // Run this once when the server starts
// initStyles().catch(err => console.error("Styles failed to load", err));

// const fetchAndFormatCitation = async (paperId) => {
//     // 1. FETCH FROM SEMANTIC SCHOLAR
//     const response = await axios.get(
//         `https://api.semanticscholar.org/graph/v1/paper/${paperId}?fields=citationStyles`,
//         { headers: { 'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY } }
//     );
//     const rawBibtex = response.data.citationStyles.bibtex;

//     // 2. CLEANING (This is the bibtex-tidy step)
//     const cleaned = tidy(rawBibtex, { 
//     curly: true,               // Enforce braces around all values
//     numeric: true,             // Keep years as numbers
//     stripEnclosingBraces: true,
//     dropOptionalTitles: true,
//     cleanEnclosingBraces: true,
//     space: 2,                  // Use 2 spaces for indentation
//     align: 13
//     }).bibtex;

//     // 3. FORMATTING
//     const cite = new Cite(cleaned);
    
//     // Return array for easy .map() on React frontend
//     return [
//         { id: 'bibtex', label: 'BibTeX', html: cleaned, format: 'text' },
//         { id: 'apa', label: 'APA', html: cite.format('bibliography', { template: 'apa', format: 'html' }) },
//         { id: 'vancouver', label: 'Vancouver', html: cite.format('bibliography', { template: 'vancouver', format: 'html' }) },
//         { id: 'ieee', label: 'IEEE', html: cite.format('bibliography', { template: 'ieee', format: 'html' }) },
//         { id: 'mla', label: 'MLA', html: cite.format('bibliography', { template: 'mla', format: 'html' }) }
//     ];
// };

// module.exports = { fetchAndFormatCitation };







const axios = require('axios');
const { Cite, plugins } = require('@citation-js/core');
require('@citation-js/plugin-bibtex');
require('@citation-js/plugin-csl');
const { tidy } = require('bibtex-tidy');
const he = require('he');


// Register remote CSL styles (non-default)

const registerRemoteStyle = async (name, url) => {
  const config = plugins.config.get('@csl');
  if (!config.templates.has(name)) {
    const { data } = await axios.get(url);
    config.templates.add(name, data);
  }
};

const initStyles = async () => {
  await registerRemoteStyle(
    'ieee',
    'https://raw.githubusercontent.com/citation-style-language/styles/master/ieee.csl'
  );
  await registerRemoteStyle(
    'mla',
    'https://raw.githubusercontent.com/citation-style-language/styles/master/modern-language-association.csl'
  );
};

// Ensure styles load once during server startup
const stylesReady = initStyles().catch(err =>
  console.error('CSL styles failed to load:', err)
);


const fetchAndFormatCitation = async (paperId) => {
  await stylesReady;

  // Fetch BibTeX from Semantic Scholar
  const response = await axios.get(
    `https://api.semanticscholar.org/graph/v1/paper/${paperId}?fields=citationStyles`,
    { headers: { 'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY } }
  );

  const rawBibtex = response.data?.citationStyles?.bibtex;
  if (!rawBibtex) {
    throw new Error('BibTeX not available for this paper');
  }

  //Decode HTML entities (&amp; → &)
  const decodedBibtex = he.decode(rawBibtex);

  //Normalize syntax using bibtex-tidy
  let cleaned = tidy(decodedBibtex, {
    curly: true,
    numeric: true,
    cleanEnclosingBraces: true,
    space: 2,
    align: 13
  }).bibtex;

  //Detect entry type + arXiv
  const entryTypeMatch = cleaned.match(/^@\s*(\w+)\s*\{/i);
  const entryType = entryTypeMatch?.[1]?.toLowerCase();
  const isArxiv = /arxiv|abs\//i.test(cleaned);

  //Smart arXiv-specific cleanup
  if (isArxiv) {
    if (entryType === 'article') {
      cleaned = cleaned
        .replace(/^\s*booktitle\s*=.*,\n?/gim, '') 
        .replace(/journal\s*=\s*\{.*?\}/i, 'journal      = {arXiv}')
        .replace(/volume\s*=\s*\{abs\/([^\}]+)\}/i, 'eprint       = {$1},\n  note         = {arXiv:$1}');
    } else if (entryType === 'misc') {
      cleaned = cleaned
        .replace(/^\s*journal\s*=.*,\n?/gim, '')
        .replace(/volume\s*=\s*\{abs\/([^\}]+)\}/i, 'eprint       = {$1},\n  note         = {arXiv:$1}');
    }
  }

  //Create LaTeX-safe BibTeX (escapes & to \& for the .bib file)
  const latexBibtex = cleaned.replace(/&/g, '\\&');

  //Format citations
  const cite = new Cite(cleaned);

  return [
    {
      id: 'bibtex',
      label: 'BibTeX',
      value: latexBibtex,
      format: 'text'
    },
    {
      id: 'apa',
      label: 'APA',
      value: cite.format('bibliography', { template: 'apa', format: 'html' }),
      format: 'html'
    },
    {
      id: 'ieee',
      label: 'IEEE',
      value: cite.format('bibliography', { template: 'ieee', format: 'html' }),
      format: 'html'
    },
    {
      id: 'mla',
      label: 'MLA',
      value: cite.format('bibliography', { template: 'mla', format: 'html' }),
      format: 'html'
    }
  ];
};

module.exports = { fetchAndFormatCitation };