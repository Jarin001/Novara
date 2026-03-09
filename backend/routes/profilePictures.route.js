// routes/profilePictures.route.js
// POST /api/users/profile-pictures
// Body: { userIds: [uuid, uuid, ...] }
// Returns: [{ auth_id, profile_picture_url }]

const express = require('express');
const router  = express.Router();
const { supabase } = require('../config/supabase');

router.post('/profile-pictures', async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.json([]);
    }

    const { data, error } = await supabase
      .from('users')
      .select('auth_id, profile_picture_url')
      .in('auth_id', userIds);

    if (error) {
      console.error('[ProfilePictures] Supabase error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    console.error('[ProfilePictures] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;