// /**
//  * Author Service - Handles all author-related operations
//  */
// class AuthorService {
//   /**
//    * Find or create an author by name
//    */
//   static async upsertAuthor(supabase, authorName) {
//     const trimmedName = authorName.trim();

//     // Check if author exists
//     let { data: existingAuthor } = await supabase
//       .from('authors')
//       .select('id')
//       .eq('name', trimmedName)
//       .maybeSingle();

//     if (existingAuthor) {
//       return existingAuthor.id;
//     }

//     // Create new author
//     const { data: newAuthor, error } = await supabase
//       .from('authors')
//       .insert({ name: trimmedName })
//       .select('id')
//       .single();

//     if (error) throw error;
//     return newAuthor.id;
//   }

//   /**
//    * Link author to paper
//    */
//   static async linkAuthorToPaper(supabase, authorId, paperId) {
//     // Check if link already exists
//     const { data: existingLink } = await supabase
//       .from('author_papers')
//       .select('id')
//       .eq('author_id', authorId)
//       .eq('paper_id', paperId)
//       .maybeSingle();

//     if (existingLink) {
//       return existingLink;
//     }

//     // Create link
//     const { data, error } = await supabase
//       .from('author_papers')
//       .insert({
//         author_id: authorId,
//         paper_id: paperId
//       })
//       .select()
//       .single();

//     if (error) throw error;
//     return data;
//   }

//   /**
//    * Save multiple authors for a paper
//    */
//   static async saveAuthors(supabase, paperId, authors) {
//     if (!authors || !Array.isArray(authors) || authors.length === 0) {
//       return;
//     }

//     for (const authorData of authors) {
//       try {
//         const authorName = typeof authorData === 'string' 
//           ? authorData 
//           : authorData.name;

//         if (!authorName || authorName.trim() === '') {
//           continue;
//         }

//         // Upsert author
//         const authorId = await this.upsertAuthor(supabase, authorName);

//         // Link to paper
//         await this.linkAuthorToPaper(supabase, authorId, paperId);

//       } catch (err) {
//         console.error('Error processing author:', authorData, err);
//         // Continue with other authors even if one fails
//       }
//     }
//   }

//   /**
//    * Get all authors for a paper
//    */
//   static async getAuthorsForPaper(supabase, paperId) {
//     const { data: authorData, error } = await supabase
//       .from('author_papers')
//       .select(`
//         authors (
//           id,
//           name,
//           affiliation
//         )
//       `)
//       .eq('paper_id', paperId);

//     if (error) throw error;

//     return authorData?.map(ap => ap.authors.name) || [];
//   }

//   /**
//    * Get all papers for an author
//    */
//   static async getPapersForAuthor(supabase, authorId) {
//     const { data, error } = await supabase
//       .from('author_papers')
//       .select(`
//         papers (
//           id,
//           s2_paper_id,
//           title,
//           year,
//           citation_count
//         )
//       `)
//       .eq('author_id', authorId);

//     if (error) throw error;

//     return data?.map(ap => ap.papers) || [];
//   }
// }

// module.exports = AuthorService;

/**
 * Author Service
 * Handles all author-related database operations
 */

/**
 * Upsert an author (insert or return existing)
 * @param {Object} supabase - Supabase client
 * @param {string} name - Author name
 * @param {string} affiliation - Author affiliation (optional)
 * @returns {Object} Author object with id
 */
async function upsertAuthor(supabase, name, affiliation = null) {
  // First, try to find existing author by name
  const { data: existing, error: findError } = await supabase
    .from('authors')
    .select('*')
    .eq('name', name)
    .maybeSingle();

  if (findError) throw findError;

  // If author exists, update affiliation if provided and different
  if (existing) {
    if (affiliation && existing.affiliation !== affiliation) {
      const { data: updated, error: updateError } = await supabase
        .from('authors')
        .update({ affiliation })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updated;
    }
    return existing;
  }

  // Create new author
  const { data: newAuthor, error: insertError } = await supabase
    .from('authors')
    .insert({ name, affiliation })
    .select()
    .single();

  if (insertError) throw insertError;
  return newAuthor;
}

/**
 * Link authors to a paper
 * @param {Object} supabase - Supabase client
 * @param {string} paperId - Paper UUID
 * @param {Array} authors - Array of {name, affiliation} objects
 */
async function linkAuthorsToaPaper(supabase, paperId, authors) {
  if (!authors || authors.length === 0) return;

  // Upsert all authors
  const authorIds = [];
  for (const author of authors) {
    const authorRecord = await upsertAuthor(supabase, author.name, author.affiliation);
    authorIds.push(authorRecord.id);
  }

  // Check which author-paper links already exist
  const { data: existingLinks } = await supabase
    .from('author_papers')
    .select('author_id')
    .eq('paper_id', paperId);

  const existingAuthorIds = new Set(existingLinks?.map(link => link.author_id) || []);

  // Create new links only for authors not already linked
  const newLinks = authorIds
    .filter(authorId => !existingAuthorIds.has(authorId))
    .map(authorId => ({
      author_id: authorId,
      paper_id: paperId
    }));

  if (newLinks.length > 0) {
    const { error: linkError } = await supabase
      .from('author_papers')
      .insert(newLinks);

    if (linkError) throw linkError;
  }
}

/**
 * Get all authors for a single paper
 * @param {Object} supabase - Supabase client
 * @param {string} paperId - Paper UUID
 * @returns {Array} Array of author objects
 */
async function getAuthorsForPaper(supabase, paperId) {
  const { data, error } = await supabase
    .from('author_papers')
    .select(`
      authors (
        id,
        name,
        affiliation
      )
    `)
    .eq('paper_id', paperId);

  if (error) throw error;

  return data?.map(item => item.authors) || [];
}

/**
 * Get authors for multiple papers (returns a map)
 * @param {Object} supabase - Supabase client
 * @param {Array} paperIds - Array of paper UUIDs
 * @returns {Object} Map of paperId -> array of authors
 */
async function getAuthorsForPapers(supabase, paperIds) {
  if (!paperIds || paperIds.length === 0) return {};

  const { data, error } = await supabase
    .from('author_papers')
    .select(`
      paper_id,
      authors (
        id,
        name,
        affiliation
      )
    `)
    .in('paper_id', paperIds);

  if (error) throw error;

  // Group authors by paper_id
  const authorsMap = {};
  data?.forEach(item => {
    if (!authorsMap[item.paper_id]) {
      authorsMap[item.paper_id] = [];
    }
    authorsMap[item.paper_id].push(item.authors);
  });

  return authorsMap;
}

/**
 * Get a paper with its authors
 * @param {Object} supabase - Supabase client
 * @param {string} paperId - Paper UUID
 * @returns {Object} Paper object with authors array
 */
async function getPaperWithAuthors(supabase, paperId) {
  // Get paper
  const { data: paper, error: paperError } = await supabase
    .from('papers')
    .select('*')
    .eq('id', paperId)
    .single();

  if (paperError) throw paperError;

  // Get authors
  const authors = await getAuthorsForPaper(supabase, paperId);

  return {
    ...paper,
    authors
  };
}

/**
 * Remove all author links for a paper
 * This should be called when a paper is completely deleted from the system
 * @param {Object} supabase - Supabase client
 * @param {string} paperId - Paper UUID
 */
async function removeAuthorLinksForPaper(supabase, paperId) {
  const { error } = await supabase
    .from('author_papers')
    .delete()
    .eq('paper_id', paperId);

  if (error) throw error;
}

/**
 * Clean up orphaned authors (authors with no papers)
 * This is an optional maintenance function
 * @param {Object} supabase - Supabase client
 */
async function cleanupOrphanedAuthors(supabase) {
  // Find authors with no paper links
  const { data: orphanedAuthors, error: findError } = await supabase
    .from('authors')
    .select(`
      id,
      author_papers (
        id
      )
    `);

  if (findError) throw findError;

  // Filter authors with no papers
  const orphanIds = orphanedAuthors
    ?.filter(author => !author.author_papers || author.author_papers.length === 0)
    .map(author => author.id) || [];

  if (orphanIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('authors')
      .delete()
      .in('id', orphanIds);

    if (deleteError) throw deleteError;
  }

  return orphanIds.length;
}

module.exports = {
  upsertAuthor,
  linkAuthorsToaPaper,
  getAuthorsForPaper,
  getAuthorsForPapers,
  getPaperWithAuthors,
  removeAuthorLinksForPaper,
  cleanupOrphanedAuthors
};