const { supabase } = require('../config/supabase');
const { errorHandler } = require('../utils/errorHandler');
const PaperContent = require('../models/PaperContent'); 


// Get user's own profile (full access)
const getUserProfile = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, profile_picture_url, affiliation, research_interests, created_at, updated_at')
      .eq('auth_id', authId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'User profile not found. Please complete registration.' 
        });
      }
      throw error;
    }

    res.status(200).json({
      user: data
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to fetch user profile');
  }
};

// Update user's own profile
const updateUserProfile = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { name, affiliation, researchInterests } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (affiliation !== undefined) updates.affiliation = affiliation;
    if (researchInterests !== undefined) updates.research_interests = researchInterests;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        error: 'No fields to update' 
      });
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('auth_id', authId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: 'Profile updated successfully',
      user: data
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to update profile');
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { imageBase64, fileName } = req.body;

    if (!imageBase64 || !fileName) {
      return res.status(400).json({ 
        error: 'Image data and filename are required' 
      });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 2 * 1024 * 1024) {
      return res.status(400).json({ 
        error: 'File size exceeds 2MB limit' 
      });
    }

    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${authId}-${Date.now()}.${fileExt}`;
    const filePath = `${authId}/${uniqueFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: `image/${fileExt}`,
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const { data: userData, error: updateError } = await supabase
      .from('users')
      .update({ profile_picture_url: urlData.publicUrl })
      .eq('auth_id', authId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profile_picture_url: urlData.publicUrl,
      user: userData
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to upload profile picture');
  }
};

// Remove profile picture
const removeProfilePicture = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;

    // Update user profile to remove profile picture URL
    const { data: userData, error: updateError } = await supabase
      .from('users')
      .update({ profile_picture_url: null })
      .eq('auth_id', authId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({
      message: 'Profile picture removed successfully',
      user: userData
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to remove profile picture');
  }
};


// Get public profile of any user with publications
 
const getPublicUserProfile = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Check if there's an auth token (frontend can optionally send it)
    let requestingAuthId = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        // Try to verify the token
        const { createClient } = require('@supabase/supabase-js');
        const supabaseClient = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_ANON_KEY
        );
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        if (user) {
          requestingAuthId = user.id;
        }
      } catch (error) {
        // Invalid token? No problem, just treat as unauthenticated
        console.log('Invalid auth token in public route, continuing as unauthenticated');
      }
    }
    
    // Use the imported supabase instance (always available)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, auth_id, name, profile_picture_url, affiliation, research_interests, created_at')
      .eq('id', user_id)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw userError;
    }

    // Fetch user's publications (without abstract - we'll get it from MongoDB)
    const { data: publications, error: pubError } = await supabase
      .from('user_papers')
      .select(`
        id,
        uploaded_at,
        publication_status,
        papers (
          id,
          s2_paper_id,
          title,
          published_date,
          citation_count,
          fields_of_study,
          venue
        )
      `)
      .eq('user_id', user_id)
      .order('uploaded_at', { ascending: false });

    if (pubError) throw pubError;

    // Get authors for each paper and fetch abstract from MongoDB
    const papersWithAuthors = await Promise.all(
      (publications || []).map(async (pub) => {
        // Fetch authors from Supabase
        const { data: authorData } = await supabase
          .from('author_papers')
          .select(`authors (name)`)
          .eq('paper_id', pub.papers.id);

        const authors = authorData?.map(a => a.authors.name) || [];

        // Fetch abstract from MongoDB using s2_paper_id
        let abstract = 'No abstract available';
        try {
          const paperContent = await PaperContent.findOne({ 
            s2PaperId: pub.papers.s2_paper_id 
          });
          if (paperContent && paperContent.abstract) {
            abstract = paperContent.abstract;
          }
        } catch (error) {
          console.error(`Error fetching abstract for paper ${pub.papers.s2_paper_id}:`, error);
        }

        return {
          id: pub.id,
          s2_paper_id: pub.papers.s2_paper_id,
          title: pub.papers.title,
          authors: authors,
          abstract: abstract,  // ✅ FROM MONGODB
          citation_count: pub.papers.citation_count || 0,
          year: pub.papers.published_date 
            ? new Date(pub.papers.published_date).getFullYear() 
            : 'N/A',
          published_date: pub.papers.published_date,
          fields_of_study: pub.papers.fields_of_study,
          venue: pub.papers.venue
        };
      })
    );

    // Calculate most cited papers (top 3)
    const mostCitedPapers = [...papersWithAuthors]
      .sort((a, b) => b.citation_count - a.citation_count)
      .slice(0, 3);

    // Build complete public profile response
    const publicProfile = {
      id: userData.id,
      name: userData.name,
      profile_picture_url: userData.profile_picture_url,
      affiliation: userData.affiliation,
      research_interests: userData.research_interests || [],
      created_at: userData.created_at,
      joinedDate: userData.created_at 
        ? new Date(userData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : '',
      isOwnProfile: false,
      
      // Publication data
      publications: papersWithAuthors,
      totalPapers: papersWithAuthors.length,
      mostCitedPapers: mostCitedPapers
    };

    // Check if viewing own profile (only if user sent a valid token)
    if (requestingAuthId && userData.auth_id === requestingAuthId) {
      publicProfile.isOwnProfile = true;
      return res.status(200).json({
        message: 'This is your own profile. Use /api/users/profile for full data including email and stats.',
        user: publicProfile,
        redirectTo: '/api/users/profile'
      });
    }

    res.status(200).json({
      user: publicProfile
    });

  } catch (error) {
    errorHandler(res, error, 'Failed to fetch public profile');
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  removeProfilePicture,
  getPublicUserProfile    
};