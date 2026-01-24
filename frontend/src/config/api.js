// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const API_ENDPOINTS = {
  // Search endpoints
  PAPER_SEARCH: `${API_BASE_URL}/api/papers`,
  AUTOCOMPLETE: `${API_BASE_URL}/api/autocomplete`,
  
  // Paper details
  PAPER_DETAILS: `${API_BASE_URL}/api/papers`,
  CITATIONS: `${API_BASE_URL}/api/citations`,
  REFERENCES: `${API_BASE_URL}/api/papers`,
  RELATED_PAPERS: `${API_BASE_URL}/api/papers`,
  
  // Library endpoints
  LIBRARIES: `${API_BASE_URL}/api/libraries`,
  LIBRARY_PAPERS: `${API_BASE_URL}/api/user/papers`,
  
  // Auth endpoints
  AUTH: `${API_BASE_URL}/api/auth`,
};

export default API_ENDPOINTS;
