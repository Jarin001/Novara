const { supabase } = require('../config/supabase');
const PaperContent = require('../models/PaperContent');

exports.getLibraryBibtex = async (userId, libraryId) => {
  // 1. Check access + get library name
  const { data: access, error: accessError } = await supabase
    .from('user_libraries')
    .select(`
      id,
      libraries (
        name
      )
    `)
    .eq('user_id', userId)
    .eq('library_id', libraryId)
    .single();

  if (accessError || !access) {
    throw new Error('Access denied to this library');
  }

  const libraryName = access.libraries.name;

  // 2. Get papers in library
  const { data: libraryPapers, error } = await supabase
    .from('library_papers')
    .select('paper_id')
    .eq('library_id', libraryId);

  if (error) {
    throw new Error('Failed to fetch library papers');
  }

  if (!libraryPapers.length) {
    return { libraryName, bibtexList: [] };
  }

  const paperIds = libraryPapers.map(p => p.paper_id);

  // 3. Fetch BibTeX from Mongo
  const paperContents = await PaperContent.find(
    { paperId: { $in: paperIds } },
    { _id: 0, paperId: 1, bibtex: 1 }
  );

  const contentMap = new Map(
    paperContents.map(p => [p.paperId, p.bibtex])
  );

  // 4. Preserve order, skip empty bibtex
  const bibtexList = paperIds
    .map(id => {
      const bib = contentMap.get(id);
      return bib && bib.trim() !== '' ? { paperId: id, bibtex: bib } : null;
    })
    .filter(Boolean);

  return { libraryName, bibtexList };
};
