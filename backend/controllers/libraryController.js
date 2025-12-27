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

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create library
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

    // Create user_libraries entry for creator
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

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all libraries user has access to
    const { data: userLibraries, error: librariesError } = await supabase
      .from('user_libraries')
      .select(`
        role,
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

    // Separate into owned and shared
    const myLibraries = [];
    const sharedLibraries = [];

    userLibraries.forEach(ul => {
      const library = {
        ...ul.libraries,
        role: ul.role,
        is_owner: ul.libraries.created_by_user_id === userData.id
      };

      if (ul.role === 'creator') {
        myLibraries.push(library);
      } else {
        sharedLibraries.push(library);
      }
    });

    res.json({
      my_libraries: myLibraries,
      shared_with_me: sharedLibraries
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

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get library
    const { data: library, error: libraryError } = await supabase
      .from('libraries')
      .select('*')
      .eq('id', library_id)
      .single();

    if (libraryError || !library) {
      return res.status(404).json({ message: 'Library not found' });
    }

    // Check access
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

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify access (both creator and collaborator can update)
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

    // Build update object
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (is_public !== undefined) updates.is_public = is_public;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Update library
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

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify user is the creator (ONLY creator can delete)
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

    // Delete library (CASCADE will handle related records)
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

