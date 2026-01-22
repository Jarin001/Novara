const { supabase } = require('../config/supabase');
const { errorHandler } = require('../utils/errorHandler');


// Get user profile
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

const updateUserProfile = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { name, affiliation, researchInterests } = req.body;  // ADD researchInterests

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

const uploadProfilePicture = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase; // ADD THIS LINE
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

module.exports = {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture
};