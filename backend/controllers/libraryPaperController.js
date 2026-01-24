const { errorHandler } = require('../utils/errorHandler');
const PaperService = require('../services/paperService');
const LibraryAccessService = require('../services/libraryAccessService');
const AuthorService = require('../services/authorService');

/**
 * Save paper to a library (HYBRID: SQL + Mongo)
 */
exports.savePaperToLibrary = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { library_id } = req.params;

    const {
      s2_paper_id,
      title,
      venue,
      published_year,
      citation_count,
      fields_of_study,
      abstract,
      bibtex,
      authors = [], // Array of {name, affiliation}
      user_note = '',
      reading_status = 'unread'
    } = req.body;

    // Validate required fields
    if (!s2_paper_id || !title) {
      return res.status(400).json({
        message: 's2_paper_id and title are required'
      });
    }

    // Get user and verify access
    const userId = await LibraryAccessService.getUserId(supabase, authId);
    await LibraryAccessService.verifyLibraryAccess(supabase, library_id, userId);

    // Upsert paper
    const paper = await PaperService.upsertPaper(supabase, {
      s2_paper_id,
      title,
      venue,
      year: published_year,
      citation_count,
      fields_of_study
    });

    // Handle authors
    if (authors && authors.length > 0) {
      await AuthorService.linkAuthorsToaPaper(supabase, paper.id, authors);
    }

    // Save paper content (MongoDB)
    await PaperService.savePaperContent(paper.id, s2_paper_id, abstract, bibtex);

    // Link paper to library
    const libraryPaper = await PaperService.linkPaperToLibrary(
      supabase,
      library_id,
      paper.id,
      userId,
      reading_status
    );

    // Save user note (MongoDB)
    await PaperService.saveUserNote(userId, library_id, paper.id, user_note);

    // Get the complete paper with authors for response
    const paperWithAuthors = await AuthorService.getPaperWithAuthors(supabase, paper.id);

    res.status(201).json({
      message: 'Paper saved successfully',
      paper: paperWithAuthors,
      library_paper: libraryPaper
    });

  } catch (err) {
    console.error(err);
    
    if (err.code === 'DUPLICATE') {
      return res.status(409).json({ message: err.message });
    }
    if (err.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: err.message });
    }
    if (err.code === 'LIBRARY_NOT_FOUND') {
      return res.status(404).json({ message: err.message });
    }
    if (err.code === 'ACCESS_DENIED') {
      return res.status(403).json({ message: err.message });
    }
    
    errorHandler(res, err, 'Failed to save paper');
  }
};

/**
 * Get all papers in a specific library
 */
exports.getLibraryPapers = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { library_id } = req.params;

    // Get user and verify access
    const userId = await LibraryAccessService.getUserId(supabase, authId);
    await LibraryAccessService.verifyLibraryAccess(supabase, library_id, userId);

    // Get papers from PostgreSQL
    const papers = await PaperService.getLibraryPapersFromDB(supabase, library_id);

    if (papers.length === 0) {
      return res.json({ library_id, papers: [] });
    }

    const paperIds = papers.map(p => p.papers.id);

    // Get MongoDB data and authors
    const [contentMap, notes, authorsMap] = await Promise.all([
      PaperService.getPaperContents(paperIds),
      PaperService.getUserNotes(userId, library_id, paperIds),
      AuthorService.getAuthorsForPapers(supabase, paperIds)
    ]);

    const noteMap = Object.fromEntries(
      notes.map(n => [n.paperId, n])
    );

    // Combine data
    const result = papers.map(lp => ({
      library_paper_id: lp.id,
      reading_status: lp.reading_status,
      added_at: lp.added_at,
      last_read_at: lp.last_read_at,
      ...lp.papers,
      authors: authorsMap[lp.papers.id] || [],
      abstract: contentMap[lp.papers.id]?.abstract || '',
      bibtex: contentMap[lp.papers.id]?.bibtex || '',
      user_note: noteMap[lp.papers.id.toString()]?.userNote || ''
    }));

    res.json({
      library_id,
      papers: result
    });

  } catch (err) {
    console.error(err);
    
    if (err.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: err.message });
    }
    if (err.code === 'LIBRARY_NOT_FOUND') {
      return res.status(404).json({ message: err.message });
    }
    if (err.code === 'ACCESS_DENIED') {
      return res.status(403).json({ message: err.message });
    }
    
    errorHandler(res, err, 'Failed to fetch library papers');
  }
};

/**
 * Get all unique papers across all user's libraries (NO DUPLICATES)
 */
exports.getAllUserPapers = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;

    // Get user
    const userId = await LibraryAccessService.getUserId(supabase, authId);

    // Get all accessible libraries
    const libraryIds = await LibraryAccessService.getUserAccessibleLibraries(supabase, userId);

    if (libraryIds.length === 0) {
      return res.json({ papers: [] });
    }

    // Get all papers from these libraries
    const { data: libraryPapers } = await supabase
      .from('library_papers')
      .select(`
        paper_id,
        library_id,
        added_at,
        reading_status,
        last_read_at,
        papers (
          id,
          s2_paper_id,
          title,
          venue,
          year,
          citation_count,
          fields_of_study
        )
      `)
      .in('library_id', libraryIds)
      .order('added_at', { ascending: false });

    if (!libraryPapers || libraryPapers.length === 0) {
      return res.json({ papers: [] });
    }

    // Remove duplicates and aggregate
    const uniquePapers = PaperService.removeDuplicatesAndAggregate(libraryPapers);
    const paperIds = uniquePapers.map(p => p.paper_id);

    // Get MongoDB data and authors
    const [contentMap, notes, authorsMap] = await Promise.all([
      PaperService.getPaperContents(paperIds),
      PaperService.getUserNotes(userId, null, paperIds),
      AuthorService.getAuthorsForPapers(supabase, paperIds)
    ]);

    // Group notes by paper
    const notesByPaper = {};
    notes.forEach(note => {
      if (!notesByPaper[note.paperId]) {
        notesByPaper[note.paperId] = [];
      }
      notesByPaper[note.paperId].push({
        library_id: note.libraryId,
        user_note: note.userNote
      });
    });

    // Combine all data
    const result = uniquePapers.map(up => ({
      paper_id: up.paper_id,
      s2_paper_id: up.paper_data.s2_paper_id,
      title: up.paper_data.title,
      venue: up.paper_data.venue,
      year: up.paper_data.year,
      citation_count: up.paper_data.citation_count,
      fields_of_study: up.paper_data.fields_of_study,
      authors: authorsMap[up.paper_id] || [],
      abstract: contentMap[up.paper_id]?.abstract || '',
      bibtex: contentMap[up.paper_id]?.bibtex || '',
      first_added_at: up.first_added_at,
      last_read_at: up.last_read_at,
      library_ids: up.library_ids,
      reading_statuses: up.reading_statuses,
      notes: notesByPaper[up.paper_id.toString()] || []
    }));

    res.json({
      total_papers: result.length,
      papers: result
    });

  } catch (err) {
    console.error(err);
    
    if (err.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: err.message });
    }
    
    errorHandler(res, err, 'Failed to fetch all user papers');
  }
};

/**
 * Remove paper from library (HYBRID DELETE)
 */
exports.removePaperFromLibrary = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { library_id, paper_id } = req.params;

    // Get user and verify access
    const userId = await LibraryAccessService.getUserId(supabase, authId);
    await LibraryAccessService.verifyLibraryAccess(supabase, library_id, userId);

    // Remove SQL relation
    const { error: deleteError } = await supabase
      .from('library_papers')
      .delete()
      .eq('library_id', library_id)
      .eq('paper_id', paper_id);

    if (deleteError) throw deleteError;

    // Check if paper exists in other libraries
    const existsElsewhere = await PaperService.paperExistsInOtherLibraries(
      supabase,
      paper_id,
      library_id
    );

    // Only delete MongoDB content if paper is not in any other library
    if (!existsElsewhere) {
      await PaperService.deletePaperContent(paper_id);
    }

    // Always delete the specific library note
    await PaperService.deleteUserNote(userId, library_id, paper_id);

    res.json({ message: 'Paper removed from library successfully' });

  } catch (err) {
    console.error(err);
    
    if (err.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: err.message });
    }
    if (err.code === 'LIBRARY_NOT_FOUND') {
      return res.status(404).json({ message: err.message });
    }
    if (err.code === 'ACCESS_DENIED') {
      return res.status(403).json({ message: err.message });
    }
    
    errorHandler(res, err, 'Failed to remove paper');
  }
};

/**
 * Update paper reading status
 */
exports.updateReadingStatus = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { library_id, paper_id } = req.params;
    const { reading_status } = req.body;

    if (!['unread', 'reading', 'read'].includes(reading_status)) {
      return res.status(400).json({
        message: 'Invalid reading status. Must be: unread, reading, or read'
      });
    }

    // Verify user
    const userId = await LibraryAccessService.getUserId(supabase, authId);

    // Update status
    const { data: updated, error } = await supabase
      .from('library_papers')
      .update({
        reading_status,
        last_read_at: new Date().toISOString()
      })
      .eq('library_id', library_id)
      .eq('paper_id', paper_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Reading status updated',
      library_paper: updated
    });

  } catch (err) {
    console.error(err);
    
    if (err.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: err.message });
    }
    
    errorHandler(res, err, 'Failed to update reading status');
  }
};

/**
 * Update or create user note for a paper in a library
 */
exports.updatePaperNote = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { library_id, paper_id } = req.params;
    const { user_note } = req.body;

    // Verify user
    const userId = await LibraryAccessService.getUserId(supabase, authId);

    // Verify paper exists in library
    const { data: libraryPaper } = await supabase
      .from('library_papers')
      .select('id')
      .eq('library_id', library_id)
      .eq('paper_id', paper_id)
      .single();

    if (!libraryPaper) {
      return res.status(404).json({ message: 'Paper not found in this library' });
    }

    // Update note in MongoDB
    const note = await PaperService.saveUserNote(userId, library_id, paper_id, user_note);

    res.json({
      message: 'Note updated successfully',
      note
    });

  } catch (err) {
    console.error(err);
    
    if (err.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: err.message });
    }
    
    errorHandler(res, err, 'Failed to update note');
  }
};