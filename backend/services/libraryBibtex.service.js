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



exports.getLibraryCitationKeys = async (userId, libraryId, search) => {
  // FIRST - Get the correct internal user ID from auth_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', userId)
    .single();

  if (userError || !userData) {
    console.error('User lookup error:', userError);
    throw new Error('User not found');
  }

  const internalUserId = userData.id;

  // 1. Check access using internal user ID
  const { data: access, error: accessError } = await supabase
    .from('user_libraries')
    .select(`
      id,
      libraries (
        name
      )
    `)
    .eq('user_id', internalUserId)  // Use internal ID here
    .eq('library_id', libraryId)
    .single();

  if (accessError || !access) {
    console.error('Access check failed:', accessError);
    throw new Error('Access denied to this library');
  }

  const libraryName = access.libraries.name;

  // 2. Get papers in library
  const { data: libraryPapers, error: papersError } = await supabase
    .from('library_papers')
    .select(`
      paper_id,
      papers (
        title
      )
    `)
    .eq('library_id', libraryId);

  if (papersError) {
    console.error('Papers fetch error:', papersError);
    throw new Error('Failed to fetch library papers');
  }

  if (!libraryPapers || !libraryPapers.length) {
    return { libraryName, citations: [] };
  }

  // Optional title search
  let filtered = libraryPapers;

  if (search) {
    const q = search.toLowerCase();
    filtered = libraryPapers.filter(p =>
      p.papers?.title?.toLowerCase().includes(q)
    );
  }

  const paperIds = filtered.map(p => p.paper_id);

  // 3. Get BibTeX from Mongo
  const paperContents = await PaperContent.find(
    { paperId: { $in: paperIds } },
    { _id: 0, paperId: 1, bibtex: 1 }
  );

  const contentMap = new Map(
    paperContents.map(p => [p.paperId, p.bibtex])
  );

  // 4. Extract citation key
  const citations = filtered
    .map(p => {
      const bib = contentMap.get(p.paper_id);

      if (!bib) return null;

      const firstLine = bib.split("\n")[0];
      // Better extraction - get just the key part
      const match = firstLine.match(/@\w+{([^,]+),/);
      const citationKey = match ? match[1].trim() : firstLine.replace(",", "").trim();

      return {
        paperId: p.paper_id,
        title: p.papers?.title || "Unknown",
        citationKey
      };
    })
    .filter(Boolean);

  return { libraryName, citations };
};