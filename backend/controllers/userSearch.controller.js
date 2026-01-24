
const { supabase } = require('../config/supabase'); 
const { errorHandler } = require('../utils/errorHandler');

const searchAuthors = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters'
      });
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, name, affiliation, research_interests, profile_picture_url, created_at')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(20);

    if (error) throw error;

    res.status(200).json({
      authors: data
    });

  } catch (error) {
    errorHandler(res, error, 'Failed to search authors');
  }
};

module.exports = { searchAuthors };
