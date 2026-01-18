const { supabase } = require('../config/supabase');
const PaperContent = require('../models/PaperContent');

exports.getAllPaperBibtex = async (userId) => {
  // 1. Get all libraries of the user
  const { data: libraries, error: libError } = await supabase
    .from('user_libraries')
    .select('library_id')
    .eq('user_id', userId);

  if (libError) throw new Error('Failed to fetch user libraries');

  if (!libraries || libraries.length === 0) return [];

  const libraryIds = libraries.map(l => l.library_id);

  // 2. Get all papers from those libraries
  const { data: papers, error: paperError } = await supabase
    .from('library_papers')
    .select('paper_id')
    .in('library_id', libraryIds);

  if (paperError) throw new Error('Failed to fetch papers from libraries');

  if (!papers || papers.length === 0) return [];

  // 3. Deduplicate paper IDs
  const uniquePaperIds = [...new Set(papers.map(p => p.paper_id))];

  // 4. Fetch BibTeX from MongoDB
  const paperContents = await PaperContent.find(
    { paperId: { $in: uniquePaperIds } },
    { _id: 0, paperId: 1, bibtex: 1 }
  );

  // 5. Remove empty BibTeX entries
  return paperContents.filter(p => p.bibtex && p.bibtex.trim() !== '');
};
