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
  clearAuth
} from '../services/userService';
import {
  getUserPublications,
  removePublication,
  getMostCitedPapers
} from '../services/paperService';

// Import icons (using react-icons - install with: npm install react-icons)
import { FiCamera, FiEdit2 } from 'react-icons/fi'; // Feather Icons
// Alternative icon libraries you can use:
// import { MdEdit, MdPhotoCamera } from 'react-icons/md'; // Material Design
// import { BiCamera, BiEdit } from 'react-icons/bi'; // BoxIcons
// import { AiOutlineCamera, AiOutlineEdit } from 'react-icons/ai'; // Ant Design

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
  
  // Get user data from context
  const { userData: contextUserData, isLoggedIn, refreshUserData } = useUser();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Determine if viewing own profile
  const [isOwnProfile, setIsOwnProfile] = useState(true);

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
   * Fetch public user profile (for viewing others)
   */
  const fetchPublicProfile = async (targetUserId) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/users/profile/${targetUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch public profile');
      }

      const data = await response.json();
      
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
      // Check login status from context
      if (!isLoggedIn) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (userId) {
          // VIEWING SOMEONE ELSE'S PROFILE
          setIsOwnProfile(false);
          
          const publicProfile = await fetchPublicProfile(userId);
          
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
          // VIEWING OWN PROFILE - USE DATA FROM CONTEXT
          setIsOwnProfile(true);
          
          // Use data from UserContext (already fetched!)
          setUserData(prev => ({
            ...prev,
            name: contextUserData.name || "",
            email: contextUserData.email || "",
            affiliation: contextUserData.affiliation || "",
            institution: contextUserData.affiliation || "",
            profile_picture_url: contextUserData.profile_picture_url || null
          }));

          // Only fetch profile-specific data (publications, reading stats)
          await fetchPublications();
          await fetchReadingProgress();
        }

      } catch (error) {
        console.error("Failed to initialize profile:", error);
        setError(error.message);

        if (error.message.includes('401') || error.message.includes('403')) {
          clearAuth();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeProfile();
  }, [navigate, userId, isLoggedIn, contextUserData]);

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

      // Refresh UserContext so Navbar and other components get updated data
      refreshUserData();

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

      const profilePictureUrl = await uploadProfilePicture(file);

      setUserData(prev => ({
        ...prev,
        profile_picture_url: profilePictureUrl
      }));

      // Refresh UserContext so Navbar gets updated profile picture
      refreshUserData();

      alert('Profile picture updated successfully!');

    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert(`Failed to upload profile picture: ${error.message}`);
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
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
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
                      
                      {/* Camera icon with proper React icon */}
                      {isOwnProfile && (
                        <>
                          <div
                            className="avatar-edit-btn"
                            onClick={() => document.getElementById('profilePictureInput').click()}
                            style={{ 
                              cursor: 'pointer', 
                              opacity: uploadingPicture ? 0.5 : 1,
                              pointerEvents: uploadingPicture ? 'none' : 'auto'
                            }}
                            title="Upload profile picture"
                          >
                            {uploadingPicture ? (
                              <div className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden">Uploading...</span>
                              </div>
                            ) : (
                              <FiCamera size={18} />
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

                {/* Publications List */}
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
                      <div
                        key={pub.id || idx}
                        className={`publication-item ${idx < userData.publications.length - 1 ? 'border-bottom' : ''}`}
                      >
                        <div className="publication-title mb-2">{pub.title}</div>
                        <div className="publication-authors mb-1">{pub.authors}</div>
                        <div className="publication-journal mb-2">{pub.abstract}</div>
                        <div className="publication-meta">
                          <span className="publication-citations">Cited by {pub.citations || pub.citation_count || 0}</span>
                          <span className="mx-2">•</span>
                          <span>{pub.year}</span>
                          
                          {isOwnProfile && (
                            <>
                              <span className="mx-2">•</span>
                              <button
                                onClick={() => handleRemovePaper(pub.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#dc3545',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  padding: '0'
                                }}
                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                              >
                                Remove
                              </button>
                            </>
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
    </div>
  );
};

export default UserProfile;