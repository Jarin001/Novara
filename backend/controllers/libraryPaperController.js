const { errorHandler } = require('../utils/errorHandler');

/**
 * Save paper to a library
 * This creates the paper if it doesn't exist, then links it to the specified library
 */
exports.savePaperToLibrary = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;

    const {
      library_id,
      s2_paper_id,
      title,
      published_year,
      citation_count,
      fields_of_study,
      reading_status = 'unread'
    } = req.body;

    // Validate required fields
    if (!library_id || !s2_paper_id || !title) {
      return res.status(400).json({ 
        message: 'library_id, s2_paper_id, and title are required' 
      });
    }

    // STEP 1: Get the actual user ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      return res.status(404).json({ message: 'User not found in database' });
    }

    const userId = userData.id;

    // STEP 2: Verify user has access to the library
    const { data: libraryAccess, error: accessError } = await supabase
      .from('libraries')
      .select('id, created_by_user_id')
      .eq('id', library_id)
      .single();

    if (accessError || !libraryAccess) {
      return res.status(404).json({ message: 'Library not found' });
    }

    // Check if user is the creator or a collaborator
    // Both have same permissions except creator can delete library
    const isCreator = libraryAccess.created_by_user_id === userId;
    
    if (!isCreator) {
      const { data: collaborator } = await supabase
        .from('user_libraries')
        .select('id')
        .eq('library_id', library_id)
        .eq('user_id', userId)
        .single();

      if (!collaborator) {
        return res.status(403).json({ 
          message: 'You do not have access to this library' 
        });
      }
    }

    // STEP 3: Upsert paper (create if doesn't exist, get existing if it does)
    const { data: paper, error: paperError } = await supabase
      .from('papers')
      .upsert(
        {
          s2_paper_id,
          title,
          published_date: published_year ? `${published_year}-01-01` : null,
          citation_count,
          fields_of_study
        },
        { onConflict: 's2_paper_id' }
      )
      .select()
      .single();

    if (paperError) {
      console.error('Error upserting paper:', paperError);
      throw paperError;
    }

    // STEP 4: Link paper to library
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

    if (linkError) {
      // Check if paper already exists in library
      if (linkError.code === '23505') { // Unique constraint violation
        return res.status(409).json({ 
          message: 'Paper already exists in this library' 
        });
      }
      throw linkError;
    }

    res.status(201).json({ 
      message: 'Paper saved to library successfully',
      paper: {
        id: paper.id,
        s2_paper_id: paper.s2_paper_id,
        title: paper.title
      },
      library_paper: libraryPaper
    });

  } catch (err) {
    console.error('Error saving paper to library:', err);
    errorHandler(res, err, 'Failed to save paper to library');
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

    if (!library_id) {
      return res.status(400).json({ message: 'library_id is required' });
    }

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify access to library
    const { data: libraryAccess, error: accessError } = await supabase
      .from('libraries')
      .select('id, created_by_user_id, is_public')
      .eq('id', library_id)
      .single();

    if (accessError || !libraryAccess) {
      return res.status(404).json({ message: 'Library not found' });
    }

    const hasAccess = 
      libraryAccess.is_public || 
      libraryAccess.created_by_user_id === userData.id;

    if (!hasAccess) {
      const { data: collaborator } = await supabase
        .from('user_libraries')
        .select('id')
        .eq('library_id', library_id)
        .eq('user_id', userData.id)
        .single();

      if (!collaborator) {
        return res.status(403).json({ 
          message: 'You do not have access to this library' 
        });
      }
    }

    // Get papers with library metadata
    const { data: papers, error: papersError } = await supabase
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
          published_date,
          citation_count,
          fields_of_study
        )
      `)
      .eq('library_id', library_id)
      .order('added_at', { ascending: false });

    if (papersError) throw papersError;

    res.json({
      library_id,
      papers: papers.map(lp => ({
        library_paper_id: lp.id,
        reading_status: lp.reading_status,
        added_at: lp.added_at,
        last_read_at: lp.last_read_at,
        ...lp.papers
      }))
    });

  } catch (err) {
    console.error('Error fetching library papers:', err);
    errorHandler(res, err, 'Failed to fetch library papers');
  }
};

/**
 * Remove paper from library
 */
exports.removePaperFromLibrary = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { library_id, paper_id } = req.params;

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify user has access to the library (creator or collaborator)
    // Both can remove papers, only creator can delete the entire library
    const { data: libraryAccess, error: accessError } = await supabase
      .from('libraries')
      .select('id, created_by_user_id')
      .eq('id', library_id)
      .single();

    if (accessError || !libraryAccess) {
      return res.status(404).json({ message: 'Library not found' });
    }

    const isCreator = libraryAccess.created_by_user_id === userData.id;
    let hasAccess = isCreator;

    if (!isCreator) {
      const { data: collaborator } = await supabase
        .from('user_libraries')
        .select('id')
        .eq('library_id', library_id)
        .eq('user_id', userData.id)
        .single();

      hasAccess = !!collaborator;
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        message: 'You do not have access to this library' 
      });
    }

    // Delete the library_paper relationship
    const { error: deleteError } = await supabase
      .from('library_papers')
      .delete()
      .eq('library_id', library_id)
      .eq('paper_id', paper_id);

    if (deleteError) throw deleteError;

    res.json({ message: 'Paper removed from library successfully' });

  } catch (err) {
    console.error('Error removing paper from library:', err);
    errorHandler(res, err, 'Failed to remove paper from library');
  }
};
