// services/paperService.js

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Create headers with authentication
 */
const createHeaders = () => {
  return {
    'Authorization': `Bearer ${getAuthToken()}`
  };
};

/**
 * Handle API response
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Fetch user's publications
 * @returns {Promise<Array>} Array of publications
 */
export const getUserPublications = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/papers/publications`, {
      method: 'GET',
      headers: createHeaders()
    });
    
    const data = await handleResponse(response);
    
    // Transform publications to match UI format - NOW INCLUDING ALL FIELDS
    const transformedPublications = data.publications.map(pub => ({
      id: pub.id,  // Keep this as the user_papers.id for deletion
      paperId: pub.s2_paper_id,  // CRITICAL: Use s2_paper_id for routing to paper details
      s2_paper_id: pub.s2_paper_id,
      title: pub.title,
      authors: pub.authors && pub.authors.length > 0 ? pub.authors.join(', ') : 'Unknown Authors',
      abstract: pub.abstract || 'No abstract available',
      citations: pub.citation_count || 0,
      citationCount: pub.citation_count || 0,  // Add both for compatibility
      year: pub.year || (pub.published_date ? new Date(pub.published_date).getFullYear() : 'N/A'),
      
      // NEW: Include fields_of_study from backend
      fieldsOfStudy: pub.fields_of_study || [],
      
      // NEW: Include venue
      venue: pub.venue || null,
      
      // Keep other useful fields
      published_date: pub.published_date,
      paper_id: pub.paper_id
    }));
    
    console.log('📄 Sample transformed publication:', transformedPublications[0]);
    
    return transformedPublications;
  } catch (error) {
    console.error('Error fetching publications:', error);
    throw error;
  }
};

/**
 * Remove a publication from user's profile
 * @param {string} userPaperId - ID of the user_papers record
 * @returns {Promise<void>}
 */
export const removePublication = async (userPaperId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/papers/publications/${userPaperId}`, {
      method: 'DELETE',
      headers: createHeaders()
    });
    
    await handleResponse(response);
  } catch (error) {
    console.error('Error removing publication:', error);
    throw error;
  }
};

/**
 * Calculate most cited papers from publications list
 * @param {Array} publications - Array of publications
 * @param {number} count - Number of top papers to return
 * @returns {Array} Top cited papers
 */
export const getMostCitedPapers = (publications, count = 3) => {
  return [...publications]
    .sort((a, b) => b.citations - a.citations)
    .slice(0, count);
};