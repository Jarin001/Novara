const paperDetailsService = require('../services/paperdetails.service');
const PaperService = require('../services/paperService');
const AuthorService = require('../services/authorService');

/**
 * Step 1: Preview paper details from API
 * This function remains unchanged as it only fetches from external API
 */
exports.fetchPaperPreview = async (req, res) => {
  try {
    const { paperId } = req.body;

    if (!paperId) {
      return res.status(400).json({ message: 'paperId is required' });
    }

    console.log('Fetching paper preview for:', paperId);

    // ONLY fetch from API - don't save anything yet
    const data = await paperDetailsService.getPaperDetails(paperId);

    console.log('aper preview fetched:', {
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
    console.error('Error fetching paper preview:', err);
    res.status(404).json({ 
      message: 'Paper not found. Please check the paper ID, DOI, or ArXiv ID and try again.' 
    });
  }
};

/**
 *  Add paper to user's publications 
 */
exports.addUserPublication = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { paperData } = req.body;

 
    // VALIDATION
    if (!paperData || (!paperData.paperId && !paperData.s2_paper_id)) {
      return res.status(400).json({ 
        message: 'Paper data is required. Please preview the paper first.' 
      });
    }

    // Normalize paper ID (accept both field names)
    const s2PaperId = paperData.paperId || paperData.s2_paper_id;

    console.log('User confirmed, saving paper:', {
      s2PaperId: s2PaperId,
      title: paperData.title,
      hasAbstract: !!paperData.abstract,
      abstractLength: paperData.abstract?.length || 0
    });

  
    //  GET USER ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

  
    // UPSERT PAPER (using PaperService)
    
    console.log('Upserting paper to database...');
    
    const paper = await PaperService.upsertPaper(supabase, {
      s2_paper_id: s2PaperId,
      title: paperData.title,
      venue: paperData.venue,
      year: paperData.year || paperData.published_year || null,
      citation_count: paperData.citationCount || paperData.citation_count || 0,
      fields_of_study: paperData.fieldsOfStudy || paperData.fields_of_study || []
    });

    console.log('Paper upserted:', paper.id);

    
    // LINK AUTHORS
    
    if (paperData.authors && Array.isArray(paperData.authors) && paperData.authors.length > 0) {
      console.log(`Linking ${paperData.authors.length} authors...`);
      
      // Transform authors to expected format {name, affiliation}
      const authorsToLink = paperData.authors.map(authorData => {
        if (typeof authorData === 'string') {
          return { name: authorData, affiliation: null };
        }
        return {
          name: authorData.name,
          affiliation: authorData.affiliation || null
        };
      }).filter(a => a.name && a.name.trim() !== '');

      try {
        await AuthorService.linkAuthorsToaPaper(supabase, paper.id, authorsToLink);
        console.log('Authors linked successfully');
      } catch (authorError) {
        console.error('Error linking authors (non-fatal):', authorError);
      }
    }

   
    // SAVE PAPER CONTENT TO MONGODB 
    try {
      console.log('Saving paper content to MongoDB...');
      
      await PaperService.savePaperContent(
        paper.id,
        s2PaperId,
        paperData.abstract || '',
        paperData.bibtex || ''
      );

      console.log('✅ Paper content saved to MongoDB');
    } catch (mongoError) {
      console.error('⚠️ MongoDB error (non-fatal):', mongoError);
      // Continue even if MongoDB fails
    }

    
    // LINK TO USER'S PUBLICATIONS (using PaperService)
   
    try {
      console.log('🔗 Linking paper to user publications...');
      
      const userPaper = await PaperService.linkPaperToUser(
        supabase,
        userData.id,
        paper.id
      );

      console.log('Paper successfully added to user publications');

   
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

    } catch (linkError) {
      // Handle specific error codes from PaperService
      if (linkError.code === 'DUPLICATE') {
        return res.status(409).json({ 
          message: 'This paper is already in your publications' 
        });
      }
      throw linkError;
    }

  } catch (err) {
    console.error('Error adding publication:', err);
    res.status(500).json({ 
      message: 'Failed to add paper to publications',
      error: err.message 
    });
  }
};

/**
 * Get user's publications 
 */
exports.getUserPublications = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;

    
    //  GET USER ID
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    
    // GET PUBLICATIONS FROM DATABASE 
    
    const publications = await PaperService.getUserPapers(supabase, userData.id);

    if (!publications || publications.length === 0) {
      return res.json({ publications: [] });
    }

    console.log(`Fetching details for ${publications.length} papers`);

 
    const paperIds = publications.map(p => p.papers.id);

    
    // FETCH ALL DATA IN PARALLEL 
    
    const [contentMap, authorsMap] = await Promise.all([
      // Get abstracts from MongoDB
      PaperService.getPaperContents(paperIds).catch(err => {
        console.error('⚠️ Error fetching paper contents:', err);
        return {}; // Return empty map on error
      }),
      // Get authors from PostgreSQL
      AuthorService.getAuthorsForPapers(supabase, paperIds).catch(err => {
        console.error('⚠️ Error fetching authors:', err);
        return {}; // Return empty map on error
      })
    ]);

    console.log(`Found ${Object.keys(contentMap).length} abstracts and authors for ${Object.keys(authorsMap).length} papers`);

    
    // COMBINE ALL DATA
    const publicationsWithDetails = publications.map(pub => ({
      id: pub.id,
      uploaded_at: pub.uploaded_at,
      paper_id: pub.papers.id,
      s2_paper_id: pub.papers.s2_paper_id,
      title: pub.papers.title,
      year: pub.papers.year,
      published_date: pub.papers.published_date,
      citation_count: pub.papers.citation_count,
      fields_of_study: pub.papers.fields_of_study,
      venue: pub.papers.venue,
      authors: authorsMap[pub.papers.id]?.map(a => a.name) || [],
      abstract: contentMap[pub.papers.id.toString()]?.abstract || ''
    }));

   
    res.json({
      publications: publicationsWithDetails
    });

  } catch (err) {
    console.error('Error fetching publications:', err);
    res.status(500).json({ 
      message: 'Failed to fetch publications',
      error: err.message 
    });
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

  

    // 1. GET USER ID
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found, ID:', userData.id);

    try {
      const deletedPublication = await PaperService.unlinkPaperFromUser(
        supabase,
        userData.id,
        publication_id
      );

      console.log('Publication deleted successfully');
      

      res.json({ 
        message: 'Publication removed successfully',
        deleted: true,
        deleted_id: publication_id,
        deleted_paper_id: deletedPublication.paper_id
      });

    } catch (serviceError) {
      // Handle specific error codes from PaperService
      if (serviceError.code === 'NOT_FOUND') {
        console.warn('Publication not found or does not belong to user');
        return res.status(404).json({ 
          message: 'Publication not found or you do not have permission to delete it' 
        });
      }
      
      if (serviceError.code === 'DELETE_FAILED') {
        console.error('Delete operation failed');
        return res.status(500).json({ 
          message: 'Failed to delete publication - no rows affected'
        });
      }

      // Re-throw other errors
      throw serviceError;
    }

  } catch (err) {
    console.error('Error removing publication:', err);
    res.status(500).json({ 
      message: 'Failed to remove publication',
      error: err.message 
    });
  }
};

module.exports = {
  fetchPaperPreview: exports.fetchPaperPreview,
  addUserPublication: exports.addUserPublication,
  getUserPublications: exports.getUserPublications,
  removeUserPublication: exports.removeUserPublication
};