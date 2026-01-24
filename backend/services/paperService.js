const PaperContent = require('../models/PaperContent');
const LibraryPaperNote = require('../models/LibraryPaperNote');

/**
 * Paper Service - Handles all paper-related business logic
 */
class PaperService {
  /**
   * Upsert paper in PostgreSQL
   */
  static async upsertPaper(supabase, paperData) {
    const { data: paper, error } = await supabase
      .from('papers')
      .upsert(
        {
          s2_paper_id: paperData.s2_paper_id,
          title: paperData.title,
          venue: paperData.venue,
          year: paperData.year || null,
          citation_count: paperData.citation_count,
          fields_of_study: paperData.fields_of_study
        },
        { onConflict: 's2_paper_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return paper;
  }

  /**
   * Save paper content to MongoDB
   */
  static async savePaperContent(paperId, s2PaperId, abstract, bibtex) {
    return await PaperContent.findOneAndUpdate(
      { s2PaperId: s2PaperId },  // Query by s2PaperId (more reliable)
      {
        paperId: paperId.toString(),  // Store as string
        s2PaperId: s2PaperId,
        abstract: abstract || '',
        bibtex: bibtex || ''
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Link paper to library
   */
  static async linkPaperToLibrary(supabase, libraryId, paperId, userId, readingStatus) {
    const { data: libraryPaper, error } = await supabase
      .from('library_papers')
      .insert({
        library_id: libraryId,
        paper_id: paperId,
        added_by_user_id: userId,
        reading_status: readingStatus
      })
      .select()
      .single();

    if (error?.code === '23505') {
      const err = new Error('Paper already exists in library');
      err.code = 'DUPLICATE';
      throw err;
    }
    if (error) throw error;

    return libraryPaper;
  }

  /**
   * Save or update user note
   */
  static async saveUserNote(userId, libraryId, paperId, userNote) {
    return await LibraryPaperNote.findOneAndUpdate(
      {
        userId: userId.toString(),
        libraryId: libraryId.toString(),
        paperId: paperId.toString()
      },
      {
        userId: userId.toString(),
        libraryId: libraryId.toString(),
        paperId: paperId.toString(),
        userNote: userNote || ''
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Get paper contents from MongoDB
   */
  static async getPaperContents(paperIds) {
    const contents = await PaperContent.find({
      paperId: { $in: paperIds.map(id => id.toString()) }  // Convert to strings
    }).lean();

    return Object.fromEntries(
      contents.map(c => [c.paperId, c])
    );
  }

  /**
   * Get user notes from MongoDB
   */
  static async getUserNotes(userId, libraryId, paperIds) {
    const notes = await LibraryPaperNote.find({
      userId: userId.toString(),
      libraryId: libraryId ? libraryId.toString() : undefined,
      paperId: { $in: paperIds.map(id => id.toString()) }
    }).lean();

    return notes;
  }

  /**
   * Check if paper exists in other libraries
   */
  static async paperExistsInOtherLibraries(supabase, paperId, excludeLibraryId) {
    const { data } = await supabase
      .from('library_papers')
      .select('id')
      .eq('paper_id', paperId)
      .neq('library_id', excludeLibraryId)
      .limit(1);

    return data && data.length > 0;
  }

  /**
   * Delete paper content from MongoDB
   */
  static async deletePaperContent(paperId) {
    await PaperContent.deleteOne({ paperId: paperId.toString() });
  }

  /**
   * Delete user note from MongoDB
   */
  static async deleteUserNote(userId, libraryId, paperId) {
    await LibraryPaperNote.deleteOne({
      userId: userId.toString(),
      libraryId: libraryId.toString(),
      paperId: paperId.toString()
    });
  }

  /**
   * Get library papers from PostgreSQL
   */
  static async getLibraryPapersFromDB(supabase, libraryId) {
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
          year,
          citation_count,
          fields_of_study
        )
      `)
      .eq('library_id', libraryId)
      .order('added_at', { ascending: false });

    return papers || [];
  }

  /**
   * Remove duplicates and aggregate paper data
   */
  static removeDuplicatesAndAggregate(libraryPapers) {
    const uniquePapersMap = new Map();
    
    libraryPapers.forEach(lp => {
      const paperId = lp.paper_id;
      if (!uniquePapersMap.has(paperId)) {
        uniquePapersMap.set(paperId, {
          paper_id: lp.paper_id,
          library_ids: [lp.library_id],
          first_added_at: lp.added_at,
          reading_statuses: [lp.reading_status],
          last_read_at: lp.last_read_at,
          paper_data: lp.papers
        });
      } else {
        const existing = uniquePapersMap.get(paperId);
        if (!existing.library_ids.includes(lp.library_id)) {
          existing.library_ids.push(lp.library_id);
        }
        if (!existing.reading_statuses.includes(lp.reading_status)) {
          existing.reading_statuses.push(lp.reading_status);
        }
        if (new Date(lp.added_at) < new Date(existing.first_added_at)) {
          existing.first_added_at = lp.added_at;
        }
        if (lp.last_read_at && (!existing.last_read_at || new Date(lp.last_read_at) > new Date(existing.last_read_at))) {
          existing.last_read_at = lp.last_read_at;
        }
      }
    });

    return Array.from(uniquePapersMap.values());
  }

  /**
   * Link paper to user's publications
   */
  static async linkPaperToUser(supabase, userId, paperId) {
    // Check if already linked
    const { data: existing } = await supabase
      .from('user_papers')
      .select('id')
      .eq('user_id', userId)
      .eq('paper_id', paperId)
      .maybeSingle();

    if (existing) {
      const err = new Error('Paper already in your publications');
      err.code = 'DUPLICATE';
      throw err;
    }

    // Create link
    const { data, error } = await supabase
      .from('user_papers')
      .insert({
        user_id: userId,
        paper_id: paperId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Unlink paper from user's publications
   */
  static async unlinkPaperFromUser(supabase, userId, publicationId) {
    // Verify publication exists and belongs to user
    const { data: beforeCheck } = await supabase
      .from('user_papers')
      .select('id, paper_id')
      .eq('id', publicationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!beforeCheck) {
      const err = new Error('Publication not found or does not belong to you');
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Delete the link
    const { data: deleted, error } = await supabase
      .from('user_papers')
      .delete()
      .eq('id', publicationId)
      .eq('user_id', userId)
      .select();

    if (error) throw error;

    if (!deleted || deleted.length === 0) {
      const err = new Error('Failed to delete publication');
      err.code = 'DELETE_FAILED';
      throw err;
    }

    return deleted[0];
  }

  /**
   * Get user's publications from PostgreSQL
   */
  static async getUserPapers(supabase, userId) {
    const { data: publications, error } = await supabase
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
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return publications || [];
  }
}

module.exports = PaperService;