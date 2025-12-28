// paperController.js - UPDATED VERSION

const paperDetailsService = require('../services/paperdetails.service');

/**
 * Preview paper details (comprehensive)
 */
exports.fetchPaperPreview = async (req, res) => {
  try {
    const { paperId } = req.body;

    if (!paperId) {
      return res.status(400).json({ message: 'paperId is required' });
    }

    // REUSE the comprehensive service instead of duplicating
    const data = await paperDetailsService.getPaperDetails(paperId);

    // Return in your expected format
    res.json({
      s2_paper_id: data.paperId,
      title: data.title,
      published_year: data.year,
      citation_count: data.citationCount,
      fields_of_study: data.fieldsOfStudy || [],
      authors: data.authors?.map(a => a.name) || [],
      venue: data.venue || null,
      is_open_access: data.isOpenAccess || false,
      pdf_url: data.openAccessPdf?.url || null,
      doi: data.externalIds?.DOI || null,
      arxiv_id: data.externalIds?.ArXiv || null,
      abstract: data.abstract,
      tldr: data.tldr,
      reference_count: data.referenceCount,
      publication_date: data.publicationDate
    });
  } catch (err) {
    console.error('Full error:', err);
    res.status(500).json({ message: 'Failed to fetch paper preview' });
  }
};

