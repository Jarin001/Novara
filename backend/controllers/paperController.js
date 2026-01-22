// paperController.js - CORRECTED VERSION

const paperDetailsService = require('../services/paperdetails.service');

/**
 * Step 1: Preview paper details from API
 * ONLY fetches from API, does NOT save to database
 * Returns ALL fields to frontend for preview
 */
exports.fetchPaperPreview = async (req, res) => {
  try {
    const { paperId } = req.body;

    if (!paperId) {
      return res.status(400).json({ message: 'paperId is required' });
    }

    console.log('🔍 Fetching paper preview for:', paperId);

    // ONLY fetch from API - don't save anything yet
    const data = await paperDetailsService.getPaperDetails(paperId);

    console.log('📄 Paper preview fetched:', {
      paperId: data.paperId,
      title: data.title,
      hasAbstract: !!data.abstract,
      abstractLength: data.abstract?.length || 0
    });

    // Return ALL fields from the API response for preview
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
    console.error('❌ Error fetching paper preview:', err);
    res.status(404).json({ 
      message: 'Paper not found. Please check the paper ID, DOI, or ArXiv ID and try again.' 
    });
  }
};

/**
 * Step 2: Add paper to user's publications (AFTER user confirms)
 * THIS is where we save everything to the database
 */
exports.addUserPublication = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const PaperContent = require('../models/PaperContent');
    
    // Frontend should send ALL paper details that were previewed
    const { paperData } = req.body;

    // Validate required fields
    if (!paperData || !paperData.paperId) {
      return res.status(400).json({ 
        message: 'Paper data is required. Please preview the paper first.' 
      });
    }

    console.log('💾 User confirmed, saving paper:', {
      paperId: paperData.paperId,
      title: paperData.title
    });

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if paper already exists in database
    let { data: existingPaper } = await supabase
      .from('papers')
      .select('id, s2_paper_id, title')
      .eq('s2_paper_id', paperData.paperId)
      .maybeSingle();

    let paper;

    if (existingPaper) {
      console.log('📌 Paper already exists in database:', existingPaper.id);
      paper = existingPaper;
    } else {
      console.log('📝 Creating new paper in database...');
      
      // Save paper to PostgreSQL
      const { data: newPaper, error: paperError } = await supabase
        .from('papers')
        .insert({
          s2_paper_id: paperData.paperId,
          title: paperData.title,
          year: paperData.year || null,
          published_date: paperData.publicationDate || (paperData.year ? `${paperData.year}-01-01` : null),
          citation_count: paperData.citationCount || 0,
          fields_of_study: paperData.fieldsOfStudy || []
        })
        .select()
        .single();

      if (paperError) {
        console.error('❌ Error saving paper to PostgreSQL:', paperError);
        throw paperError;
      }

      paper = newPaper;
      console.log('✅ Paper saved to PostgreSQL:', paper.id);

      // Save abstract to MongoDB (only if paper is new)
      try {
        console.log('💾 Saving abstract to MongoDB...', {
          paperId: paper.id,
          hasAbstract: !!paperData.abstract,
          abstractLength: paperData.abstract?.length || 0
        });

        const mongoDoc = await PaperContent.findOneAndUpdate(
          { s2PaperId: paperData.paperId },
          {
            paperId: paper.id.toString(),
            s2PaperId: paperData.paperId,
            abstract: paperData.abstract || '',
            bibtex: paperData.bibtex || ''
          },
          { upsert: true, new: true }
        );

        console.log('✅ Abstract saved to MongoDB:', {
          _id: mongoDoc._id,
          abstractLength: mongoDoc.abstract.length
        });

      } catch (mongoError) {
        console.error('❌ MongoDB error (non-fatal):', mongoError);
        // Continue even if MongoDB fails - abstract is not critical
      }

      // Save authors (only if paper is new)
      if (paperData.authors && Array.isArray(paperData.authors) && paperData.authors.length > 0) {
        console.log(`👥 Saving ${paperData.authors.length} authors...`);

        for (const authorData of paperData.authors) {
          const authorName = typeof authorData === 'string' ? authorData : authorData.name;
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
                console.error('❌ Error creating author:', createError);
                continue;
              }
              authorId = newAuthor.id;
            }

            // Link author to paper
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
            console.error('❌ Error processing author:', authorName, err);
          }
        }

        console.log('✅ Authors saved successfully');
      }
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

    // Link paper to user's publications
    console.log('🔗 Linking paper to user...');
    
    const { data: userPaper, error: linkError } = await supabase
      .from('user_papers')
      .insert({
        user_id: userData.id,
        paper_id: paper.id
      })
      .select()
      .single();

    if (linkError) {
      console.error('❌ Error linking paper to user:', linkError);
      throw linkError;
    }

    console.log('✅ Paper successfully added to user publications');

    res.status(201).json({
      message: 'Paper added to your publications successfully',
      publication: {
        id: userPaper.id,
        s2_paper_id: paper.s2_paper_id,
        title: paper.title,
        year: paper.year,
        citation_count: paper.citation_count,
        uploaded_at: userPaper.uploaded_at
      }
    });

  } catch (err) {
    console.error('❌ Error adding publication:', err);
    res.status(500).json({ 
      message: 'Failed to add paper to publications',
      error: err.message 
    });
  }
};

/**
 * Get user's publications with authors and abstract from MongoDB
 */
exports.getUserPublications = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const PaperContent = require('../models/PaperContent');

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
          year,
          published_date,
          citation_count,
          fields_of_study
        )
      `)
      .eq('user_id', userData.id)
      .order('uploaded_at', { ascending: false });

    if (pubError) throw pubError;

    console.log(`📚 Fetching details for ${publications.length} papers`);

    // Fetch all abstracts in one query (optimized)
    const paperIds = publications.map(p => p.papers.id.toString());
    
    let allPaperContents = [];
    try {
      allPaperContents = await PaperContent.find({ 
        paperId: { $in: paperIds } 
      });
      console.log(`✅ Found ${allPaperContents.length} abstracts in MongoDB`);
    } catch (mongoError) {
      console.error('❌ Error fetching from MongoDB:', mongoError);
    }

    // Create a map for O(1) lookup
    const contentMap = new Map(
      allPaperContents.map(pc => [pc.paperId, pc])
    );

    // Fetch authors and combine with abstracts
    const publicationsWithDetails = await Promise.all(
      publications.map(async (pub) => {
        // Fetch authors from PostgreSQL
        const { data: authorData } = await supabase
          .from('author_papers')
          .select(`
            authors (
              id,
              name,
              affiliation
            )
          `)
          .eq('paper_id', pub.papers.id);

        const authors = authorData?.map(ap => ap.authors.name) || [];

        // Get abstract from the map
        const paperContent = contentMap.get(pub.papers.id.toString());
        const abstract = paperContent?.abstract || '';

        return {
          id: pub.id,
          uploaded_at: pub.uploaded_at,
          ...pub.papers,
          authors: authors,
          abstract: abstract
        };
      })
    );

    res.json({
      publications: publicationsWithDetails
    });

  } catch (err) {
    console.error('❌ Error fetching publications:', err);
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
    console.error('❌ Error removing publication:', err);
    res.status(500).json({ message: 'Failed to remove publication' });
  }
};

module.exports = {
  fetchPaperPreview: exports.fetchPaperPreview,
  addUserPublication: exports.addUserPublication,
  getUserPublications: exports.getUserPublications,
  removeUserPublication: exports.removeUserPublication
};