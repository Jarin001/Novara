/**
 * Library Access Service - Handles all library access and permission checks
 */
class LibraryAccessService {
  /**
   * Get user ID from auth ID
   */
  static async getUserId(supabase, authId) {
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (!userData) {
      const error = new Error('User not found');
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return userData.id;
  }

  /**
   * Verify user has access to library
   */
  static async verifyLibraryAccess(supabase, libraryId, userId) {
    const { data: library } = await supabase
      .from('libraries')
      .select('created_by_user_id')
      .eq('id', libraryId)
      .single();

    if (!library) {
      const error = new Error('Library not found');
      error.code = 'LIBRARY_NOT_FOUND';
      throw error;
    }

    // Check if user is owner
    if (library.created_by_user_id === userId) {
      return true;
    }

    // Check if user is collaborator
    const { data: collaborator } = await supabase
      .from('user_libraries')
      .select('id')
      .eq('library_id', libraryId)
      .eq('user_id', userId)
      .single();

    if (!collaborator) {
      const error = new Error('Access denied');
      error.code = 'ACCESS_DENIED';
      throw error;
    }

    return true;
  }

  /**
   * Get all libraries user has access to
   */
  static async getUserAccessibleLibraries(supabase, userId) {
    const { data: ownedLibraries } = await supabase
      .from('libraries')
      .select('id')
      .eq('created_by_user_id', userId);

    const { data: collaboratedLibraries } = await supabase
      .from('user_libraries')
      .select('library_id')
      .eq('user_id', userId);

    const libraryIds = [
      ...(ownedLibraries?.map(l => l.id) || []),
      ...(collaboratedLibraries?.map(l => l.library_id) || [])
    ];

    return libraryIds;
  }
}

module.exports = LibraryAccessService;