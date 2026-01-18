const { errorHandler } = require('../utils/errorHandler');
const PaperContent = require('../models/PaperContent');
const LibraryPaperNote = require('../models/LibraryPaperNote');

/**
 * Save paper to a library (HYBRID: SQL + Mongo)
 */
exports.savePaperToLibrary = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;

    const {
      library_id,
      s2_paper_id,
      title,
      venue,
      published_year,
      citation_count,
      fields_of_study,
      abstract,
      bibtex,
      reading_status = 'unread'
    } = req.body;

    if (!library_id || !s2_paper_id || !title) {
      return res.status(400).json({
        message: 'library_id, s2_paper_id, and title are required'
      });
    }

    // STEP 1: Get user
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userData.id;

    // STEP 2: Verify library access
    const { data: library } = await supabase
      .from('libraries')
      .select('created_by_user_id')
      .eq('id', library_id)
      .single();

    if (!library) {
      return res.status(404).json({ message: 'Library not found' });
    }

    if (library.created_by_user_id !== userId) {
      const { data: collaborator } = await supabase
        .from('user_libraries')
        .select('id')
        .eq('library_id', library_id)
        .eq('user_id', userId)
        .single();

      if (!collaborator) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // STEP 3: Upsert paper (Postgres)
    const { data: paper, error: paperError } = await supabase
      .from('papers')
      .upsert(
        {
          s2_paper_id,
          title,
          venue,
          published_date: published_year ? `${published_year}-01-01` : null,
          citation_count,
          fields_of_study
        },
        { onConflict: 's2_paper_id' }
      )
      .select()
      .single();

    if (paperError) throw paperError;

    // STEP 4: Upsert paper content (Mongo)
    await PaperContent.findOneAndUpdate(
      { paperId: paper.id },
      {
        paperId: paper.id,
        s2PaperId: s2_paper_id,
        abstract: abstract || '',
        bibtex: bibtex || ''
      },
      { upsert: true, new: true }
    );

    // STEP 5: Link paper to library
    const { data: libraryPaper, error: linkError } = await supabase
      .from('library_papers')
      .insert({
        library_id,
        paper_id: paper.id,
        added_by_user_id: userId,
        reading_status
      })
      .select()
      .single();

    if (linkError?.code === '23505') {
      return res.status(409).json({ message: 'Paper already exists in library' });
    }

    res.status(201).json({
      message: 'Paper saved successfully',
      paper,
      library_paper: libraryPaper
    });

  } catch (err) {
    console.error(err);
    errorHandler(res, err, 'Failed to save paper');
  }
};

/**
 * Get all papers in a library 
 */
exports.getLibraryPapers = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { library_id } = req.params;

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get SQL papers
    const { data: papers } = await supabase
      .from('library_papers')
      .select(`
        id,
        added_at,
        reading_status,
        last_read_at,
        papers (
          id,
          s2_paper_id,
          title,
          venue,
          published_date,
          citation_count,
          fields_of_study
        )
      `)
      .eq('library_id', library_id)
      .order('added_at', { ascending: false });

    const paperIds = papers.map(p => p.papers.id);

    // Get Mongo content
    const contents = await PaperContent.find({
      paperId: { $in: paperIds }
    }).lean();

    const contentMap = Object.fromEntries(
      contents.map(c => [c.paperId, c])
    );

    res.json({
      library_id,
      papers: papers.map(lp => ({
        library_paper_id: lp.id,
        reading_status: lp.reading_status,
        added_at: lp.added_at,
        last_read_at: lp.last_read_at,
        ...lp.papers,
        abstract: contentMap[lp.papers.id]?.abstract || '',
        bibtex: contentMap[lp.papers.id]?.bibtex || ''
      }))
    });

  } catch (err) {
    console.error(err);
    errorHandler(res, err, 'Failed to fetch library papers');
  }
};

/**
 * Remove paper from library (HYBRID DELETE)
 */
exports.removePaperFromLibrary = async (req, res) => {
  try {
    const supabase = req.supabase;
    const { library_id, paper_id } = req.params;

    // Remove SQL relation
    await supabase
      .from('library_papers')
      .delete()
      .eq('library_id', library_id)
      .eq('paper_id', paper_id);

    // Remove Mongo data
    await Promise.all([
      PaperContent.deleteOne({ paperId: paper_id }),
      LibraryPaperNote.deleteMany({ paperId: paper_id, libraryId: library_id })
    ]);

    res.json({ message: 'Paper removed successfully' });

  } catch (err) {
    console.error(err);
    errorHandler(res, err, 'Failed to remove paper');
  }
};
