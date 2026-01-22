import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './UserProfile.css';
import EditProfileModal from './EditProfileModal';
import UploadPaperModal from './UploadPaperModal';
import Navbar from "../components/Navbar";

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // User data with CLEAN defaults (no hardcoded values)
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
    papersRead: 0,
    thisMonth: 0,
    readingNow: 0,
    toRead: 0,
    inProgress: 0,
    completed: 0,
    mostCitedPapers: [],
    publications: [],
    profile_picture_url: null
  });

  /**
   * Fetch user publications and update state
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

      console.log('📚 Fetched publications:', publications.length);
    } catch (error) {
      console.error('Failed to fetch publications:', error);
      // Don't throw - publications are optional, profile should still load
    }
  };

  /**
   * Fetch user profile and publications on mount
   */
  useEffect(() => {
    const initializeProfile = async () => {
      const token = localStorage.getItem('access_token');

      // Redirect if no token
      if (!token) {
        console.log("No authentication token found");
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user profile
        const profile = await getUserProfile();

        // Update state with profile data
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

        // Fetch publications
        await fetchPublications();

      } catch (error) {
        console.error("Failed to initialize profile:", error);
        setError(error.message);

        // If authentication failed, clear token and redirect
        if (error.message.includes('401') || error.message.includes('403')) {
          clearAuth();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeProfile();
  }, [navigate]);

  /**
   * Handle profile update
   */
  const handleSaveProfile = async (updatedData) => {
    try {
      setUpdateLoading(true);

      // Update profile via API
      await updateUserProfile(updatedData);

      // Update local state
      setUserData(prev => ({
        ...prev,
        name: updatedData.name,
        affiliation: updatedData.affiliation,
        researchInterests: updatedData.researchInterests,
        institution: updatedData.affiliation
      }));

      console.log('✅ Profile updated successfully');
      alert('Profile updated successfully!');

    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error.message}`);
      throw error;
    } finally {
      setUpdateLoading(false);
    }
  };

  /**
   * Handle profile picture upload
   */
  const handleProfilePictureChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingPicture(true);

      // Upload picture via service
      const profilePictureUrl = await uploadProfilePicture(file);

      // Update local state
      setUserData(prev => ({
        ...prev,
        profile_picture_url: profilePictureUrl
      }));

      console.log('✅ Profile picture updated successfully');
      alert('Profile picture updated successfully!');

    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert(`Failed to upload profile picture: ${error.message}`);
    } finally {
      setUploadingPicture(false);
    }
  };

  /**
   * Handle paper upload confirmation
   */
  const handleConfirmPaper = async (paperDetails) => {
    try {
      console.log('✅ Paper added successfully, refreshing publications...');

      // Refresh publications list
      await fetchPublications();

      alert('Paper added to your publications successfully!');
    } catch (error) {
      console.error('Error refreshing publications:', error);
      alert('Paper may have been added, but failed to refresh the list. Please reload the page.');
    }
  };

  /**
   * Handle paper removal
   */
  const handleRemovePaper = async (userPaperId) => {
    if (!window.confirm('Are you sure you want to remove this paper?')) return;

    try {
      await removePublication(userPaperId);

      // ✅ IMMEDIATELY update local state
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
      await fetchPublications(); // Only fetch on error
      alert(`Failed to remove: ${error.message}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container mt-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <Navbar />
        <div className="container mt-5">
          <div className="alert alert-danger" role="alert">
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
                      <div
                        className="avatar-edit-btn"
                        onClick={() => document.getElementById('profilePictureInput').click()}
                        style={{ cursor: 'pointer', opacity: uploadingPicture ? 0.5 : 1 }}
                        title="Upload profile picture"
                      >
                        <span>{uploadingPicture ? '⏳' : '📷'}</span>
                      </div>
                      <input
                        type="file"
                        id="profilePictureInput"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleProfilePictureChange}
                        disabled={uploadingPicture}
                      />
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

                    {userData.email && (
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
                      <button
                        className="btn btn-outline-primary fw-semibold"
                        onClick={() => setIsEditModalOpen(true)}
                        disabled={updateLoading}
                      >
                        {updateLoading ? 'Updating...' : 'Edit Profile'}
                      </button>
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
                  <button
                    className="btn btn-primary fw-semibold d-flex align-items-center gap-2"
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    <span className="fs-5">+</span>
                    <span>Upload Paper</span>
                  </button>
                </div>

                {/* Publications List */}
                <div>
                  {userData.publications.length === 0 ? (
                    <div className="text-center py-5">
                      <p className="text-muted">No publications yet. Click "Upload Paper" to add your first paper!</p>
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
                          <span className="publication-citations">Cited by {pub.citations}</span>
                          <span className="mx-2">•</span>
                          <span>{pub.year}</span>
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
            {/* Overview Section */}
            <div className="card shadow-sm border-light mb-4">
              <div className="card-body p-4">
                <h3 className="sidebar-title">Overview</h3>
                <div className="row g-3 text-center">
                  <div className="col-3">
                    <div className="stat-number">{userData.totalPapers}</div>
                    <div className="stat-label">TOTAL<br />PAPERS</div>
                  </div>
                  <div className="col-3">
                    <div className="stat-number">{userData.papersRead}</div>
                    <div className="stat-label">PAPERS<br />READ</div>
                  </div>
                  <div className="col-3">
                    <div className="stat-number">{userData.thisMonth}</div>
                    <div className="stat-label">THIS<br />MONTH</div>
                  </div>
                  <div className="col-3">
                    <div className="stat-number">{userData.readingNow}</div>
                    <div className="stat-label">READING<br />NOW</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reading Progress Section */}
            <div className="card shadow-sm border-light mb-4">
              <div className="card-body p-4">
                <h3 className="sidebar-title">Reading Progress</h3>
                <div className="row g-3 text-center">
                  <div className="col-4">
                    <div className="stat-number">{userData.toRead}</div>
                    <div className="stat-label">TO READ</div>
                  </div>
                  <div className="col-4">
                    <div className="stat-number">{userData.inProgress}</div>
                    <div className="stat-label">IN<br />PROGRESS</div>
                  </div>
                  <div className="col-4">
                    <div className="stat-number">{userData.completed}</div>
                    <div className="stat-label">COMPLETED</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Most Cited Papers Section */}
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
                        {paper.year} • <strong>{paper.citations} citations</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userData={userData}
        onSave={handleSaveProfile}
      />

      {/* Upload Paper Modal */}
      <UploadPaperModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onConfirm={handleConfirmPaper}
      />
    </div>
  );
};

export default UserProfile;