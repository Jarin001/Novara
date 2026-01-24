/**
 * Author Service - Handles all author-related operations
 */
class AuthorService {
  /**
   * Find or create an author by name
   */
  static async upsertAuthor(supabase, authorName) {
    const trimmedName = authorName.trim();

    // Check if author exists
    let { data: existingAuthor } = await supabase
      .from('authors')
      .select('id')
      .eq('name', trimmedName)
      .maybeSingle();

    if (existingAuthor) {
      return existingAuthor.id;
    }

    // Create new author
    const { data: newAuthor, error } = await supabase
      .from('authors')
      .insert({ name: trimmedName })
      .select('id')
      .single();

    if (error) throw error;
    return newAuthor.id;
  }

  /**
   * Link author to paper
   */
  static async linkAuthorToPaper(supabase, authorId, paperId) {
    // Check if link already exists
    const { data: existingLink } = await supabase
      .from('author_papers')
      .select('id')
      .eq('author_id', authorId)
      .eq('paper_id', paperId)
      .maybeSingle();

    if (existingLink) {
      return existingLink;
    }

    // Create link
    const { data, error } = await supabase
      .from('author_papers')
      .insert({
        author_id: authorId,
        paper_id: paperId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Save multiple authors for a paper
   */
  static async saveAuthors(supabase, paperId, authors) {
    if (!authors || !Array.isArray(authors) || authors.length === 0) {
      return;
    }

    for (const authorData of authors) {
      try {
        const authorName = typeof authorData === 'string' 
          ? authorData 
          : authorData.name;

        if (!authorName || authorName.trim() === '') {
          continue;
        }

        // Upsert author
        const authorId = await this.upsertAuthor(supabase, authorName);

        // Link to paper
        await this.linkAuthorToPaper(supabase, authorId, paperId);

      } catch (err) {
        console.error('Error processing author:', authorData, err);
        // Continue with other authors even if one fails
      }
    }
  }

  /**
   * Get all authors for a paper
   */
  static async getAuthorsForPaper(supabase, paperId) {
    const { data: authorData, error } = await supabase
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

    return authorData?.map(ap => ap.authors.name) || [];
  }

  /**
   * Get all papers for an author
   */
  static async getPapersForAuthor(supabase, authorId) {
    const { data, error } = await supabase
      .from('author_papers')
      .select(`
        papers (
          id,
          s2_paper_id,
          title,
          year,
          citation_count
        )
      `)
      .eq('author_id', authorId);

    if (error) throw error;

    return data?.map(ap => ap.papers) || [];
  }
}

module.exports = AuthorService;