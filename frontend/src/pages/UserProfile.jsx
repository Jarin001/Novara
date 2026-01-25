import React, { useState, useEffect } from "react";
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

// Import icons (using react-icons - install with: npm install react-icons)
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
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  // Citation modal state (from ResultsPage)
  const [citeOpen, setCiteOpen] = useState(false);
  const [citeItem, setCiteItem] = useState(null);
  const [citationFormats, setCitationFormats] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('bibtex');
  const [copied, setCopied] = useState(false);
  const [citationLoading, setCitationLoading] = useState(false);
  const [citationError, setCitationError] = useState(null);

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
   * Fetch public user profile (for viewing others) - NO AUTH REQUIRED
   */
  const fetchPublicProfile = async (targetUserId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/users/profile/${targetUserId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error('Failed to fetch public profile');
      }

      const data = await response.json();
      
      // If the backend indicates this is the user's own profile, redirect
      if (data.user.isOwnProfile) {
        navigate('/profile');
        return;
      }

      return data.user;
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
        setLoading(true);
        setError(null);

        if (userId) {
          // VIEWING SOMEONE ELSE'S PROFILE (No auth required)
          setIsOwnProfile(false);
          
          const publicProfile = await fetchPublicProfile(userId);
          
          // Don't proceed if redirected to own profile
          if (!publicProfile) return;
          
          setUserData(prev => ({
            ...prev,
            name: publicProfile.name || "",
            affiliation: publicProfile.affiliation || "",
            institution: publicProfile.affiliation || "",
            researchInterests: publicProfile.research_interests || [],
            joinedDate: publicProfile.joinedDate || "",
            profile_picture_url: publicProfile.profile_picture_url || null,
            publications: publicProfile.publications || [],
            totalPapers: publicProfile.totalPapers || 0,
            mostCitedPapers: publicProfile.mostCitedPapers || [],
          }));
          
        } else {
          // VIEWING OWN PROFILE (Auth required)
          const token = localStorage.getItem('access_token');

          if (!token) {
            navigate('/login');
            return;
          }

          setIsOwnProfile(true);
          
          const profile = await getUserProfile();
          
          setUserData(prev => ({
            ...prev,
            name: profile.name || "",
            email: profile.email || "",
            affiliation: profile.affiliation || "",
            institution: profile.affiliation || "",
            researchInterests: profile.research_interests || [],
            joinedDate: profile.created_at 
              ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : "",
            profile_picture_url: profile.profile_picture_url || null
          }));

          await fetchPublications();
          await fetchReadingProgress();
        }

      } catch (error) {
        console.error("Failed to initialize profile:", error);
        setError(error.message);

        // Only redirect to login for own profile authentication errors
        if (!userId && (error.message.includes('401') || error.message.includes('403'))) {
          clearAuth();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeProfile();
  }, [navigate, userId]);

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

  // ==================== CITATION MODAL FUNCTIONS (from ResultsPage) ====================
  const openCite = async (paper) => {
    setCiteItem(paper);
    setCiteOpen(true);
    setCitationLoading(true);
    setCitationError(null);
    setSelectedFormat('bibtex');
    setCopied(false);

    try {
      console.log(`Fetching citations for paper: ${paper.paperId || paper.id}`);
      const response = await fetch(`http://localhost:5000/api/citations/${paper.paperId || paper.id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Citations API response:", data);
        setCitationFormats(data.data || []);
      } else {
        console.error("Failed to fetch citations:", response.status);
        setCitationError("Failed to load citation formats from API");
        setCitationFormats([]);
      }
    } catch (error) {
      console.error("Citation fetch error:", error);
      setCitationError("Error loading citation formats");
      setCitationFormats([]);
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

  const getCurrentCitationText = () => {
    if (!citeItem) return '';

    if (citationFormats.length > 0) {
      const format = citationFormats.find(f => f.id === selectedFormat);
      if (format && format.value) {
        return format.value;
      }
    }

    // Fallback basic citation
    const authors = citeItem.authors || 'Unknown Authors';
    const title = citeItem.title || 'Untitled';
    const year = citeItem.year || 'n.d.';
    
    if (selectedFormat === 'bibtex') {
      const safeTitle = (citeItem.title || 'Untitled').replace(/[{}]/g, '');
      return `@article{${citeItem.paperId || citeItem.id || 'unknown'},
  author = {${authors}},
  title = {${safeTitle}},
  year = {${year}}
}`;
    } else if (selectedFormat === 'mla') {
      return `${authors}. "${title}." ${year}.`;
    } else if (selectedFormat === 'apa') {
      return `${authors} (${year}). ${title}.`;
    } else if (selectedFormat === 'ieee') {
      return `${authors}, "${title}," ${year}.`;
    }
    return '';
  };

  const copyCitation = () => {
    const text = getCurrentCitationText();
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy citation');
    });
  };

  const downloadCitation = () => {
    const text = getCurrentCitationText();
    if (!text || !citeItem) return;

    const sanitizeFilename = (s = '') => s.replace(/[^a-z0-9\.\-\_]/gi, '-').slice(0, 120);
    const safeTitle = sanitizeFilename(citeItem.title || 'citation');
    const ext = selectedFormat === 'bibtex' ? 'bib' : 'txt';
    const filename = `${safeTitle}.${ext}`;
    const mime = selectedFormat === 'bibtex' ? 'application/x-bibtex' : 'text/plain';

    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ==================== SAVE MODAL FUNCTIONS (from ResultsPage) ====================
  const openSave = async (paper) => {
    setSaveItem(paper);
    setSaveOpen(true);
    setSelectedLibraries([]);

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('Not authenticated');
      return;
    }

    setLibrariesLoading(true);
    try {
      console.log('Fetching user libraries...');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/libraries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Libraries loaded:', data);
        setUserLibraries(data.libraries || []);
      } else {
        console.error('Failed to fetch libraries:', response.status);
        setUserLibraries([]);
      }
    } catch (error) {
      console.error('Error fetching libraries:', error);
      setUserLibraries([]);
    } finally {
      setLibrariesLoading(false);
    }
  };

  const closeSave = () => {
    setSaveOpen(false);
    setSaveItem(null);
    setSelectedLibraries([]);
    setShowNewLibraryModal(false);
    setNewLibraryName('');
  };

  const toggleLibrarySelection = (libraryId) => {
    setSelectedLibraries(prev => {
      if (prev.includes(libraryId)) {
        return prev.filter(id => id !== libraryId);
      } else {
        return [...prev, libraryId];
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
        setUserLibraries(prev => [...prev, data.library]);
        setNewLibraryName('');
        setShowNewLibraryModal(false);
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
      const response = await fetch(`http://localhost:5000/api/citations/${paperId}`);
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

  const handleSavePaper = async () => {
    if (selectedLibraries.length === 0) {
      alert('Please select at least one library');
      return;
    }

    if (!saveItem) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Please log in to save papers');
      return;
    }

    try {
      const bibtex = await fetchPaperBibtex(saveItem.paperId || saveItem.id);

      const savePromises = selectedLibraries.map(libraryId =>
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/libraries/${libraryId}/papers`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paper_id: saveItem.paperId || saveItem.id,
            title: saveItem.title,
            authors: saveItem.authors,
            year: saveItem.year,
            abstract: saveItem.abstract || '',
            citations: saveItem.citationCount || saveItem.citations || 0,
            venue: saveItem.venue || '',
            fields_of_study: saveItem.fieldsOfStudy || [],
            bibtex: bibtex,
            external_ids: saveItem.externalIds || {}
          })
        })
      );

      const results = await Promise.all(savePromises);
      const allSuccessful = results.every(r => r.ok);

      if (allSuccessful) {
        alert(`Paper saved to ${selectedLibraries.length} library${selectedLibraries.length > 1 ? 'ies' : ''}!`);
        closeSave();
      } else {
        alert('Some libraries failed to save. Please try again.');
      }
    } catch (error) {
      console.error('Error saving paper:', error);
      alert('Failed to save paper. Please try again.');
    }
  };

  // Navigation function for paper clicks
  const handlePaperClick = (paper) => {
    navigate(`/paper/${paper.paperId || paper.id}`);
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
                    <div className="d-flex align-items-baseline gap-3 mb-2">
                      <h2 className="profile-name mb-0">
                        {userData.name || 'User'}
                      </h2>
                      {userData.id && <span className="profile-id">{userData.id}</span>}
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

                    {userData.researchInterests.length > 0 && (
                      <div className="mb-3">
                        <div className="text-muted small fw-semibold mb-2">Research Interests</div>
                        <div className="d-flex gap-2 flex-wrap">
                          {userData.researchInterests.map((interest, idx) => (
                            <span key={idx} className="badge research-interest-badge">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="d-flex gap-3 align-items-center">
                      {/* Edit Profile button - ONLY FOR OWN PROFILE */}
                      {isOwnProfile && (
                        <button
                          className="btn btn-outline-primary fw-semibold d-flex align-items-center gap-2"
                          onClick={() => setIsEditModalOpen(true)}
                          disabled={updateLoading}
                        >
                          <FiEdit2 size={16} />
                          <span>{updateLoading ? 'Updating...' : 'Edit Profile'}</span>
                        </button>
                      )}
                      
                      {userData.joinedDate && (
                        <span className="text-muted small">
                          Member since {userData.joinedDate}
                        </span>
                      )}
                    </div>
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
                      className="btn btn-primary fw-semibold d-flex align-items-center gap-2"
                      onClick={() => setIsUploadModalOpen(true)}
                    >
                      <span className="fs-5">+</span>
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
                        onClick={() => toggleLibrarySelection(lib.id)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          background: selectedLibraries.includes(lib.id) ? '#f0f7f0' : 'white'
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedLibraries.includes(lib.id)) {
                            e.currentTarget.style.background = '#f8f9fa';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedLibraries.includes(lib.id)) {
                            e.currentTarget.style.background = 'white';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedLibraries.includes(lib.id)}
                          onChange={() => {}}
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
                  disabled={selectedLibraries.length === 0}
                  style={{
                    padding: '8px 20px',
                    background: selectedLibraries.length === 0 ? '#cccccc' : '#3E513E',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: selectedLibraries.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontWeight: 500
                  }}
                >
                  Save to {selectedLibraries.length > 0 ? `${selectedLibraries.length} ` : ''}Library{selectedLibraries.length !== 1 ? 'ies' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Citation Modal - Same as ResultsPage */}
      {citeOpen && citeItem && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 2000 
        }}>
          <div 
            style={{ 
              width: '580px', 
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

            <div style={{ padding: '24px' }}>
              {citationLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: 16, color: '#666' }}>Loading citation formats...</div>
                </div>
              ) : citationError ? (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ color: '#d32f2f', fontSize: 14, marginBottom: 16 }}>
                    {citationError}
                  </div>
                  <div style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>
                    Using basic citation format instead...
                  </div>
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e0e0e0', marginBottom: 20 }}>
                {citationFormats.length > 0 ? (
                  citationFormats.map(format => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      style={{
                        padding: '12px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: selectedFormat === format.id ? '3px solid #3E513E' : '3px solid transparent',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: selectedFormat === format.id ? 600 : 500,
                        color: selectedFormat === format.id ? '#3E513E' : '#666'
                      }}
                    >
                      {format.label}
                    </button>
                  ))
                ) : (
                  ['bibtex', 'mla', 'apa', 'ieee'].map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setSelectedFormat(fmt)}
                      style={{
                        padding: '12px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: selectedFormat === fmt ? '3px solid #3E513E' : '3px solid transparent',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: selectedFormat === fmt ? 600 : 500,
                        color: selectedFormat === fmt ? '#3E513E' : '#666'
                      }}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <textarea
                  readOnly
                  value={getCurrentCitationText()}
                  style={{
                    width: '100%',
                    height: 200,
                    padding: 12,
                    fontFamily: selectedFormat === 'bibtex' ? 'monospace' : 'inherit',
                    fontSize: selectedFormat === 'bibtex' ? 12 : 14,
                    border: '1px solid #d0d0d0',
                    borderRadius: 4,
                    resize: 'none',
                    background: '#fafafa'
                  }}
                />
              </div>

              <div style={{ height: '1px', background: '#e0e0e0', marginBottom: 20 }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      Download {selectedFormat === 'bibtex' ? 'BibTeX' : 'Text'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {copied && <span style={{ color: '#0b8043', fontWeight: 600, fontSize: 13 }}>Copied!</span>}
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;