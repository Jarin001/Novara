// paperController.js - UPDATED VERSION

const paperDetailsService = require('../services/paperdetails.service');

/**
 * Preview paper details from API (Step 1: Fetch and show to user for confirmation)
 */
exports.fetchPaperPreview = async (req, res) => {
  try {
    const { paperId } = req.body;

    if (!paperId) {
      return res.status(400).json({ message: 'paperId is required' });
    }

    const data = await paperDetailsService.getPaperDetails(paperId);

    res.json({
      s2_paper_id: data.paperId,
      title: data.title,
      published_year: data.year,
      citation_count: data.citationCount,
      fields_of_study: data.fieldsOfStudy || [],
      authors: data.authors?.map(a => a.name) || [],
      venue: data.venue || null,
      is_open_access: data.isOpenAccess || false,
      pdf_url: data.openAccessPdf?.url || null,
      doi: data.externalIds?.DOI || null,
      arxiv_id: data.externalIds?.ArXiv || null,
      abstract: data.abstract,
      tldr: data.tldr,
      reference_count: data.referenceCount,
      publication_date: data.publicationDate
    });
  } catch (err) {
    console.error('Error fetching paper preview:', err);
    res.status(404).json({ 
      message: 'Paper not found. Please check the paper ID, DOI, or ArXiv ID and try again.' 
    });
  }
};

/**
 * Add paper to user's publications (Step 2: User confirms, add to profile)
 */
exports.addUserPublication = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { s2_paper_id, title, published_year, citation_count, fields_of_study } = req.body;

    // Validate required fields
    if (!s2_paper_id || !title) {
      return res.status(400).json({ 
        message: 's2_paper_id and title are required' 
      });
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

    // Upsert paper into papers table
    const { data: paper, error: paperError } = await supabase
      .from('papers')
      .upsert(
        {
          s2_paper_id,
          title,
          published_date: published_year ? `${published_year}-01-01` : null,
          citation_count: citation_count || 0,
          fields_of_study: fields_of_study || []
        },
        { onConflict: 's2_paper_id' }
      )
      .select()
      .single();

    if (paperError) throw paperError;

    // Check if already added
    const { data: existing } = await supabase
      .from('user_papers')
      .select('id')
      .eq('user_id', userData.id)
      .eq('paper_id', paper.id)
      .single();

    if (existing) {
      return res.status(409).json({ 
        message: 'This paper is already in your publications' 
      });
    }

    // Add to user's publications
    const { data: userPaper, error: linkError } = await supabase
      .from('user_papers')
      .insert({
        user_id: userData.id,
        paper_id: paper.id
      })
      .select()
      .single();

    if (linkError) throw linkError;

    res.status(201).json({
      message: 'Paper added to your publications successfully',
      publication: {
        id: userPaper.id,
        s2_paper_id: paper.s2_paper_id,
        title: paper.title,
        published_date: paper.published_date,
        citation_count: paper.citation_count,
        fields_of_study: paper.fields_of_study,
        uploaded_at: userPaper.uploaded_at
      }
    });

  } catch (err) {
    console.error('Error adding publication:', err);
    res.status(500).json({ message: 'Failed to add paper to publications' });
  }
};

/**
 * Get user's publications
 */
exports.getUserPublications = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { data: publications, error: pubError } = await supabase
      .from('user_papers')
      .select(`
        id,
        uploaded_at,
        papers (
          id,
          s2_paper_id,
          title,
          published_date,
          citation_count,
          fields_of_study
        )
      `)
      .eq('user_id', userData.id)
      .order('uploaded_at', { ascending: false });

    if (pubError) throw pubError;

    res.json({
      publications: publications.map(pub => ({
        id: pub.id,
        uploaded_at: pub.uploaded_at,
        ...pub.papers
      }))
    });

  } catch (err) {
    console.error('Error fetching publications:', err);
    res.status(500).json({ message: 'Failed to fetch publications' });
  }
};

/**
 * Remove paper from user's publications
 */
exports.removeUserPublication = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { publication_id } = req.params;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { error: deleteError } = await supabase
      .from('user_papers')
      .delete()
      .eq('id', publication_id)
      .eq('user_id', userData.id);

    if (deleteError) throw deleteError;

    res.json({ message: 'Publication removed successfully' });

  } catch (err) {
    console.error('Error removing publication:', err);
    res.status(500).json({ message: 'Failed to remove publication' });
  }
};

module.exports = {
  fetchPaperPreview: exports.fetchPaperPreview,
  addUserPublication: exports.addUserPublication,
  getUserPublications: exports.getUserPublications,
  removeUserPublication: exports.removeUserPublication
};