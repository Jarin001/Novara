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