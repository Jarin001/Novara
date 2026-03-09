import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import './UserProfile.css';
import EditProfileModal from './EditProfileModal';
import UploadPaperModal from './UploadPaperModal';
import Navbar from "../components/Navbar";
import { useUser } from '../contexts/UserContext';

// Import services
import {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  removeProfilePicture,
  clearAuth
} from '../services/userService';
import {
  getUserPublications,
  removePublication,
  getMostCitedPapers
} from '../services/paperService';


import { FiCamera, FiEdit2 } from 'react-icons/fi';

// Import the bookmark and citation icons (for ResultsPage-style paper display)
import bookmarkIcon from "../images/bookmark.png";
import invertedCommasIcon from "../images/inverted-commas.png";

// Add this CSS for the abstract display
const additionalStyles = `
  .publication-journal {
    font-size: 14px;
    color: #5f6368;
    line-height: 1.6;
    max-height: 4.8em;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
`;

// Inject the styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = additionalStyles;
  document.head.appendChild(styleSheet);
}

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();

  // Get refreshUserData from context to update navbar
  const { refreshUserData } = useUser();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showProfilePictureMenu, setShowProfilePictureMenu] = useState(false);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Determine if viewing own profile
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Citation modal state (from ResultsPage)
  const [citeOpen, setCiteOpen] = useState(false);
  const [citeItem, setCiteItem] = useState(null);
  const [citationFormats, setCitationFormats] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('bibtex');
  const [copied, setCopied] = useState(false);
  const [citationLoading, setCitationLoading] = useState(false);
  const [citationError, setCitationError] = useState(null);

  // Follow functionality state
  const [followStatus, setFollowStatus] = useState({
    isFollowing: false,
    isFollower: false,
    followerCount: 0,
    followingCount: 0
  });
  const [followLoading, setFollowLoading] = useState(false);
  const [followMessage, setFollowMessage] = useState('');

  // Followers/Following modal state
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalType, setFollowersModalType] = useState('followers'); // 'followers' or 'following'
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loadingFollowList, setLoadingFollowList] = useState(false);

  // Save modal state (from ResultsPage)
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveItem, setSaveItem] = useState(null);
  const [selectedLibraries, setSelectedLibraries] = useState([]);
  const [userLibraries, setUserLibraries] = useState([]);
  const [librariesLoading, setLibrariesLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNewLibraryModal, setShowNewLibraryModal] = useState(false);
  const [newLibraryName, setNewLibraryName] = useState('');
  const [creatingLibrary, setCreatingLibrary] = useState(false);
  // Track which libraries the paper is already saved in
  const [paperInLibraries, setPaperInLibraries] = useState([]);
  const [checkingPaperInLibraries, setCheckingPaperInLibraries] = useState(false);
  // Cache for paper-in-library checks
  const paperInLibraryCache = useRef(new Map());

  // User data with CLEAN defaults
  const [userData, setUserData] = useState({
    name: "",
    id: "",
    institution: "",
    department: "",
    email: "",
    affiliation: "",
    researchInterests: [],
    joinedDate: "",
    totalPapers: 0,
    unread: 0,
    in_progress: 0,
    read: 0,
    mostCitedPapers: [],
    publications: [],
    profile_picture_url: null
  });

  // Add this function in UserProfile component (inside the component, before the return statement)
  const getSocialIcon = (url) => {
    if (url.includes('github')) {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#333">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025.8-.223 1.65-.334 2.5-.334.85 0 1.7.111 2.5.334 1.91-1.294 2.75-1.025 2.75-1.025.545 1.376.201 2.393.099 2.646.64.698 1.03 1.591 1.03 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
      );
    }
    if (url.includes('linkedin')) {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.771-.773 1.771-1.729V1.729C24 .774 23.204 0 22.225 0z" />
        </svg>
      );
    }
    if (url.includes('twitter') || url.includes('x.com')) {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#1DA1F2">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    }
    if (url.includes('scholar') || url.includes('semantic')) {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#4285F4">
          <path d="M12 2L2 7v2l10 5 10-5V7l-10-5zm0 4.2L5.5 7 12 9.8 18.5 7 12 6.2zM4 12v5l8 4 8-4v-5l-8 4-8-4z" />
        </svg>
      );
    }
    if (url.includes('orcid')) {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#A6CE39">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zM7.5 17.5H5V6.5h2.5v11zm9.25-6.25c0 1.381-1.119 2.5-2.5 2.5s-2.5-1.119-2.5-2.5v-2.5h-2.5v9h2.5v-2.5c.5.5 1.119 1 2.5 1 2.5 0 5-2.5 5-5v-5h-2.5v5zM10 5h2.5v2.5H10V5z" />
        </svg>
      );
    }
    if (url.includes('medium')) {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
          <path d="M2.846 6.887c.03-.295-.083-.586-.303-.784l-2.24-2.7v-.403h6.958l5.378 11.795 4.728-11.795h6.633v.403l-1.916 1.837c-.165.126-.247.333-.213.538v13.5c-.034.205.048.412.213.538l1.87 1.837v.403h-9.41v-.403l1.937-1.882c.19-.19.19-.247.19-.538v-10.91l-5.39 13.688h-.729l-6.275-13.688v9.174c-.052.385.076.774.347 1.052l2.52 3.058v.403h-7.148v-.403l2.52-3.058c.27-.278.39-.667.32-1.052v-10.61z" />
        </svg>
      );
    }
    // Default link icon
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#666">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  /**
   * Fetch user publications (for own profile)
   */
  const fetchPublications = async () => {
    try {
      const publications = await getUserPublications();
      const mostCited = getMostCitedPapers(publications, 3);

      // Debug: Log the first publication to see what fields are available
      if (publications.length > 0) {
        console.log('Sample publication data:', publications[0]);
        console.log('Available fields:', Object.keys(publications[0]));
      }

      setUserData(prev => ({
        ...prev,
        publications,
        totalPapers: publications.length,
        mostCitedPapers: mostCited
      }));
    } catch (error) {
      console.error('Failed to fetch publications:', error);
    }
  };

  /**
   * Fetch reading progress statistics
   */
  const fetchReadingProgress = async () => {
    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/user/papers`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch reading progress: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const papers = data.papers || [];

      // Count papers by reading status
      const statusCounts = papers.reduce((acc, paper) => {
        // Get all reading statuses for this paper across libraries
        const statuses = paper.reading_statuses || [];

        // If paper is in multiple libraries, prioritize the most advanced status
        // Priority: read > in_progress > unread
        let primaryStatus = 'unread';
        if (statuses.includes('read')) {
          primaryStatus = 'read';
        } else if (statuses.includes('in_progress')) {
          primaryStatus = 'in_progress';
        }

        acc[primaryStatus] = (acc[primaryStatus] || 0) + 1;
        return acc;
      }, {});

      setUserData(prev => ({
        ...prev,
        unread: statusCounts.unread || 0,
        in_progress: statusCounts.in_progress || 0,
        read: statusCounts.read || 0
      }));
    } catch (error) {
      console.error('Failed to fetch reading progress:', error);
    }
  };

  /**
   * Fetch follow status for viewing other users' profiles
   */
  const fetchFollowStatus = async (targetUserId) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/users/${targetUserId}/follow-status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch follow status');
      }

      const data = await response.json();
      setFollowStatus(data);
    } catch (error) {
      console.error('Error fetching follow status:', error);
    }
  };

  /**
   * Handle follow/unfollow action
   */
  const handleFollowToggle = async () => {
    if (!userId || followLoading) return;

    setFollowLoading(true);
    setFollowMessage('');

    try {
      const token = localStorage.getItem('access_token');
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/users/${userId}/${followStatus.isFollowing ? 'unfollow' : 'follow'}`;
      const method = followStatus.isFollowing ? 'DELETE' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update follow status');
      }

      // Update local state
      setFollowStatus(prev => ({
        ...prev,
        isFollowing: !prev.isFollowing,
        followerCount: prev.isFollowing ? prev.followerCount - 1 : prev.followerCount + 1
      }));

      //setFollowMessage(followStatus.isFollowing ? 'Unfollowed successfully' : 'Following!');
      setTimeout(() => setFollowMessage(''), 3000);

    } catch (error) {
      console.error('Error toggling follow:', error);
      setFollowMessage(error.message || 'Failed to update follow status');
      setTimeout(() => setFollowMessage(''), 3000);
    } finally {
      setFollowLoading(false);
    }
  };

  /**
   * Fetch followers list
   */
  const fetchFollowersList = async (targetUserId) => {
    setLoadingFollowList(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/users/${targetUserId}/followers`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch followers');
      }

      const data = await response.json();
      setFollowersList(data.followers || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
      setFollowersList([]);
    } finally {
      setLoadingFollowList(false);
    }
  };

  /**
   * Fetch following list
   */
  const fetchFollowingList = async (targetUserId) => {
    setLoadingFollowList(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/users/${targetUserId}/following`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch following');
      }

      const data = await response.json();
      setFollowingList(data.following || []);
    } catch (error) {
      console.error('Error fetching following:', error);
      setFollowingList([]);
    } finally {
      setLoadingFollowList(false);
    }
  };

  /**
   * Open followers/following modal
   */
  const openFollowersModal = async (type) => {
    const targetUserId = userId || userData.id;
    if (!targetUserId) return;

    setFollowersModalType(type);
    setShowFollowersModal(true);

    if (type === 'followers') {
      await fetchFollowersList(targetUserId);
    } else {
      await fetchFollowingList(targetUserId);
    }
  };

  /**
   * Fetch public user profile (for viewing others)
   * Optionally sends auth token if user is logged in (backend uses it to detect own profile)
   */
  const fetchPublicProfile = async (targetUserId) => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = {};

      // Include auth token if available (backend will use it to detect if viewing own profile)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('fetchPublicProfile: Fetching from:', `${process.env.REACT_APP_BACKEND_URL}/api/users/profile/${targetUserId}`);
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/users/profile/${targetUserId}`,
        { headers }
      );

      console.log('fetchPublicProfile: Response status:', response.status);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error('Failed to fetch public profile');
      }

      const data = await response.json();
      console.log('fetchPublicProfile: Response data:', data);
      return data;  // Return full response (includes message, redirectTo if own profile)
    } catch (error) {
      console.error('Error fetching public profile:', error);
      throw error;
    }
  };

  /**
   * Initialize profile based on route
   */
  useEffect(() => {
    const initializeProfile = async () => {
      try {
        console.log('UserProfile: Initializing with userId:', userId);
        setLoading(true);
        setError(null);

        if (userId) {
          // VIEWING A PROFILE BY ID - Backend will tell us if it's our own
          console.log('UserProfile: Fetching public profile for userId:', userId);
          const profileResponse = await fetchPublicProfile(userId);
          console.log('UserProfile: Received profile response:', profileResponse);
          const publicProfile = profileResponse.user;

          // Trust the backend's isOwnProfile flag
          const isOwn = publicProfile.isOwnProfile || false;
          setIsOwnProfile(isOwn);

          if (isOwn) {
            // This is our own profile - we have publications but might want email
            setIsAuthenticated(true);
            setUserData(prev => ({
              ...prev,
              name: publicProfile.name || "",
              affiliation: publicProfile.affiliation || "",
              institution: publicProfile.affiliation || "",
              researchInterests: publicProfile.research_interests || [],
              socialLinks: publicProfile.socialLinks || [],
              joinedDate: publicProfile.joinedDate || "",
              profile_picture_url: publicProfile.profile_picture_url || null,
              publications: publicProfile.publications || [],
              totalPapers: publicProfile.totalPapers || 0,
              mostCitedPapers: publicProfile.mostCitedPapers || [],
            }));

            // Fetch additional own-profile data (email, reading stats)
            try {
              const fullProfile = await getUserProfile();
              setUserData(prev => ({
                ...prev,
                id: fullProfile.id || "",
                email: fullProfile.email || ""
              }));
              await fetchReadingProgress();

              // Fetch follow stats for own profile
              if (userId) {
                await fetchFollowStatus(userId);
              }
            } catch (error) {
              console.error('Could not fetch full profile data:', error);
            }
          } else {
            // Viewing someone else's profile
            setIsOwnProfile(false);
            setIsAuthenticated(false);

            setUserData(prev => ({
              ...prev,
              name: publicProfile.name || "",
              affiliation: publicProfile.affiliation || "",
              institution: publicProfile.affiliation || "",
              researchInterests: publicProfile.research_interests || [],
              socialLinks: publicProfile.socialLinks || [],
              joinedDate: publicProfile.joinedDate || "",
              profile_picture_url: publicProfile.profile_picture_url || null,
              publications: publicProfile.publications || [],
              totalPapers: publicProfile.totalPapers || 0,
              mostCitedPapers: publicProfile.mostCitedPapers || [],
            }));

            // Fetch follow status if user is logged in
            const token = localStorage.getItem('access_token');
            if (token) {
              await fetchFollowStatus(userId);
            }
          }

        } else {
          // VIEWING OWN PROFILE via /profile route (Auth required)
          const token = localStorage.getItem('access_token');

          if (!token) {
            navigate('/login');
            return;
          }

          setIsOwnProfile(true);
          setIsAuthenticated(true);

          const profile = await getUserProfile();

          setUserData(prev => ({
            ...prev,
            name: profile.name || "",
            id: profile.id || "",
            email: profile.email || "",
            affiliation: profile.affiliation || "",
            institution: profile.affiliation || "",
            researchInterests: profile.research_interests || [],
            socialLinks: profile.socialLinks || [],
            joinedDate: profile.created_at
              ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : "",
            profile_picture_url: profile.profile_picture_url || null
          }));

          await fetchPublications();
          await fetchReadingProgress();

          // Fetch follow stats for own profile too
          if (profile.id) {
            await fetchFollowStatus(profile.id);
          }
        }

      } catch (error) {
        console.error("UserProfile: Failed to initialize profile:", error);
        setError(error.message);

        // Only redirect to login for own profile authentication errors
        if (!userId && (error.message.includes('401') || error.message.includes('403'))) {
          clearAuth();
          navigate('/login');
        }
      } finally {
        console.log('UserProfile: Setting loading to false');
        setLoading(false);
      }
    };

    initializeProfile();
  }, [navigate, userId]);

  /**
   * Fetch user libraries on mount (like PaperDetails)
   */
  useEffect(() => {
    const fetchUserLibraries = async () => {
      if (!isOwnProfile) {
        console.log('Skipping library fetch - not own profile');
        return; // Only fetch for own profile
      }

      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('Skipping library fetch - no token');
        setIsAuthenticated(false);
        setUserLibraries([]);
        return;
      }

      console.log('Fetching user libraries...');
      setLibrariesLoading(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/libraries`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(' User libraries fetched on mount:', data);

          // Handle both response formats - same as PaperDetails
          let libraries = [];
          if (data.my_libraries && Array.isArray(data.my_libraries)) {
            libraries = data.my_libraries.map(lib => ({
              id: lib.id,
              name: lib.name,
              role: lib.role,
              paper_count: lib.paper_count
            }));
          }
          if (data.shared_with_me && Array.isArray(data.shared_with_me)) {
            libraries = [...libraries, ...data.shared_with_me.map(lib => ({
              id: lib.id,
              name: lib.name,
              role: lib.role,
              paper_count: lib.paper_count
            }))];
          }
          // Fallback for old format
          if (libraries.length === 0 && data.libraries && Array.isArray(data.libraries)) {
            libraries = data.libraries;
          }

          console.log('Libraries loaded on mount:', libraries.length, libraries);
          setUserLibraries(libraries);
        } else if (response.status === 401) {
          console.log('Unauthorized - clearing auth');
          setIsAuthenticated(false);
          setUserLibraries([]);
        } else {
          console.error('Failed to fetch libraries:', response.status);
          setUserLibraries([]);
        }
      } catch (error) {
        console.error(' Error fetching libraries:', error);
        setUserLibraries([]);
      } finally {
        setLibrariesLoading(false);
        console.log('Library fetch complete');
      }
    };

    // Only run if we're viewing own profile
    if (isOwnProfile) {
      fetchUserLibraries();
    }
  }, [isOwnProfile]);

  /**
   * Close dropdown menu when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfilePictureMenu && !event.target.closest('.profile-picture-container')) {
        setShowProfilePictureMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfilePictureMenu]);

  const handleSaveProfile = async (updatedData) => {
    if (!isOwnProfile) return;

    try {
      setUpdateLoading(true);

      await updateUserProfile(updatedData);

      setUserData(prev => ({
        ...prev,
        name: updatedData.name,
        affiliation: updatedData.affiliation,
        researchInterests: updatedData.researchInterests,
        socialLinks: updatedData.socialLinks, // ADD THIS LINE
        institution: updatedData.affiliation
      }));

      alert('Profile updated successfully!');

    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error.message}`);
      throw error;
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleProfilePictureChange = async (event) => {
    if (!isOwnProfile) return;

    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingPicture(true);
      setShowProfilePictureMenu(false);

      const profilePictureUrl = await uploadProfilePicture(file);

      setUserData(prev => ({
        ...prev,
        profile_picture_url: profilePictureUrl
      }));

      // Refresh navbar to show new profile picture
      refreshUserData();

      alert('Profile picture updated successfully!');

    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert(`Failed to upload profile picture: ${error.message}`);
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!isOwnProfile) return;

    const confirmed = window.confirm('Are you sure you want to remove your profile picture?');
    if (!confirmed) return;

    try {
      setUploadingPicture(true);
      setShowProfilePictureMenu(false);

      await removeProfilePicture();

      setUserData(prev => ({
        ...prev,
        profile_picture_url: null
      }));

      // Refresh navbar to remove profile picture
      refreshUserData();

      alert('Profile picture removed successfully!');

    } catch (error) {
      console.error('Error removing profile picture:', error);
      alert(`Failed to remove profile picture: ${error.message}`);
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleConfirmPaper = async (paperDetails) => {
    if (!isOwnProfile) return;

    try {
      await fetchPublications();
      alert('Paper added to your publications successfully!');
    } catch (error) {
      console.error('Error refreshing publications:', error);
      alert('Paper may have been added, but failed to refresh the list. Please reload the page.');
    }
  };

  const handleRemovePaper = async (userPaperId) => {
    if (!isOwnProfile) return;
    if (!window.confirm('Are you sure you want to remove this paper?')) return;

    try {
      await removePublication(userPaperId);

      setUserData(prev => {
        const updatedPublications = prev.publications.filter(pub => pub.id !== userPaperId);
        const updatedMostCited = getMostCitedPapers(updatedPublications, 3);

        return {
          ...prev,
          publications: updatedPublications,
          totalPapers: updatedPublications.length,
          mostCitedPapers: updatedMostCited
        };
      });

      alert('Paper removed successfully!');
    } catch (error) {
      await fetchPublications();
      alert(`Failed to remove: ${error.message}`);
    }
  };

  // CITATION MODAL FUNCTIONS (from PaperDetails) 
  const openCite = async (paper) => {
    if (!paper || (!paper.paperId && !paper.s2_paper_id && !paper.id)) return;

    const paperIdToUse = paper.paperId || paper.s2_paper_id || paper.id;

    setCiteItem(paper);
    setCiteOpen(true);
    setCitationLoading(true);
    setCitationFormats([]);
    setSelectedFormat('bibtex');
    setCopied(false);

    try {
      console.log(`Fetching citations for paper: ${paperIdToUse}`);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/citations/${paperIdToUse}`);

      if (response.ok) {
        const data = await response.json();
        console.log("Citations fetched:", data);
        setCitationFormats(data.data || []);

        // Set default format to first available or bibtex
        if (data.data && data.data.length > 0) {
          setSelectedFormat(data.data[0].id || 'bibtex');
        } else {
          setSelectedFormat('bibtex');
        }
      } else {
        console.error("Failed to fetch citations");
        setCitationFormats([]);
        setSelectedFormat('bibtex');
      }
    } catch (error) {
      console.error("Citation fetch error:", error);
      setCitationFormats([]);
      setSelectedFormat('bibtex');
    } finally {
      setCitationLoading(false);
    }
  };

  const closeCite = () => {
    setCiteOpen(false);
    setCiteItem(null);
    setCitationFormats([]);
    setCopied(false);
  };

  const copyCitation = async () => {
    let txt = '';

    // Try to get citation from backend format
    if (citationFormats && citationFormats.length > 0) {
      const selectedFormatObj = citationFormats.find(f => f.id === selectedFormat);
      if (selectedFormatObj) {
        // For BibTeX, use plain text. For HTML formats, extract text content
        if (selectedFormatObj.id === 'bibtex') {
          txt = selectedFormatObj.value || '';
        } else {
          // Create a temporary div to extract text from HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = selectedFormatObj.value || '';
          txt = tempDiv.textContent || tempDiv.innerText || '';
        }
      }
    }

    // Fallback if not available
    if (!txt && citeItem) {
      const authors = citeItem.authors || 'Unknown Authors';
      const title = citeItem.title || 'Untitled';
      const year = citeItem.year || 'n.d.';

      if (selectedFormat === 'bibtex') {
        const safeTitle = (citeItem.title || 'Untitled').replace(/[{}]/g, '');
        txt = `@article{${citeItem.paperId || citeItem.id || 'unknown'},
  author = {${authors}},
  title = {${safeTitle}},
  year = {${year}}
}`;
      }
    }

    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      const el = document.getElementById(selectedFormat === 'bibtex' ? 'cite-textarea' : 'cite-html');
      if (el) {
        // For textarea, use select(). For div, create range
        if (selectedFormat === 'bibtex') {
          el.select();
        } else {
          const range = document.createRange();
          range.selectNodeContents(el);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch (_) { }
      }
    }
  };

  const downloadCitation = () => {
    let content = '';

    // Try to get BibTeX from backend format
    if (citationFormats && citationFormats.length > 0) {
      const bibTexFormat = citationFormats.find(f => f.id === 'bibtex');
      if (bibTexFormat) {
        content = bibTexFormat.value || '';
      }
    }

    // Fallback if not available
    if (!content && citeItem) {
      const authors = citeItem.authors || 'Unknown Authors';
      const title = citeItem.title || 'Untitled';
      const year = citeItem.year || 'n.d.';
      const safeTitle = (citeItem.title || 'Untitled').replace(/[{}]/g, '');
      content = `@article{${citeItem.paperId || citeItem.id || 'unknown'},
  author = {${authors}},
  title = {${safeTitle}},
  year = {${year}}
}`;
    }

    const sanitizeFilename = (s = '') => s.replace(/[^a-z0-9\.\-\_]/gi, '-').slice(0, 120);
    const name = sanitizeFilename((citeItem && citeItem.title) || 'paper') + '.bib';

    const blob = new Blob([content], { type: 'application/x-bibtex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // SAVE MODAL FUNCTIONS (matching ResultsPage)

  const availableLibraries = isAuthenticated && userLibraries.length > 0
    ? userLibraries
    : [];

  // Check if paper is already saved in libraries (matching ResultsPage)
  const checkIfPaperInLibraries = async (s2PaperId) => {
    if (!s2PaperId) return { libraries: [], internalPaperId: null };

    const cacheKey = `${s2PaperId}_${userLibraries.length}`;
    if (paperInLibraryCache.current.has(cacheKey)) {
      console.log('Using cached paper-in-library result');
      return paperInLibraryCache.current.get(cacheKey);
    }

    try {
      setCheckingPaperInLibraries(true);
      const token = localStorage.getItem('access_token');

      console.log('Checking if paper is in libraries for s2PaperId:', s2PaperId);

      // Try getAllUserPapers endpoint
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user/papers`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const papers = data.papers || [];
          const foundPaper = papers.find(p => p.s2_paper_id === s2PaperId);

          if (foundPaper && foundPaper.library_ids && foundPaper.library_ids.length > 0) {
            const foundLibraries = availableLibraries.filter(lib =>
              foundPaper.library_ids.includes(lib.id)
            );
            console.log('Paper is in libraries (from getAllUserPapers):', foundLibraries);
            const result = {
              libraries: foundLibraries,
              internalPaperId: foundPaper.paper_id || foundPaper.id
            };
            paperInLibraryCache.current.set(cacheKey, result);
            return result;
          }
        }
      } catch (endpointError) {
        console.log('getAllUserPapers endpoint not available, using library-by-library check');
      }

      // Fallback: check each library individually
      let internalPaperId = null;

      const libraryChecks = availableLibraries.map(async (library) => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/libraries/${library.id}/papers`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            const papers = data.papers || [];
            const foundPaper = papers.find(p => p.s2_paper_id === s2PaperId);
            if (foundPaper) {
              if (!internalPaperId) internalPaperId = foundPaper.id;
              return library;
            }
          }
          return null;
        } catch (error) {
          console.error(`Error checking library ${library.name}:`, error);
          return null;
        }
      });

      const results = await Promise.all(libraryChecks);
      const foundLibraries = results.filter(lib => lib !== null);
      console.log('Paper found in libraries (fallback):', foundLibraries);
      const result = { libraries: foundLibraries, internalPaperId };
      paperInLibraryCache.current.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error checking if paper is in libraries:', error);
      return { libraries: [], internalPaperId: null };
    } finally {
      setCheckingPaperInLibraries(false);
    }
  };

  const openSave = async (paper) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Please log in to save papers to libraries');
      navigate('/login');
      return;
    }

    const saveItemWithPdf = {
      ...paper,
      pdf_url: paper.pdf_url || paper.pdfUrl || paper.openAccessPdf?.url || ''
    };
    setSaveItem(saveItemWithPdf);
    setSelectedLibraries([]);
    setPaperInLibraries([]);
    setSaveOpen(true);

    const paperId = paper.paperId || paper.s2_paper_id || paper.id;
    if (paperId) {
      console.log('Opening save modal for paper:', paper.title);
      setCheckingPaperInLibraries(true);

      const result = await checkIfPaperInLibraries(paperId);
      console.log('Paper check result:', result);
      setPaperInLibraries(result.libraries);

      const enhancedSaveItem = { ...saveItemWithPdf, internalPaperId: result.internalPaperId };
      setSaveItem(enhancedSaveItem);

      const alreadySavedLibraries = availableLibraries.filter(lib =>
        result.libraries.some(savedLib => savedLib.id === lib.id)
      );
      console.log('Pre-selecting libraries:', alreadySavedLibraries);
      setSelectedLibraries(alreadySavedLibraries);

      setCheckingPaperInLibraries(false);
    }
  };

  const closeSave = () => {
    setSaveOpen(false);
    setSaveItem(null);
    setSelectedLibraries([]);
    setPaperInLibraries([]);
    setCheckingPaperInLibraries(false);
    setShowNewLibraryModal(false);
    setNewLibraryName('');
  };

  const toggleLibrarySelection = (library) => {
    setSelectedLibraries(prev => {
      const libraryId = library.id;
      const isSelected = prev.some(l => l.id === libraryId);
      if (isSelected) {
        return prev.filter(l => l.id !== libraryId);
      } else {
        return [...prev, library];
      }
    });
  };

  const handleCreateLibrary = async () => {
    if (!newLibraryName.trim()) {
      alert('Please enter a library name');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    setCreatingLibrary(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/libraries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newLibraryName.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        const newLibObj = { id: data.library.id, name: data.library.name, role: 'creator' };
        setUserLibraries(prev => [...prev, newLibObj]);
        setSelectedLibraries(prev => [...prev, newLibObj]);
        setNewLibraryName('');
        setShowNewLibraryModal(false);
        paperInLibraryCache.current.clear();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create library');
      }
    } catch (error) {
      console.error('Error creating library:', error);
      alert('Failed to create library');
    } finally {
      setCreatingLibrary(false);
    }
  };

  const fetchPaperBibtex = async (paperId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/citations/${paperId}`);
      if (response.ok) {
        const data = await response.json();
        const bibtexFormat = data.data?.find(f => f.id === 'bibtex');
        if (bibtexFormat && bibtexFormat.value) {
          return bibtexFormat.value;
        }
      }
    } catch (error) {
      console.warn("Could not fetch BibTeX:", error);
    }
    return '';
  };

  // Full add+remove logic matching ResultsPage's handleSaveToLibraries
  const handleSavePaper = async () => {
    if (selectedLibraries.length === 0 && paperInLibraries.length === 0) {
      alert('Please select at least one library to save the paper to');
      return;
    }

    if (selectedLibraries.length === 0 && paperInLibraries.length > 0) {
      const confirmRemove = window.confirm(
        'You have deselected all libraries. This will remove the paper from all ' +
        paperInLibraries.length + ' libraries it was saved in. Continue?'
      );
      if (!confirmRemove) return;
    }

    if (!saveItem) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Please log in to save papers');
      navigate('/login');
      return;
    }

    const s2PaperId = saveItem.paperId || saveItem.s2_paper_id || saveItem.id;
    if (!s2PaperId) {
      alert('Cannot save paper: missing paper ID');
      return;
    }

    const internalPaperId = saveItem.internalPaperId;
    const bibtex = await fetchPaperBibtex(s2PaperId);

    const paperData = {
      s2_paper_id: s2PaperId,
      title: saveItem.title || 'Untitled',
      venue: Array.isArray(saveItem.venue) ? saveItem.venue[0] : saveItem.venue || '',
      published_year: saveItem.year || new Date().getFullYear(),
      citation_count: saveItem.citationCount || saveItem.citations || saveItem.citation_count || 0,
      fields_of_study: saveItem.fieldsOfStudy || saveItem.fields_of_study || [],
      abstract: (() => {
        if (typeof saveItem.abstract === 'string') return saveItem.abstract;
        if (Array.isArray(saveItem.abstract)) return saveItem.abstract[0] || '';
        return '';
      })(),
      bibtex: bibtex || '',
      authors: (() => {
        if (Array.isArray(saveItem.authors)) {
          return saveItem.authors.map(a => ({
            name: typeof a === 'object' ? (a.name || '') : a,
            affiliation: typeof a === 'object' ? (a.affiliation || '') : ''
          }));
        } else if (typeof saveItem.authors === 'string') {
          return saveItem.authors.split(',').map(name => ({ name: name.trim(), affiliation: '' }));
        }
        return [];
      })(),
      reading_status: 'unread',
      user_note: '',
      pdf_url: saveItem.pdf_url || saveItem.pdfUrl || saveItem.openAccessPdf?.url || ''
    };

    const librariesToAdd = selectedLibraries.filter(lib =>
      !paperInLibraries.some(savedLib => savedLib.id === lib.id)
    );
    const librariesToRemove = paperInLibraries.filter(savedLib =>
      !selectedLibraries.some(lib => lib.id === savedLib.id)
    );

    console.log('Libraries to add to:', librariesToAdd.map(l => l.name));
    console.log('Libraries to remove from:', librariesToRemove.map(l => l.name));

    let addedCount = 0;
    let removedCount = 0;
    let failedAdditions = [];
    let failedRemovals = [];

    const operations = [];

    for (const library of librariesToAdd) {
      operations.push((async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/libraries/${library.id}/papers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(paperData)
          });
          if (response.ok || response.status === 409) {
            addedCount++;
          } else {
            let errorMessage = `HTTP ${response.status}`;
            try { const e = await response.json(); errorMessage = e.message || e.error || errorMessage; } catch (_) {}
            failedAdditions.push(`${library.name}: ${errorMessage}`);
          }
        } catch (error) {
          failedAdditions.push(`${library.name}: ${error.message}`);
        }
      })());
    }

    for (const library of librariesToRemove) {
      operations.push((async () => {
        try {
          const paperIdToDelete = internalPaperId || s2PaperId;
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/libraries/${library.id}/papers/${paperIdToDelete}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            removedCount++;
          } else if (response.status === 404 && paperIdToDelete !== s2PaperId) {
            const fallback = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/libraries/${library.id}/papers/${s2PaperId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            if (fallback.ok) removedCount++;
          } else if (response.status !== 404) {
            let errorMessage = `HTTP ${response.status}`;
            try { const e = await response.json(); errorMessage = e.message || e.error || errorMessage; } catch (_) {}
            failedRemovals.push(`${library.name}: ${errorMessage}`);
          }
        } catch (error) {
          failedRemovals.push(`${library.name}: ${error.message}`);
        }
      })());
    }

    await Promise.all(operations);
    paperInLibraryCache.current.clear();

    let message = '';
    if (addedCount > 0 || removedCount > 0) {
      message = '✓ Library updates completed!\n';
      if (addedCount > 0) message += `• Added to ${addedCount} librar${addedCount === 1 ? 'y' : 'ies'}\n`;
      if (removedCount > 0) message += `• Removed from ${removedCount} librar${removedCount === 1 ? 'y' : 'ies'}\n`;
    } else {
      message = 'No changes were made.\n';
    }
    if (failedAdditions.length > 0 || failedRemovals.length > 0) {
      message += '\nSome operations failed:\n';
      if (failedAdditions.length > 0) message += `Failed to add: ${failedAdditions.join(', ')}\n`;
      if (failedRemovals.length > 0) message += `Failed to remove: ${failedRemovals.join(', ')}\n`;
    }

    alert(message.trim());
    closeSave();
  };

  // Navigation function for paper clicks
  const handlePaperClick = (paper) => {
    console.log('📍 Navigating to paper:', {
      paperId: paper.paperId,
      s2_paper_id: paper.s2_paper_id,
      id: paper.id,
      title: paper.title
    });
    const routePaperId = paper.paperId || paper.s2_paper_id || paper.id;
    console.log('🔗 Using paperId for route:', routePaperId);
    navigate(`/paper/${routePaperId}`);
  };

  // Loading state
  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 80px)',
          marginTop: '80px'
        }}>
          <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem', color: '#2e7d32' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <Navbar />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 80px)',
          marginTop: '80px',
          padding: '0 20px'
        }}>
          <div className="alert alert-danger" role="alert" style={{ maxWidth: '600px', width: '100%' }}>
            <h4 className="alert-heading">Error Loading Profile</h4>
            <p>{error}</p>
            <hr />
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container-fluid px-4 py-4" style={{ maxWidth: '1400px' }}>
        <div className="row g-4">
          {/* MAIN CONTENT - 8 COLUMNS */}
          <div className="col-lg-8">
            {/* Profile Card */}
            <div className="card shadow-sm border-light mb-4">
              <div className="card-body p-4">
                <div className="row align-items-center g-4">
                  {/* Avatar */}
                  <div className="col-auto">
                    <div className="profile-avatar position-relative">
                      {userData.profile_picture_url ? (
                        <img
                          src={userData.profile_picture_url}
                          alt="Profile"
                          className="avatar-circle"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '50%'
                          }}
                        />
                      ) : (
                        <div className="avatar-circle">
                          {userData.name ? userData.name.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}

                      {/* Camera icon with dropdown menu - ONLY FOR OWN PROFILE */}
                      {isOwnProfile && (
                        <>
                          <div className="profile-picture-container position-relative">
                            <div
                              className="avatar-edit-btn"
                              onClick={() => {
                                // If no profile picture, directly open file picker
                                if (!userData.profile_picture_url) {
                                  document.getElementById('profilePictureInput').click();
                                } else {
                                  // If profile picture exists, show dropdown menu
                                  setShowProfilePictureMenu(!showProfilePictureMenu);
                                }
                              }}
                              style={{
                                cursor: 'pointer',
                                opacity: uploadingPicture ? 0.5 : 1,
                                pointerEvents: uploadingPicture ? 'none' : 'auto'
                              }}
                              title={userData.profile_picture_url ? "Manage profile picture" : "Upload profile picture"}
                            >
                              {uploadingPicture ? (
                                <div className="spinner-border spinner-border-sm" role="status">
                                  <span className="visually-hidden">Uploading...</span>
                                </div>
                              ) : (
                                <FiCamera size={18} />
                              )}
                            </div>

                            {/* Dropdown menu - only show if profile picture exists */}
                            {showProfilePictureMenu && !uploadingPicture && userData.profile_picture_url && (
                              <div
                                className="position-absolute bg-white rounded shadow-sm"
                                style={{
                                  top: '50%',
                                  left: 'calc(100% + 8px)',
                                  transform: 'translateY(-50%)',
                                  zIndex: 1000,
                                  border: '1px solid #e0e0e0',
                                  minWidth: '120px',
                                  overflow: 'hidden'
                                }}
                              >
                                <button
                                  className="w-100 text-start border-0 bg-white"
                                  onClick={() => {
                                    document.getElementById('profilePictureInput').click();
                                  }}
                                  style={{
                                    cursor: 'pointer',
                                    padding: '6px 10px',
                                    fontSize: '13px',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                >
                                  Upload Picture
                                </button>
                                <button
                                  className="w-100 text-start border-0 bg-white text-danger"
                                  onClick={handleRemoveProfilePicture}
                                  style={{
                                    cursor: 'pointer',
                                    padding: '6px 10px',
                                    fontSize: '13px',
                                    borderTop: '1px solid #f0f0f0',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = '#fff5f5'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                >
                                  Remove Picture
                                </button>
                              </div>
                            )}
                          </div>

                          <input
                            type="file"
                            id="profilePictureInput"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleProfilePictureChange}
                            disabled={uploadingPicture}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="col">
                    <div className="d-flex align-items-baseline justify-content-between gap-3 mb-2">
                      <h2 className="profile-name mb-0">
                        {userData.name || 'User'}
                      </h2>

                      {/* Right button: edit for own profile, follow for others */}
                      {isOwnProfile ? (
                        <button
                          className="btn btn-outline-primary fw-semibold d-flex align-items-center gap-2"
                          onClick={() => setIsEditModalOpen(true)}
                          disabled={updateLoading}
                          style={{
                            padding: '6px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <FiEdit2 size={16} />
                          <span>{updateLoading ? 'Updating...' : 'Edit Profile'}</span>
                        </button>
                      ) : (
                        !isOwnProfile && localStorage.getItem('access_token') && (
                          <button
                            onClick={handleFollowToggle}
                            disabled={followLoading}
                            style={{
                              padding: '6px 16px',
                              backgroundColor: followStatus.isFollowing ? '#fff' : '#3E513E',
                              color: followStatus.isFollowing ? '#3E513E' : '#fff',
                              border: followStatus.isFollowing ? '2px solid #3E513E' : 'none',
                              borderRadius: '6px',
                              cursor: followLoading ? 'not-allowed' : 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              transition: 'all 0.2s',
                              opacity: followLoading ? 0.6 : 1,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {followLoading ? (
                              <div style={{
                                width: '12px',
                                height: '12px',
                                border: '2px solid currentColor',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 0.6s linear infinite'
                              }} />
                            ) : (
                              <span>
                                {followStatus.isFollowing
                                  ? 'Following'
                                  : followStatus.isFollower
                                    ? 'Follow Back'
                                    : 'Follow'
                                }
                              </span>
                            )}
                          </button>
                        )
                      )}
                    </div>

                    {userData.institution && (
                      <p className="fw-semibold text-dark mb-2">{userData.institution}</p>
                    )}
                    {userData.department && (
                      <p className="text-muted mb-2">{userData.department}</p>
                    )}

                    {/* Email - ONLY SHOW FOR OWN PROFILE */}
                    {isOwnProfile && userData.email && (
                      <div className="d-flex align-items-center gap-2 mb-3 text-muted">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="#34a853">
                          <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14.4c-3.5 0-6.4-2.9-6.4-6.4S4.5 1.6 8 1.6s6.4 2.9 6.4 6.4-2.9 6.4-6.4 6.4z" />
                          <path d="M10.7 6.3L7.5 9.5 5.3 7.3c-.3-.3-.8-.3-1.1 0s-.3.8 0 1.1l2.8 2.8c.3.3.8.3 1.1 0l3.8-3.8c.3-.3.3-.8 0-1.1-.3-.3-.9-.3-1.2 0z" />
                        </svg>
                        <span className="small">Verified email at {userData.email}</span>
                      </div>
                    )}
                    {/* Social Links - Professional */}
                    {userData.socialLinks && userData.socialLinks.length > 0 && (
                      <div className="mb-4">
                        <div className="text-muted small fw-semibold mb-2" style={{
                          color: '#5f6368',
                          letterSpacing: '0.3px',
                          textTransform: 'uppercase',
                          fontSize: '11px'
                        }}>
                          SOCIAL
                        </div>
                        <div className="d-flex gap-3 flex-wrap">
                          {userData.socialLinks.map((link, idx) => {
                            // Extract username from URL
                            const urlParts = link.split('/').filter(Boolean);
                            const username = urlParts[urlParts.length - 1] || '';

                            // Determine platform
                            let platform = 'link';
                            let platformName = '';
                            let iconColor = '#666';

                            if (link.includes('github')) {
                              platform = 'github';
                              platformName = 'GitHub';
                              iconColor = '#333';
                            } else if (link.includes('linkedin')) {
                              platform = 'linkedin';
                              platformName = 'LinkedIn';
                              iconColor = '#0A66C2';
                            } else if (link.includes('twitter') || link.includes('x.com')) {
                              platform = 'twitter';
                              platformName = 'X';
                              iconColor = '#1DA1F2';
                            } else if (link.includes('scholar')) {
                              platform = 'scholar';
                              platformName = 'Scholar';
                              iconColor = '#4285F4';
                            } else if (link.includes('orcid')) {
                              platform = 'orcid';
                              platformName = 'ORCID';
                              iconColor = '#A6CE39';
                            } else if (link.includes('medium')) {
                              platform = 'medium';
                              platformName = 'Medium';
                              iconColor = '#000';
                            }

                            // Show username only if it's short and clean
                            const displayName = username.length > 0 && username.length <= 20
                              ? `${platformName} / ${username}`
                              : platformName;

                            return (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  textDecoration: 'none',
                                  color: '#3c4043',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  borderBottom: '1px solid transparent',
                                  transition: 'all 0.2s ease',
                                  paddingBottom: '1px'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderBottomColor = '#3c4043';
                                  e.currentTarget.style.opacity = '0.75';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderBottomColor = 'transparent';
                                  e.currentTarget.style.opacity = '1';
                                }}
                              >
                                {/* SVG Icon */}
                                <span style={{ display: 'flex', alignItems: 'center', color: iconColor }}>
                                  {platform === 'github' && (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025.8-.223 1.65-.334 2.5-.334.85 0 1.7.111 2.5.334 1.91-1.294 2.75-1.025 2.75-1.025.545 1.376.201 2.393.099 2.646.64.698 1.03 1.591 1.03 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                                    </svg>
                                  )}
                                  {platform === 'linkedin' && (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.771-.773 1.771-1.729V1.729C24 .774 23.204 0 22.225 0z" />
                                    </svg>
                                  )}
                                  {platform === 'twitter' && (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                  )}
                                  {platform === 'scholar' && (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 2L2 7v2l10 5 10-5V7l-10-5zm0 4.2L5.5 7 12 9.8 18.5 7 12 6.2zM4 12v5l8 4 8-4v-5l-8 4-8-4z" />
                                    </svg>
                                  )}
                                  {platform === 'orcid' && (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zM7.5 17.5H5V6.5h2.5v11zm9.25-6.25c0 1.381-1.119 2.5-2.5 2.5s-2.5-1.119-2.5-2.5v-2.5h-2.5v9h2.5v-2.5c.5.5 1.119 1 2.5 1 2.5 0 5-2.5 5-5v-5h-2.5v5zM10 5h2.5v2.5H10V5z" />
                                    </svg>
                                  )}
                                  {platform === 'medium' && (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M2.846 6.887c.03-.295-.083-.586-.303-.784l-2.24-2.7v-.403h6.958l5.378 11.795 4.728-11.795h6.633v.403l-1.916 1.837c-.165.126-.247.333-.213.538v13.5c-.034.205.048.412.213.538l1.87 1.837v.403h-9.41v-.403l1.937-1.882c.19-.19.19-.247.19-.538v-10.91l-5.39 13.688h-.729l-6.275-13.688v9.174c-.052.385.076.774.347 1.052l2.52 3.058v.403h-7.148v-.403l2.52-3.058c.27-.278.39-.667.32-1.052v-10.61z" />
                                    </svg>
                                  )}
                                  {platform === 'link' && (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                    </svg>
                                  )}
                                </span>

                                {/* Display name */}
                                <span>{displayName}</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Research Interests with Header */}
                    {userData.researchInterests.length > 0 && (
                      <div className="mb-3">
                        <div className="text-muted small fw-semibold mb-2" style={{
                          color: '#5f6368',
                          letterSpacing: '0.3px',
                          textTransform: 'uppercase',
                          fontSize: '11px'
                        }}>
                          RESEARCH INTERESTS
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                          {userData.researchInterests.map((interest, idx) => (
                            <span key={idx} className="research-interest-badge">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* follower/following counts + member since */}
                    <div className="d-flex gap-2 align-items-start mb-2" style={{ fontSize: '14px', color: '#666' }}>
                      <div>
                        <div
                          onClick={() => openFollowersModal('followers')}
                          style={{
                            cursor: 'pointer',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#3E513E'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
                        >
                          <span style={{ fontWeight: '600', color: '#333' }}>{followStatus.followerCount}</span>
                          {' '}Follower{followStatus.followerCount !== 1 ? 's' : ''}
                        </div>
                        {userData.joinedDate && (
                          <div className="text-muted small mt-2">
                            Member since {userData.joinedDate}
                          </div>
                        )}
                      </div>
                      <div
                        onClick={() => openFollowersModal('following')}
                        style={{
                          cursor: 'pointer',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#3E513E'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
                      >
                        <span style={{ fontWeight: '600', color: '#333' }}>{followStatus.followingCount}</span>
                        {' '}Following
                      </div>
                    </div>

                    {/* Follow success/error message */}
                    {followMessage && (
                      <span style={{
                        fontSize: '13px',
                        color: followMessage.includes('success') || followMessage.includes('Following') ? '#0b8043' : '#d32f2f',
                        fontWeight: '600'
                      }}>
                        {followMessage}
                      </span>
                    )}

                    {/* Add keyframe animation for loading spinner */}
                    <style>{`
                      @keyframes spin {
                        to { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                </div>
              </div>
            </div>

            {/* Publications Section */}
            <div className="card shadow-sm border-light">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-2">
                  <div className="d-flex align-items-center gap-3">
                    <h2 className="section-title mb-0">Publications</h2>
                    <span className="badge bg-light text-secondary fw-semibold">
                      {userData.publications.length} papers
                    </span>
                  </div>

                  {/* Upload Paper button - ONLY FOR OWN PROFILE */}
                  {isOwnProfile && (
                    <button
                      className="btn btn-outline-primary fw-semibold d-flex align-items-center gap-2"
                      onClick={() => setIsUploadModalOpen(true)}
                      style={{
                        padding: '6px 16px',
                        fontSize: '13px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        borderWidth: '1px',
                        borderRadius: '4px',
                        borderColor: '#1f5e3a',
                        color: '#1f5e3a',
                        backgroundColor: '#fff'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1f5e3a';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.color = '#1f5e3a';
                      }}
                    >
                      <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
                      <span>Upload Paper</span>
                    </button>
                  )}
                </div>

                {/* Publications List - ResultsPage formatting */}
                <div>
                  {userData.publications.length === 0 ? (
                    <div className="text-center py-5">
                      <p className="text-muted">
                        {isOwnProfile
                          ? 'No publications yet. Click "Upload Paper" to add your first paper!'
                          : 'No publications yet.'
                        }
                      </p>
                    </div>
                  ) : (
                    userData.publications.map((pub, idx) => (
                      <div key={pub.id || idx} style={{ padding: "18px 0", borderBottom: "1px solid #eee" }}>
                        {/* Paper Title - Clickable button */}
                        <button
                          onClick={() => handlePaperClick(pub)}
                          style={{
                            color: "#3E513E",
                            fontSize: 20,
                            fontWeight: 600,
                            textDecoration: "none",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            textAlign: "left",
                            width: "100%"
                          }}
                        >
                          {pub.title}
                        </button>

                        {/* Authors, Fields, Venue, Date - Exact ResultsPage format */}
                        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          {/* 1. Authors first - plain text in light badges */}
                          {pub.authors && (
                            <>
                              {Array.isArray(pub.authors) ? (
                                pub.authors.map((a, idx) => (
                                  <span key={idx} style={{ background: "#f2f6f8", padding: "4px 8px", borderRadius: 4, fontSize: 12, color: "#000" }}>
                                    {typeof a === 'object' ? a.name || '' : a || ''}
                                  </span>
                                ))
                              ) : (
                                // If authors is a string, split by comma and create badges
                                pub.authors.split(',').slice(0, 3).map((author, idx) => (
                                  <span key={idx} style={{ background: "#f2f6f8", padding: "4px 8px", borderRadius: 4, fontSize: 12, color: "#000" }}>
                                    {author.trim()}
                                  </span>
                                ))
                              )}
                            </>
                          )}

                          {/* 2. Fields of Study - colored badges with links */}
                          {/* Check multiple possible field names: fieldsOfStudy, fields_of_study, fields */}
                          {(pub.fieldsOfStudy || pub.fields_of_study || pub.fields) && (
                            (() => {
                              const fields = pub.fieldsOfStudy || pub.fields_of_study || pub.fields;
                              const fieldsArray = Array.isArray(fields) ? fields : [];
                              return fieldsArray.length > 0 ? (
                                <>
                                  {fieldsArray.slice(0, 3).map((field, fidx) => (
                                    <span
                                      key={fidx}
                                      style={{
                                        background: "#e8f4f8",
                                        padding: "4px 8px",
                                        borderRadius: 4,
                                        fontSize: 11,
                                        color: "#1a73e8",
                                        fontWeight: 400,
                                        cursor: "pointer"
                                      }}
                                    >
                                      {typeof field === 'object' ? field.name || field : field}
                                    </span>
                                  ))}
                                  {fieldsArray.length > 3 && (
                                    <span
                                      style={{
                                        background: "#e8f4f8",
                                        padding: "4px 8px",
                                        borderRadius: 4,
                                        fontSize: 11,
                                        color: "#1a73e8",
                                        fontWeight: 400
                                      }}
                                    >
                                      +{fieldsArray.length - 3} more
                                    </span>
                                  )}
                                </>
                              ) : null;
                            })()
                          )}

                          {/* 3. Venue - plain gray text, not in badge */}
                          {/* Check multiple possible field names: venue, journal, publication */}
                          {(pub.venue || pub.journal || pub.publication) && (
                            <span style={{ color: "#5f6368", fontSize: 13 }}>
                              {(() => {
                                const venueValue = pub.venue || pub.journal || pub.publication;
                                return Array.isArray(venueValue) ? venueValue.join(", ") : venueValue;
                              })()}
                            </span>
                          )}

                          {/* 4. Date - plain gray text with bullet separator */}
                          {(pub.year || pub.date) && (
                            <span style={{ color: "#5f6368", fontSize: 13 }}>
                              · {pub.year || pub.date || 'n.d.'}
                            </span>
                          )}
                        </div>

                        {/* Abstract */}
                        {pub.abstract && (
                          <p style={{ marginTop: 10, color: "#444" }}>
                            {pub.abstract.length > 300 ? `${pub.abstract.substring(0, 300)}...` : pub.abstract}
                          </p>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
                          {/* Citations Count with inverted commas icon */}
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 10px",
                            background: "#f5f5f5",
                            border: "1px solid #e0e0e0",
                            borderRadius: 4,
                            fontSize: 12,
                            color: "#333",
                            fontWeight: 500
                          }}>
                            <img
                              src={invertedCommasIcon}
                              alt="Citations"
                              style={{ width: 12, height: 12, opacity: 0.8 }}
                            />
                            {pub.citationCount || pub.citations || pub.citation_count || 0}
                          </span>

                          {/* Save Button with bookmark icon */}
                          <button
                            onClick={() => openSave(pub)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 10px",
                              background: "#fff",
                              border: "1px solid #e0e0e0",
                              borderRadius: 4,
                              fontSize: 12,
                              color: "#333",
                              cursor: "pointer",
                              fontWeight: 500,
                              whiteSpace: "nowrap"
                            }}
                          >
                            <img
                              src={bookmarkIcon}
                              alt="Save"
                              style={{ width: 12, height: 12 }}
                            />
                            Save
                          </button>

                          {/* Cite Button with inverted commas icon */}
                          <button
                            onClick={() => openCite(pub)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 10px",
                              background: "#fff",
                              border: "1px solid #e0e0e0",
                              borderRadius: 4,
                              fontSize: 12,
                              color: "#333",
                              cursor: "pointer",
                              fontWeight: 500,
                              whiteSpace: "nowrap"
                            }}
                          >
                            <img
                              src={invertedCommasIcon}
                              alt="Cite"
                              style={{ width: 12, height: 12 }}
                            />
                            Cite
                          </button>

                          {/* Remove button - ONLY FOR OWN PROFILE */}
                          {isOwnProfile && (
                            <button
                              onClick={() => handleRemovePaper(pub.id)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 10px",
                                background: "#fff",
                                border: "1px solid #dc3545",
                                borderRadius: 4,
                                fontSize: 12,
                                color: "#dc3545",
                                cursor: "pointer",
                                fontWeight: 500,
                                whiteSpace: "nowrap"
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR - 4 COLUMNS */}
          <div className="col-lg-4">
            {/* Reading Progress - ONLY FOR OWN PROFILE */}
            {isOwnProfile && (
              <div className="card shadow-sm border-light mb-4">
                <div className="card-body p-4">
                  <h3 className="sidebar-title">Reading Progress</h3>
                  <div className="row g-3 text-center">
                    <div className="col-4">
                      <div className="stat-number">{userData.unread}</div>
                      <div className="stat-label">UNREAD</div>
                    </div>
                    <div className="col-4">
                      <div className="stat-number">{userData.in_progress}</div>
                      <div className="stat-label">IN<br />PROGRESS</div>
                    </div>
                    <div className="col-4">
                      <div className="stat-number">{userData.read}</div>
                      <div className="stat-label">READ</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Most Cited Papers - SHOWN FOR BOTH OWN AND OTHER PROFILES */}
            <div className="card shadow-sm border-light">
              <div className="card-body p-4">
                <h3 className="sidebar-title">Most Cited Papers</h3>
                {userData.mostCitedPapers.length === 0 ? (
                  <div className="text-center py-3">
                    <p className="text-muted small">No publications yet</p>
                  </div>
                ) : (
                  userData.mostCitedPapers.map((paper, idx) => (
                    <div
                      key={paper.id || idx}
                      className={`cited-paper ${idx < userData.mostCitedPapers.length - 1 ? 'border-bottom' : ''}`}
                    >
                      <div className="cited-paper-title mb-2">{paper.title}</div>
                      <div className="cited-paper-authors mb-1">{paper.authors}</div>
                      <div className="cited-paper-meta">
                        {paper.year} • <strong>{paper.citations || paper.citation_count || 0} citations</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals - ONLY FOR OWN PROFILE */}
      {isOwnProfile && (
        <>
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            userData={userData}
            onSave={handleSaveProfile}
          />

          <UploadPaperModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onConfirm={handleConfirmPaper}
          />
        </>
      )}

      {/* Save Modal - Same as ResultsPage */}
      {saveOpen && saveItem && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000
        }}>
          <div
            style={{
              width: '500px',
              maxWidth: '90vw',
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#333' }}>
                Save to Library
              </h2>
              <button
                onClick={closeSave}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: '#3E513E',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 8 }}>
                  {saveItem.title}
                </div>
                <div style={{ fontSize: 13, color: '#666' }}>
                  {saveItem.authors}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#444' }}>
                    Select Libraries
                  </div>
                  <button
                    onClick={() => setShowNewLibraryModal(true)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #3E513E',
                      color: '#3E513E',
                      borderRadius: 4,
                      padding: '6px 12px',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    + New Library
                  </button>
                </div>

                {librariesLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#666' }}>
                    Loading libraries...
                  </div>
                ) : checkingPaperInLibraries ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#666' }}>
                    Checking libraries...
                  </div>
                ) : userLibraries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#666' }}>
                    No libraries yet. Create one to get started!
                  </div>
                ) : (
                  <div style={{
                    maxHeight: 280,
                    overflowY: 'auto',
                    border: '1px solid #e0e0e0',
                    borderRadius: 4
                  }}>
                    {userLibraries.map(lib => (
                      <div
                        key={lib.id}
                        onClick={() => toggleLibrarySelection(lib)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          background: selectedLibraries.some(l => l.id === lib.id) ? '#f0f7f0' : 'white'
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedLibraries.some(l => l.id === lib.id)) {
                            e.currentTarget.style.background = '#f8f9fa';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedLibraries.some(l => l.id === lib.id)) {
                            e.currentTarget.style.background = 'white';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedLibraries.some(l => l.id === lib.id)}
                          onChange={() => { }}
                          style={{ cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
                            {lib.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            {lib.paper_count || 0} papers
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {showNewLibraryModal && (
                <div style={{
                  marginBottom: 20,
                  padding: 16,
                  background: '#f8f9fa',
                  borderRadius: 4,
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#333' }}>
                    Create New Library
                  </div>
                  <input
                    type="text"
                    value={newLibraryName}
                    onChange={(e) => setNewLibraryName(e.target.value)}
                    placeholder="Library name"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: 4,
                      fontSize: 14,
                      marginBottom: 12
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateLibrary();
                      }
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setShowNewLibraryModal(false);
                        setNewLibraryName('');
                      }}
                      style={{
                        padding: '6px 16px',
                        background: 'transparent',
                        border: '1px solid #d0d0d0',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 13
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateLibrary}
                      disabled={creatingLibrary || !newLibraryName.trim()}
                      style={{
                        padding: '6px 16px',
                        background: creatingLibrary || !newLibraryName.trim() ? '#cccccc' : '#3E513E',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: creatingLibrary || !newLibraryName.trim() ? 'not-allowed' : 'pointer',
                        fontSize: 13
                      }}
                    >
                      {creatingLibrary ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSavePaper}
                  disabled={selectedLibraries.length === 0 && paperInLibraries.length === 0}
                  style={{
                    padding: '8px 20px',
                    background: (selectedLibraries.length === 0 && paperInLibraries.length === 0) ? '#cccccc' : '#3E513E',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: (selectedLibraries.length === 0 && paperInLibraries.length === 0) ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    transition: 'background-color 0.2s',
                  }}
                >
                  {selectedLibraries.length === 0 && paperInLibraries.length > 0 ? 'Remove from All Libraries' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Citation Modal - Same as PaperDetails */}
      {citeOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000
        }}>
          <div
            className="cite-modal"
            style={{
              width: '580px',
              maxWidth: '90vw',
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#333' }}>Cite Paper</h2>
              <button
                onClick={closeCite}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: '#3E513E',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {citationLoading && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                  Loading citation formats...
                </div>
              )}

              {!citationLoading && citationFormats.length > 0 && (
                <>
                  {/* Format tabs */}
                  <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e0e0e0', marginBottom: 20, overflowX: 'auto' }}>
                    {citationFormats.map(fmt => (
                      <button
                        key={fmt.id}
                        onClick={() => setSelectedFormat(fmt.id)}
                        style={{
                          padding: '12px 16px',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: selectedFormat === fmt.id ? '3px solid #3E513E' : '3px solid transparent',
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: selectedFormat === fmt.id ? 600 : 500,
                          color: selectedFormat === fmt.id ? '#3E513E' : '#666',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>

                  {/* Citation display area */}
                  <div style={{ marginBottom: 20 }}>
                    {selectedFormat === 'bibtex' ? (
                      <textarea
                        id="cite-textarea"
                        readOnly
                        value={(() => {
                          const selected = citationFormats.find(f => f.id === selectedFormat);
                          return selected ? selected.value : '';
                        })()}
                        style={{
                          width: '100%',
                          height: 200,
                          padding: 12,
                          fontFamily: 'monospace',
                          fontSize: 12,
                          border: '1px solid #d0d0d0',
                          borderRadius: 4,
                          resize: 'none',
                          background: '#fafafa'
                        }}
                      />
                    ) : (
                      <div
                        id="cite-html"
                        style={{
                          width: '100%',
                          height: 200,
                          padding: 12,
                          fontSize: 12,
                          border: '1px solid #d0d0d0',
                          borderRadius: 4,
                          background: '#fafafa',
                          overflowY: 'auto'
                        }}
                        dangerouslySetInnerHTML={{
                          __html: (() => {
                            const selected = citationFormats.find(f => f.id === selectedFormat);
                            return selected ? selected.value : '';
                          })()
                        }}
                      />
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: '#e0e0e0', marginBottom: 20 }} />

                  {/* Copy and Export */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Export / BibTeX on the left */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 8 }}>Export</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={downloadCitation}
                          style={{
                            padding: '8px 16px',
                            background: '#3E513E',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 500
                          }}
                        >
                          BibTeX
                        </button>
                      </div>
                    </div>

                    {/* Copy button on the right */}
                    <button
                      onClick={copyCitation}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'transparent',
                        border: 'none',
                        color: '#3E513E',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 1H4a2 2 0 00-2 2v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="8" y="5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Copy
                    </button>
                  </div>

                  {copied && <span style={{ color: '#0b8043', fontWeight: 600, fontSize: 13, marginLeft: 8 }}>Copied!</span>}
                </>
              )}

              {!citationLoading && citationFormats.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                  No citation formats available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Followers/Following Modal */}
      {showFollowersModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={() => setShowFollowersModal(false)}
        >
          <div
            style={{
              width: '500px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid #e0e0e0'
              }}
            >
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#333' }}>
                {followersModalType === 'followers' ? 'Followers' : 'Following'}
              </h2>
              <button
                onClick={() => setShowFollowersModal(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e0e0e0'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loadingFollowList ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  Loading...
                </div>
              ) : (
                <>
                  {followersModalType === 'followers' ? (
                    followersList.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                        No followers yet
                      </div>
                    ) : (
                      followersList.map((follower) => (
                        <div
                          key={follower.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 24px',
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                          onClick={() => {
                            setShowFollowersModal(false);
                            navigate(`/user/${follower.id}`);
                          }}
                        >
                          {/* Profile Picture */}
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              backgroundColor: follower.profile_picture_url ? 'transparent' : '#e0e0e0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              flexShrink: 0
                            }}
                          >
                            {follower.profile_picture_url ? (
                              <img
                                src={follower.profile_picture_url}
                                alt={follower.name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M20 21C20 18.8783 19.1571 16.8434 17.6569 15.3431C16.1566 13.8429 14.1217 13 12 13C9.87827 13 7.84344 13.8429 6.34315 15.3431C4.84285 16.8434 4 18.8783 4 21" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>

                          {/* User Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '600', fontSize: '15px', color: '#333' }}>
                              {follower.name}
                            </div>
                            {follower.affiliation && (
                              <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                                {follower.affiliation}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    followingList.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                        Not following anyone yet
                      </div>
                    ) : (
                      followingList.map((following) => (
                        <div
                          key={following.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 24px',
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                          onClick={() => {
                            setShowFollowersModal(false);
                            navigate(`/user/${following.id}`);
                          }}
                        >
                          {/* Profile Picture */}
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              backgroundColor: following.profile_picture_url ? 'transparent' : '#e0e0e0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              flexShrink: 0
                            }}
                          >
                            {following.profile_picture_url ? (
                              <img
                                src={following.profile_picture_url}
                                alt={following.name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M20 21C20 18.8783 19.1571 16.8434 17.6569 15.3431C16.1566 13.8429 14.1217 13 12 13C9.87827 13 7.84344 13.8429 6.34315 15.3431C4.84285 16.8434 4 18.8783 4 21" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>

                          {/* User Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '600', fontSize: '15px', color: '#333' }}>
                              {following.name}
                            </div>
                            {following.affiliation && (
                              <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                                {following.affiliation}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;