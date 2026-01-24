// const libraryBibtexService = require('../services/libraryBibtex.service');

// exports.getLibraryBibtex = async (req, res) => {
//   try {
//     const userId = req.user.id; // users.id (UUID)
//     const { libraryId } = req.params;

//     const bibtexList = await libraryBibtexService.getLibraryBibtex(
//       userId,
//       libraryId
//     );

//     res.status(200).json({
//       libraryId,
//       count: bibtexList.length,
//       bibtex: bibtexList
//     });
//   } catch (error) {
//     console.error('BibTeX fetch error:', error);
//     res.status(403).json({ message: error.message });
//   }
// };
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
