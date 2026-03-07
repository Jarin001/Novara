const libraryBibtexService = require('../services/libraryBibtex.service');

exports.getLibraryBibtex = async (req, res) => {
  try {
    const userId = req.user.id;
    const { libraryId } = req.params;

    const { libraryName, bibtexList } =
      await libraryBibtexService.getLibraryBibtex(userId, libraryId);

    res.status(200).json({
      libraryId,
      libraryName,
      count: bibtexList.length,
      bibtex: bibtexList
    });
  } catch (error) {
    console.error('BibTeX fetch error:', error);
    res.status(403).json({ message: error.message });
  }
};


exports.getLibraryCitationKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('USER ID IS:', userId);
    const { libraryId } = req.params;
    const { search } = req.query;

    const { libraryName, citations } =
      await libraryBibtexService.getLibraryCitationKeys(
        userId,
        libraryId,
        search
      );

    res.status(200).json({
      libraryId,
      libraryName,
      count: citations.length,
      citations
    });

  } catch (error) {
    console.error('Citation key fetch error:', error);
    res.status(403).json({ message: error.message });
  }
};