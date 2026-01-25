import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    name: "User",
    profile_picture_url: null,
    email: null,
    affiliation: null,
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = useRef(false);

  // Function to fetch user data
  const fetchUserData = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return;
    }

    const token = localStorage.getItem('access_token');
    
    if (!token) {
      setIsLoggedIn(false);
      setIsLoading(false);
      setUserData({
        name: "User",
        profile_picture_url: null,
        email: null,
        affiliation: null,
      });
      localStorage.removeItem('user_data');
      return;
    }

    isFetchingRef.current = true;

    // Check if we have cached user data for instant display
    const cachedUserData = localStorage.getItem('user_data');
    if (cachedUserData) {
      try {
        const parsed = JSON.parse(cachedUserData);
        setUserData(parsed);
        setIsLoggedIn(true);
      } catch (e) {
        console.error('Error parsing cached user data:', e);
      }
    }

    // Fetch fresh data from API
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const user = {
          name: data.user?.name || "User",
          profile_picture_url: data.user?.profile_picture_url || null,
          email: data.user?.email || null,
          affiliation: data.user?.affiliation || null,
        };
        
        setUserData(user);
        setIsLoggedIn(true);
        
        // Cache the user data
        localStorage.setItem('user_data', JSON.stringify(user));
      } else if (response.status === 401) {
        // Token is invalid or expired
        console.error('Token invalid or expired');
        logout();
      } else {
        console.error('Failed to fetch user profile');
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Initial fetch when app loads
  useEffect(() => {
    fetchUserData();
  }, []);

  // Listen for storage events from other tabs (multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Only respond to access_token changes
      if (e.key === 'access_token') {
        if (e.newValue && !e.oldValue) {
          // User logged in from another tab
          fetchUserData();
        } else if (!e.newValue && e.oldValue) {
          // User logged out from another tab
          logout();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Function to refresh user data
  const refreshUserData = () => {
    fetchUserData();
  };

  // Function to logout
  const logout = () => {
    setUserData({
      name: "User",
      profile_picture_url: null,
      email: null,
      affiliation: null,
    });
    setIsLoggedIn(false);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  };

  return (
    <UserContext.Provider value={{ 
      userData, 
      isLoggedIn, 
      isLoading,
      refreshUserData,
      logout 
    }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};