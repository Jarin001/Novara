// paperController.js - UPDATED VERSION

const paperDetailsService = require('../services/paperdetails.service');

/**
 * Preview paper details from API (Step 1: Fetch and show to user for confirmation)
 * Returns ALL fields from Semantic Scholar API
 * ALSO saves paper and authors to database
 */
exports.fetchPaperPreview = async (req, res) => {
  try {
    const { paperId } = req.body;
    const supabase = req.supabase;

    if (!paperId) {
      return res.status(400).json({ message: 'paperId is required' });
    }

    const data = await paperDetailsService.getPaperDetails(paperId);

    // Upsert paper to database
    const { data: paper, error: paperError } = await supabase
      .from('papers')
      .upsert(
        {
          s2_paper_id: data.paperId,
          title: data.title,
          published_date: data.year ? `${data.year}-01-01` : null,
          citation_count: data.citationCount || 0,
          fields_of_study: data.fieldsOfStudy || []
        },
        { onConflict: 's2_paper_id' }
      )
      .select()
      .single();

    if (paperError) {
      console.error('Error upserting paper:', paperError);
    }

    // Save authors and link to paper if paper was successfully saved
    if (paper && data.authors && Array.isArray(data.authors) && data.authors.length > 0) {
      for (const author of data.authors) {
        const authorName = typeof author === 'string' ? author : author.name;
        if (!authorName || authorName.trim() === '') continue;

        try {
          // Check if author exists
          let { data: existingAuthor } = await supabase
            .from('authors')
            .select('id')
            .eq('name', authorName.trim())
            .maybeSingle();

          let authorId;

          if (existingAuthor) {
            authorId = existingAuthor.id;
          } else {
            // Create new author
            const { data: newAuthor, error: createError } = await supabase
              .from('authors')
              .insert({ name: authorName.trim() })
              .select('id')
              .single();

            if (createError) {
              console.error('Error creating author:', createError);
              continue;
            }
            authorId = newAuthor.id;
          }

          // Link author to paper if not already linked
          const { data: existingLink } = await supabase
            .from('author_papers')
            .select('id')
            .eq('author_id', authorId)
            .eq('paper_id', paper.id)
            .maybeSingle();

          if (!existingLink) {
            await supabase
              .from('author_papers')
              .insert({
                author_id: authorId,
                paper_id: paper.id
              });
          }
        } catch (err) {
          console.error('Error processing author:', authorName, err);
        }
      }
    }

    // Return ALL fields from the API response
    res.json({
      // Core identifiers
      paperId: data.paperId,
      corpusId: data.corpusId,
      externalIds: data.externalIds || {},
      url: data.url,
      
      // Basic info
      title: data.title,
      abstract: data.abstract,
      tldr: data.tldr,
      
      // Publication details
      venue: data.venue,
      year: data.year,
      publicationDate: data.publicationDate,
      publicationTypes: data.publicationTypes || [],
      
      // Journal info
      journal: data.journal || null,
      
      // Counts
      referenceCount: data.referenceCount || 0,
      citationCount: data.citationCount || 0,
      
      // Open Access
      isOpenAccess: data.isOpenAccess || false,
      openAccessPdf: data.openAccessPdf || null,
      
      // Classification
      fieldsOfStudy: data.fieldsOfStudy || [],
      
      // Authors (with all details)
      authors: data.authors || [],
      
      // Additional metadata
      textAvailability: data.textAvailability || null,
      keywords: data.keywords || [],
      
      // Backward compatibility (simplified fields)
      s2_paper_id: data.paperId,
      published_year: data.year,
      citation_count: data.citationCount,
      fields_of_study: data.fieldsOfStudy || [],
      author_names: data.authors?.map(a => typeof a === 'string' ? a : a.name) || [],
      is_open_access: data.isOpenAccess || false,
      pdf_url: data.openAccessPdf?.url || null,
      doi: data.externalIds?.DOI || null,
      arxiv_id: data.externalIds?.ArXiv || null,
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
 * Paper and authors are ALREADY in database from preview step
 * This just links the paper to the user
 */
exports.addUserPublication = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { s2_paper_id } = req.body;

    // Validate required fields
    if (!s2_paper_id) {
      return res.status(400).json({ 
        message: 's2_paper_id is required' 
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

    // Find the paper (should already exist from preview)
    const { data: paper, error: paperError } = await supabase
      .from('papers')
      .select('id, s2_paper_id, title, published_date, citation_count, fields_of_study')
      .eq('s2_paper_id', s2_paper_id)
      .single();

    if (paperError || !paper) {
      return res.status(404).json({ 
        message: 'Paper not found in database. Please fetch preview first.' 
      });
    }

    // Check if already added to user's publications
    const { data: existing } = await supabase
      .from('user_papers')
      .select('id')
      .eq('user_id', userData.id)
      .eq('paper_id', paper.id)
      .maybeSingle();

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
 * Get user's publications with authors
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

    // Fetch authors for each paper
    const publicationsWithAuthors = await Promise.all(
      publications.map(async (pub) => {
        const { data: authorData, error: authorError } = await supabase
          .from('author_papers')
          .select(`
            authors (
              id,
              name,
              affiliation
            )
          `)
          .eq('paper_id', pub.papers.id);

        if (authorError) {
          console.error('Error fetching authors:', authorError);
        }

        const authors = authorData?.map(ap => ap.authors.name) || [];

        return {
          id: pub.id,
          uploaded_at: pub.uploaded_at,
          ...pub.papers,
          authors: authors
        };
      })
    );

    res.json({
      publications: publicationsWithAuthors
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