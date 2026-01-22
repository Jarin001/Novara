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
const createHeaders = (includeContentType = true) => {
  const headers = {
    'Authorization': `Bearer ${getAuthToken()}`
  };
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
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
 * Fetch user profile from backend
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    const data = await handleResponse(response);
    return data.user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {Object} updates - Profile updates { name, affiliation, researchInterests }
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserProfile = async (updates) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(updates)
    });
    
    const data = await handleResponse(response);
    return data.user;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Upload profile picture
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} Profile picture URL
 */
export const uploadProfilePicture = async (file) => {
  // Validate file
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('File size must be less than 2MB');
  }
  
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file');
  }
  
  try {
    // Convert file to base64
    const base64String = await fileToBase64(file);
    
    const response = await fetch(`${API_BASE_URL}/api/users/profile-picture`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        imageBase64: base64String,
        fileName: file.name
      })
    });
    
    const data = await handleResponse(response);
    return data.profile_picture_url;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

/**
 * Convert file to base64 string
 * @param {File} file - File to convert
 * @returns {Promise<string>} Base64 encoded string
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      resolve(reader.result);
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Verify authentication token
 * @returns {Promise<boolean>} True if token is valid
 */
export const verifyAuthToken = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return false;
  }
};

/**
 * Clear authentication
 */
export const clearAuth = () => {
  localStorage.removeItem('access_token');
};