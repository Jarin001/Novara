const { supabase } = require('../config/supabase');
const { errorHandler } = require('../utils/errorHandler');

// Follow a user
const followUser = async (req, res) => {
  try {
    const authId = req.user.id;
    const { user_id: followingUserId } = req.params;
    const supabaseClient = req.supabase;

    // Get current user's ID
    const { data: currentUser, error: currentUserError } = await supabaseClient
      .from('users')
      .select('id, name')
      .eq('auth_id', authId)
      .single();

    if (currentUserError) throw currentUserError;

    // Prevent self-follow
    if (currentUser.id === followingUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    // Check if user exists
    const { data: targetUser, error: targetError } = await supabaseClient
      .from('users')
      .select('id, name, auth_id')
      .eq('id', followingUserId)
      .single();

    if (targetError || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const { data: existingFollow } = await supabaseClient
      .from('user_follows')
      .select('id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', followingUserId)
      .single();

    if (existingFollow) {
      return res.status(400).json({ error: 'You are already following this user' });
    }

    // Create follow relationship
    const { data: followData, error: followError } = await supabaseClient
      .from('user_follows')
      .insert({
        follower_id: currentUser.id,
        following_id: followingUserId
      })
      .select()
      .single();

    if (followError) throw followError;

    // Create notification for the followed user
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: followingUserId,
        type: 'follow',
        actor_id: currentUser.id,
        message: `${currentUser.name} has followed you`
      });

    if (notificationError) console.error('Notification error:', notificationError);

    // Check if this is a follow back
    const { data: isFollowBack } = await supabaseClient
      .from('user_follows')
      .select('id')
      .eq('follower_id', followingUserId)
      .eq('following_id', currentUser.id)
      .single();

    if (isFollowBack) {
      // Create follow back notification
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: currentUser.id,
          type: 'follow_back',
          actor_id: followingUserId,
          message: `${targetUser.name} followed you back`
        });
    }

    res.status(201).json({
      message: 'Successfully followed user',
      follow: followData
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to follow user');
  }
};

// Unfollow a user
const unfollowUser = async (req, res) => {
  try {
    const authId = req.user.id;
    const { user_id: followingUserId } = req.params;
    const supabaseClient = req.supabase;

    // Get current user's ID
    const { data: currentUser, error: currentUserError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (currentUserError) throw currentUserError;

    // Delete follow relationship
    const { error: deleteError } = await supabaseClient
      .from('user_follows')
      .delete()
      .eq('follower_id', currentUser.id)
      .eq('following_id', followingUserId);

    if (deleteError) throw deleteError;

    res.status(200).json({
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to unfollow user');
  }
};

// Get followers of a user
const getFollowers = async (req, res) => {
  try {
    const { user_id } = req.params;
    const supabaseClient = req.supabase;

    const { data: followers, error } = await supabaseClient
      .from('user_follows')
      .select(`
        follower_id,
        created_at,
        follower:users!user_follows_follower_id_fkey (
          id,
          name,
          profile_picture_url,
          affiliation,
          research_interests
        )
      `)
      .eq('following_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedFollowers = followers.map(f => ({
      ...f.follower,
      followed_at: f.created_at
    }));

    res.status(200).json({
      followers: formattedFollowers,
      total: formattedFollowers.length
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to fetch followers');
  }
};

// Get users that a user is following
const getFollowing = async (req, res) => {
  try {
    const { user_id } = req.params;
    const supabaseClient = req.supabase;

    const { data: following, error } = await supabaseClient
      .from('user_follows')
      .select(`
        following_id,
        created_at,
        following:users!user_follows_following_id_fkey (
          id,
          name,
          profile_picture_url,
          affiliation,
          research_interests
        )
      `)
      .eq('follower_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedFollowing = following.map(f => ({
      ...f.following,
      followed_at: f.created_at
    }));

    res.status(200).json({
      following: formattedFollowing,
      total: formattedFollowing.length
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to fetch following');
  }
};

// Get follow status between current user and target user
const getFollowStatus = async (req, res) => {
  try {
    const authId = req.user.id;
    const { user_id } = req.params;
    const supabaseClient = req.supabase;

    // Get current user's ID
    const { data: currentUser, error: currentUserError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (currentUserError) throw currentUserError;

    // Check if current user follows target user
    const { data: isFollowing } = await supabaseClient
      .from('user_follows')
      .select('id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', user_id)
      .single();

    // Check if target user follows current user
    const { data: isFollower } = await supabaseClient
      .from('user_follows')
      .select('id')
      .eq('follower_id', user_id)
      .eq('following_id', currentUser.id)
      .single();

    // Get follower count
    const { count: followerCount } = await supabaseClient
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user_id);

    // Get following count
    const { count: followingCount } = await supabaseClient
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user_id);

    res.status(200).json({
      isFollowing: !!isFollowing,
      isFollower: !!isFollower,
      followerCount: followerCount || 0,
      followingCount: followingCount || 0
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to fetch follow status');
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus
};