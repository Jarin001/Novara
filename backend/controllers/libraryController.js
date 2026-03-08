const { errorHandler } = require('../utils/errorHandler');

/**
 * Create a new library
 */
exports.createLibrary = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { name, description, is_public = false } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Library name is required' });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { data: library, error: createError } = await supabase
      .from('libraries')
      .insert({
        created_by_user_id: userData.id,
        name: name.trim(),
        description: description?.trim() || null,
        is_public
      })
      .select()
      .single();

    if (createError) throw createError;

    const { error: linkError } = await supabase
      .from('user_libraries')
      .insert({
        user_id: userData.id,
        library_id: library.id,
        role: 'creator'
      });

    if (linkError) throw linkError;

    res.status(201).json({
      message: 'Library created successfully',
      library
    });
  } catch (err) {
    console.error('Error creating library:', err);
    errorHandler(res, err, 'Failed to create library');
  }
};

/**
 * Get user's libraries (both owned and shared)
 */
exports.getUserLibraries = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all libraries user has access to, including invited_by and joined_at
    const { data: userLibraries, error: librariesError } = await supabase
      .from('user_libraries')
      .select(`
        role,
        invited_by_user_id,
        created_at,
        libraries (
          id,
          name,
          description,
          is_public,
          paper_count,
          created_at,
          updated_at,
          created_by_user_id
        )
      `)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false });

    if (librariesError) throw librariesError;

    const ownedLibraryIds = userLibraries
      .filter(ul => ul.role === 'creator')
      .map(ul => ul.libraries.id);

    const sharedWithMeLibraryIds = userLibraries
      .filter(ul => ul.role === 'collaborator')
      .map(ul => ul.libraries.id);

    // Find owned libraries that have collaborators + get their details
    const sharedLibraryIds = new Set();
    const collaboratorsMap = {};

    if (ownedLibraryIds.length > 0) {
      const { data: collaborators, error: collabError } = await supabase
        .from('user_libraries')
        .select(`
          library_id,
          user_id,
          created_at,
          users!user_libraries_user_id_fkey (
            id,
            name
          )
        `)
        .in('library_id', ownedLibraryIds)
        .neq('user_id', userData.id)
        .eq('role', 'collaborator');

      if (collabError) throw collabError;

      collaborators?.forEach(c => {
        sharedLibraryIds.add(c.library_id);
        if (!collaboratorsMap[c.library_id]) collaboratorsMap[c.library_id] = [];
        collaboratorsMap[c.library_id].push({
          user_id: c.user_id,
          name: c.users?.name || null,
          joined_at: c.created_at
        });
      });
    }

    // Get all collaborators for shared_with_me libraries
    const sharedWithMeCollaboratorsMap = {};

    if (sharedWithMeLibraryIds.length > 0) {
      const { data: sharedCollaborators, error: sharedCollabError } = await supabase
        .from('user_libraries')
        .select(`
          library_id,
          user_id,
          role,
          users!user_libraries_user_id_fkey (
            id,
            name
          )
        `)
        .in('library_id', sharedWithMeLibraryIds);

      if (sharedCollabError) throw sharedCollabError;

      sharedCollaborators?.forEach(c => {
        if (!sharedWithMeCollaboratorsMap[c.library_id]) sharedWithMeCollaboratorsMap[c.library_id] = [];
        sharedWithMeCollaboratorsMap[c.library_id].push({
          user_id: c.user_id,
          name: c.users?.name || null,
          role: c.role
        });
      });
    }

    // Batch fetch names for creators and inviters
    const userIdsToFetch = new Set();
    userLibraries.forEach(ul => {
      if (ul.libraries.created_by_user_id) userIdsToFetch.add(ul.libraries.created_by_user_id);
      if (ul.invited_by_user_id) userIdsToFetch.add(ul.invited_by_user_id);
    });

    const userInfoMap = {};
    if (userIdsToFetch.size > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name')
        .in('id', Array.from(userIdsToFetch));

      usersData?.forEach(u => { userInfoMap[u.id] = u.name; });
    }

    // Separate into three buckets
    const myLibraries = [];
    const sharedWithOthers = [];
    const sharedWithMe = [];

    userLibraries.forEach(ul => {
      const lib = ul.libraries;

      if (ul.role === 'creator') {
        if (sharedLibraryIds.has(lib.id)) {
          // Shared with others: creator info + who it's shared with
          sharedWithOthers.push({
            id: lib.id,
            name: lib.name,
            description: lib.description,
            is_public: lib.is_public,
            paper_count: lib.paper_count,
            created_at: lib.created_at,
            updated_at: lib.updated_at,
            role: ul.role,
            is_owner: true,
            creator: {
              user_id: lib.created_by_user_id,
              name: userInfoMap[lib.created_by_user_id] || null
            },
            shared_with: collaboratorsMap[lib.id] || []
          });
        } else {
          // My libraries: name, description, created_at, updated_at only
          myLibraries.push({
            id: lib.id,
            name: lib.name,
            description: lib.description,
            created_at: lib.created_at,
            updated_at: lib.updated_at
          });
        }
      } else {
        // Shared with me: creator, invited_by, joined_at, all collaborators
        sharedWithMe.push({
          id: lib.id,
          name: lib.name,
          description: lib.description,
          is_public: lib.is_public,
          paper_count: lib.paper_count,
          created_at: lib.created_at,
          updated_at: lib.updated_at,
          role: ul.role,
          is_owner: false,
          creator: {
            user_id: lib.created_by_user_id,
            name: userInfoMap[lib.created_by_user_id] || null
          },
          invited_by: ul.invited_by_user_id ? {
            user_id: ul.invited_by_user_id,
            name: userInfoMap[ul.invited_by_user_id] || null
          } : null,
          joined_at: ul.created_at,
          collaborators: sharedWithMeCollaboratorsMap[lib.id] || []
        });
      }
    });

    res.json({
      my_libraries: myLibraries,
      shared_with_others: sharedWithOthers,
      shared_with_me: sharedWithMe
    });
  } catch (err) {
    console.error('Error fetching libraries:', err);
    errorHandler(res, err, 'Failed to fetch libraries');
  }
};

/**
 * Get a single library
 */
exports.getLibrary = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { library_id } = req.params;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { data: library, error: libraryError } = await supabase
      .from('libraries')
      .select('*')
      .eq('id', library_id)
      .single();

    if (libraryError || !library) {
      return res.status(404).json({ message: 'Library not found' });
    }

    const isCreator = library.created_by_user_id === userData.id;
    const isPublic = library.is_public;

    if (!isCreator && !isPublic) {
      const { data: collaborator } = await supabase
        .from('user_libraries')
        .select('role')
        .eq('library_id', library_id)
        .eq('user_id', userData.id)
        .single();

      if (!collaborator) {
        return res.status(403).json({ message: 'Access denied' });
      }

      library.role = collaborator.role;
    } else {
      library.role = isCreator ? 'creator' : null;
    }

    library.is_owner = isCreator;

    res.json({ library });
  } catch (err) {
    console.error('Error fetching library:', err);
    errorHandler(res, err, 'Failed to fetch library');
  }
};

/**
 * Update library (name, description, visibility)
 */
exports.updateLibrary = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { library_id } = req.params;
    const { name, description, is_public } = req.body;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { data: library, error: libraryError } = await supabase
      .from('libraries')
      .select('created_by_user_id')
      .eq('id', library_id)
      .single();

    if (libraryError || !library) {
      return res.status(404).json({ message: 'Library not found' });
    }

    const isCreator = library.created_by_user_id === userData.id;
    let hasAccess = isCreator;

    if (!isCreator) {
      const { data: collaborator } = await supabase
        .from('user_libraries')
        .select('id')
        .eq('library_id', library_id)
        .eq('user_id', userData.id)
        .single();

      hasAccess = !!collaborator;
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (is_public !== undefined) updates.is_public = is_public;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const { data: updatedLibrary, error: updateError } = await supabase
      .from('libraries')
      .update(updates)
      .eq('id', library_id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      message: 'Library updated successfully',
      library: updatedLibrary
    });
  } catch (err) {
    console.error('Error updating library:', err);
    errorHandler(res, err, 'Failed to update library');
  }
};

/**
 * Delete library (ONLY creator can do this)
 */
exports.deleteLibrary = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { library_id } = req.params;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { data: library, error: libraryError } = await supabase
      .from('libraries')
      .select('created_by_user_id')
      .eq('id', library_id)
      .single();

    if (libraryError || !library) {
      return res.status(404).json({ message: 'Library not found' });
    }

    if (library.created_by_user_id !== userData.id) {
      return res.status(403).json({
        message: 'Only the library owner can delete this library'
      });
    }

    const { error: deleteError } = await supabase
      .from('libraries')
      .delete()
      .eq('id', library_id);

    if (deleteError) throw deleteError;

    res.json({ message: 'Library deleted successfully' });
  } catch (err) {
    console.error('Error deleting library:', err);
    errorHandler(res, err, 'Failed to delete library');
  }
};

//-------------------------------------LIBRARY SHARE-------------------------------------

/**
 * Share library with another user (sends notification)
 */
exports.shareLibrary = async (req, res) => {
  try {
    const authId = req.user.id; // sender auth_id
    const supabaseClient = req.supabase;
    const { library_id } = req.params;
    const { recipient_id } = req.body; // user to share with

    if (!recipient_id) {
      return res.status(400).json({ message: "Recipient ID is required" });
    }

    // Get sender user ID
    const { data: sender } = await supabaseClient
      .from("users")
      .select("id, name, profile_picture_url")
      .eq("auth_id", authId)
      .single();

    if (!sender) return res.status(404).json({ message: "Sender not found" });

    // Optional: prevent sharing with yourself
    if (recipient_id === sender.id) {
      return res
        .status(400)
        .json({ message: "You already have access to this library." });
    }

    // Check if recipient already has access in user_libraries
    const { data: existingAccess } = await supabaseClient
      .from("user_libraries")
      .select("id")
      .eq("user_id", recipient_id)
      .eq("library_id", library_id)
      .single();

    if (existingAccess) {
      const { data: recipient } = await supabaseClient
        .from("users")
        .select("name")
        .eq("id", recipient_id)
        .single();
        
      return res
        .status(400)
        .json({ message: `Library is already shared with ${recipient?.name || 'this user'}` });
    }

    // Check for existing pending or declined notifications
    const { data: existingNotification } = await supabaseClient
      .from("notifications")
      .select("id, message")
      .eq("user_id", recipient_id)
      .eq("actor_id", sender.id)
      .eq("reference_id", library_id)
      .eq("type", "library_share")
      .maybeSingle();

    // If there's an existing notification
    if (existingNotification) {
      // Check if this was a declined invitation (by checking message content)
      if (existingNotification.message && existingNotification.message.includes('declined the invitation')) {
        // Delete the old declined notification so we can send a new one
        await supabaseClient
          .from("notifications")
          .delete()
          .eq("id", existingNotification.id);
          
        console.log('Deleted old declined notification, creating new one');
        // Continue to create new notification below
      } else {
        // It's a pending notification
        const { data: recipient } = await supabaseClient
          .from("users")
          .select("name")
          .eq("id", recipient_id)
          .single();
          
        return res.status(400).json({ 
          message: `An invitation is already pending for ${recipient?.name || 'this user'}` 
        });
      }
    }

    // Get library info
    const { data: library } = await supabaseClient
      .from("libraries")
      .select("id, name")
      .eq("id", library_id)
      .single();

    if (!library) return res.status(404).json({ message: "Library not found" });

    // Create notification for recipient
    const { error: notifError } = await supabaseClient
      .from("notifications")
      .insert({
        user_id: recipient_id, // recipient
        actor_id: sender.id, // sender
        reference_id: library.id, // library ID
        type: "library_share",
        message: `${sender.name} shared a library "${library.name}" with you.`,
      });

    if (notifError) throw notifError;

    res.status(200).json({ message: "Library shared and notification sent" });
  } catch (err) {
    console.error(err);
    errorHandler(res, err, "Failed to share library");
  }
};

/**
 * Accept shared library
 */
exports.acceptSharedLibrary = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabaseClient = req.supabase;
    const { library_id } = req.params;

    // Get recipient user ID
    const { data: recipient } = await supabaseClient
      .from("users")
      .select("id, name, profile_picture_url")
      .eq("auth_id", authId)
      .single();

    if (!recipient) return res.status(404).json({ message: "User not found" });

    // First, get the notification to find who shared it
    const { data: notification } = await supabaseClient
      .from("notifications")
      .select("id, actor_id")
      .eq("user_id", recipient.id)
      .eq("reference_id", library_id)
      .eq("type", "library_share")
      .single();

    if (!notification || !notification.actor_id) {
      return res.status(404).json({ message: "Library invitation not found" });
    }

    // Get library name
    const { data: library } = await supabaseClient
      .from("libraries")
      .select("name")
      .eq("id", library_id)
      .single();

    // Check if user already has access
    const { data: existingAccess } = await supabaseClient
      .from("user_libraries")
      .select("id")
      .eq("user_id", recipient.id)
      .eq("library_id", library_id)
      .single();

    if (existingAccess) {
      return res.status(400).json({ message: "You already have access to this library" });
    }

    // Add recipient to user_libraries as collaborator
    const { error: insertError } = await supabaseClient
      .from("user_libraries")
      .insert({
        user_id: recipient.id,
        library_id,
        role: "collaborator",
        invited_by_user_id: notification.actor_id,
      });

    if (insertError) throw insertError;

    // ALWAYS notify the sender that the invitation was accepted
    const { error: notifError } = await supabaseClient
      .from("notifications")
      .insert({
        user_id: notification.actor_id, // sender receives notification
        actor_id: recipient.id, // recipient performed the action
        reference_id: library_id,
        type: "library_accept",
        message: `${recipient.name} accepted your invitation to collaborate in "${library?.name || 'a library'}".`,
      });

    if (notifError) {
      console.error('Error creating acceptance notification:', notifError);
    }

    // Mark the original invitation notification as read
    await supabaseClient
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notification.id);

    res.status(200).json({ 
      message: "Library share accepted",
      library_id: library_id
    });
  } catch (err) {
    console.error(err);
    errorHandler(res, err, "Failed to accept shared library");
  }
};

/**
 * Decline shared library
 */
exports.declineSharedLibrary = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabaseClient = req.supabase;
    const { library_id } = req.params;

    // Get recipient user ID and name
    const { data: recipient } = await supabaseClient
      .from("users")
      .select("id, name")
      .eq("auth_id", authId)
      .single();

    if (!recipient) return res.status(404).json({ message: "User not found" });

    // Get the notification to find who shared it
    const { data: notification } = await supabaseClient
      .from("notifications")
      .select("id, actor_id")
      .eq("user_id", recipient.id)
      .eq("reference_id", library_id)
      .eq("type", "library_share")
      .single();

    // Get library name
    const { data: library } = await supabaseClient
      .from("libraries")
      .select("name")
      .eq("id", library_id)
      .single();

    // Send notification to inviter that invitation was declined
    if (notification && notification.actor_id) {
      const { error: notifError } = await supabaseClient
        .from("notifications")
        .insert({
          user_id: notification.actor_id, // sender receives notification
          actor_id: recipient.id, // recipient performed the action
          reference_id: library_id,
          type: "library_decline",
          message: `${recipient.name} declined your invitation to collaborate in "${library?.name || 'a library'}".`,
        });

      if (notifError) {
        console.error('Error creating decline notification:', notifError);
      }
    }

    // Update the original notification to mark it as declined
    if (notification && notification.id) {
      await supabaseClient
        .from("notifications")
        .update({ 
          is_read: true,
          message: `${recipient.name} declined the invitation to "${library?.name || 'a library'}".`
        })
        .eq("id", notification.id);
    }

    res.status(200).json({ message: "Library share declined" });
  } catch (err) {
    console.error(err);
    errorHandler(res, err, "Failed to decline shared library");
  }
};


/*leave library*/

exports.leaveLibrary = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;
    const { library_id } = req.params;

    // get current user
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // check role
    const { data: access } = await supabase
      .from("user_libraries")
      .select("role")
      .eq("user_id", userData.id)
      .eq("library_id", library_id)
      .single();

    if (!access) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (access.role === "creator") {
      return res.status(400).json({
        message: "Creator cannot leave their own library. Delete it instead."
      });
    }

    // remove collaborator
    const { error } = await supabase
      .from("user_libraries")
      .delete()
      .eq("user_id", userData.id)
      .eq("library_id", library_id);

    if (error) throw error;

    res.json({ message: "You left the library" });

  } catch (err) {
    console.error(err);
    errorHandler(res, err, "Failed to leave library");
  }
};


/*remove colaborators*/

exports.removeCollaborator = async (req, res) => {
  try {
    const authId = req.user.id;
    const supabase = req.supabase;

    const { library_id, user_id } = req.params;

    // get current user
    const { data: currentUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // check library owner
    const { data: library } = await supabase
      .from("libraries")
      .select("created_by_user_id")
      .eq("id", library_id)
      .single();

    if (!library) {
      return res.status(404).json({ message: "Library not found" });
    }

    if (library.created_by_user_id !== currentUser.id) {
      return res.status(403).json({
        message: "Only the creator can remove collaborators"
      });
    }

    // prevent removing creator
    if (user_id === currentUser.id) {
      return res.status(400).json({
        message: "Creator cannot remove themselves"
      });
    }

        // Get collaborator's name before deleting
    const { data: collaborator } = await supabase
      .from("users")
      .select("name")
      .eq("id", user_id)
      .single();

    if (!collaborator) {
      return res.status(404).json({ message: "Collaborator not found" });
    }

    // delete collaborator
    const { error } = await supabase
      .from("user_libraries")
      .delete()
      .eq("library_id", library_id)
      .eq("user_id", user_id);

    if (error) throw error;

    res.json({ message: `Collaborator "${collaborator.name}" removed successfully` });

  } catch (err) {
    console.error(err);
    errorHandler(res, err, "Failed to remove collaborator");
  }
};