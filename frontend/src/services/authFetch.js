export const fetchWithTokenRefresh = async (url, options = {}) => {
  const accessToken = localStorage.getItem('access_token');
  
  if (!accessToken) {
    console.warn('No access token found, redirecting to login');
    window.location.href = '/login';
    throw new Error('No access token available');
  }

  // Add authorization header to the request
  const authenticatedOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': options.headers?.['Content-Type'] || 'application/json',
    },
  };

  // Try the request with current token
  let response = await fetch(url, authenticatedOptions);

  // If 401 Unauthorized, attempt token refresh
  if (response.status === 401) {
    console.log('🔄 Access token expired or invalid, attempting refresh...');
    
    const newAccessToken = await refreshAccessToken();
    
    if (!newAccessToken) {
      // Refresh failed, logout user
      console.error('❌ Token refresh failed, logging out...');
      clearAuthAndRedirect();
      throw new Error('Token refresh failed');
    }

    console.log('✅ Token refreshed successfully, retrying original request...');
    
    // Retry original request with new token
    authenticatedOptions.headers.Authorization = `Bearer ${newAccessToken}`;
    response = await fetch(url, authenticatedOptions);
  }

  return response;
};

/**
 * Refresh the access token using the refresh token
 * 
 * @returns {Promise<string|null>} - New access token, or null if refresh failed
 */
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    console.error('No refresh token available');
    return null;
  }

  try {
    const refreshResponse = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );

    if (!refreshResponse.ok) {
      console.error('Refresh token endpoint returned error:', refreshResponse.status);
      return null;
    }

    const refreshData = await refreshResponse.json();
    
    // Save new tokens to localStorage
    localStorage.setItem('access_token', refreshData.session.access_token);
    localStorage.setItem('refresh_token', refreshData.session.refresh_token);
    
    console.log('🔑 New tokens saved to localStorage');
    
    return refreshData.session.access_token;
  } catch (error) {
    console.error('Error during token refresh:', error);
    return null;
  }
};

/**
 * Clear all authentication data and redirect to login
 */
const clearAuthAndRedirect = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
  window.location.href = '/login';
};

/**
 * Check if user has valid authentication tokens
 * @returns {boolean}
 */
export const hasAuthTokens = () => {
  return !!(localStorage.getItem('access_token') && localStorage.getItem('refresh_token'));
};

/**
 * Manually trigger a token refresh
 * Useful for proactive refresh before token expires
 * @returns {Promise<boolean>} - true if refresh succeeded, false otherwise
 */
export const manuallyRefreshToken = async () => {
  const newToken = await refreshAccessToken();
  return !!newToken;
};

/**
 * Get the current access token
 * @returns {string|null}
 */
export const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Logout user by clearing tokens and redirecting
 */
export const logoutUser = () => {
  clearAuthAndRedirect();
};