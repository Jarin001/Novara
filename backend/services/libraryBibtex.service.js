const { supabase } = require('../config/supabase');
const PaperContent = require('../models/PaperContent');

exports.getLibraryBibtex = async (userId, libraryId) => {
  // 1. Check access
  const { data: access, error: accessError } = await supabase
    .from('user_libraries')
    .select('id')
    .eq('user_id', userId)
    .eq('library_id', libraryId);

  if (accessError || access.length === 0) {
    throw new Error('Access denied to this library');
  }

  // 2. Get papers in library
  const { data: libraryPapers, error } = await supabase
    .from('library_papers')
    .select('paper_id')
    .eq('library_id', libraryId);

  if (error) {
    throw new Error('Failed to fetch library papers');
  }

  if (!libraryPapers.length) return [];

  const paperIds = libraryPapers.map(p => p.paper_id);

  // 3. Fetch BibTeX from Mongo
  const paperContents = await PaperContent.find(
    { paperId: { $in: paperIds } },
    { _id: 0, paperId: 1, bibtex: 1 }
  );

  // Map paperId → bibtex
  const contentMap = new Map(
    paperContents.map(p => [p.paperId, p.bibtex])
  );

  // 4. Return in same order as libraryPapers, skipping empty bibtex
  return paperIds
    .map(id => {
      const bib = contentMap.get(id);
      return bib && bib.trim() !== '' ? { paperId: id, bibtex: bib } : null;
    })
    .filter(Boolean); // removes nulls
};
