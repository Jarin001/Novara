const allPaperBibtexService = require('../services/all-paper-bibtex.service');

exports.getAllPaperBibtex = async (req, res) => {
  try {
    const userId = req.user.id;

    const bibtexList = await allPaperBibtexService.getAllPaperBibtex(userId);

    res.status(200).json({
      libraryName: 'All Papers',
      count: bibtexList.length,
      bibtex: bibtexList
    });
  } catch (error) {
    console.error('All-paper BibTeX error:', error);
    res.status(500).json({ message: error.message });
  }
};
