const { supabase } = require('../config/supabase');
const { errorHandler } = require('../utils/errorHandler');

// Get all notifications for current user
const getNotifications = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabaseClient = req.supabase;

    // Get current user's ID
    const { data: currentUser, error: currentUserError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (currentUserError) throw currentUserError;

    const { data: notifications, error } = await supabaseClient
      .from('notifications')
      .select(`
        id,
        type,
        message,
        is_read,
        created_at,
        reference_id,
        actor:users!notifications_actor_id_fkey (
          id,
          name,
          profile_picture_url
        )
      `)
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // For each notification with an actor, check if current user is following them
    const notificationsWithFollowStatus = await Promise.all(
      (notifications || []).map(async (notification) => {
        if (notification.actor && notification.actor.id) {
          // Check if current user follows this actor
          const { data: followData } = await supabaseClient
            .from('user_follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', notification.actor.id)
            .single();

          return {
            ...notification,
            isFollowing: !!followData  // Add isFollowing flag
          };
        }
        return notification;
      })
    );

    res.status(200).json({
      notifications: notificationsWithFollowStatus
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to fetch notifications');
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabaseClient = req.supabase;

    const { data: currentUser } = await supabaseClient
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    const { count, error } = await supabaseClient
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)
      .eq('is_read', false);

    if (error) throw error;

    res.status(200).json({
      unreadCount: count || 0
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to fetch unread count');
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const authId = req.user.id;
    const { notification_id } = req.params;
    const supabaseClient = req.supabase;

    const { data: currentUser } = await supabaseClient
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    const { error } = await supabaseClient
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification_id)
      .eq('user_id', currentUser.id);

    if (error) throw error;

    res.status(200).json({
      message: 'Notification marked as read'
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to mark notification as read');
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabaseClient = req.supabase;

    const { data: currentUser } = await supabaseClient
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    const { error } = await supabaseClient
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', currentUser.id)
      .eq('is_read', false);

    if (error) throw error;

    res.status(200).json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to mark all as read');
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const authId = req.user.id;
    const { notification_id } = req.params;
    const supabaseClient = req.supabase;

    const { data: currentUser } = await supabaseClient
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    const { error } = await supabaseClient
      .from('notifications')
      .delete()
      .eq('id', notification_id)
      .eq('user_id', currentUser.id);

    if (error) throw error;

    res.status(200).json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to delete notification');
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};