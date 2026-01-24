const { supabase } = require('../config/supabase');
const { errorHandler } = require('../utils/errorHandler');

/**
 * Author autocomplete
 * GET /api/author-autocomplete?query=xyz
 * Returns minimal author info for suggestions
 */
const authorAutocomplete = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Query must be at least 2 characters'
      });
    }

    // Fetch matching authors
    const { data, error } = await supabase
      .from('users')
      .select('id, name, profile_picture_url')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(10); 

    if (error) throw error;

    res.status(200).json({
      authors: data
    });

  } catch (error) {
    errorHandler(res, error, 'Failed to fetch author autocomplete');
  }
};

module.exports = {
  authorAutocomplete
};
