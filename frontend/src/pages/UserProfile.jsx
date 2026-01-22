import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './UserProfile.css';
import EditProfileModal from './EditProfileModal';
import UploadPaperModal from './UploadPaperModal';
import Navbar from "../components/Navbar";

// Add this CSS for the abstract display
const additionalStyles = `
  .publication-journal {
    font-size: 14px;
    color: #5f6368;
    line-height: 1.6;
    max-height: 4.8em; /* ~3 lines */
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [userData, setUserData] = useState({
    name: "SANJANA AFREEN",
    id: "220042106",
    institution: "Islamic University of Technology",
    department: "Department of Computer Science and Engineering",
    email: "iut-dhaka.edu",
    affiliation: "Islamic University of Technology",
    researchInterests: ["Machine Learning", "Deep Learning", "Natural Language Processing"],
    joinedDate: "September 2022",
    totalPapers: 0,
    papersRead: 23,
    thisMonth: 15,
    readingNow: 3,
    toRead: 24,
    inProgress: 8,
    completed: 15,
    mostCitedPapers: [], // Will be calculated from actual publications
    publications: []
  });

  // Function to fetch publications from backend
  const fetchUserPublications = async (token) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/papers/publications`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        console.log('📚 Fetched publications:', data.publications.length);

        // Transform backend publications to match UI format
        const transformedPublications = data.publications.map(pub => ({
          id: pub.id, // user_papers id for deletion
          title: pub.title,
          authors: pub.authors && pub.authors.length > 0 ? pub.authors.join(', ') : 'Unknown Authors',
          abstract: pub.abstract || 'No abstract available',
          citations: pub.citation_count || 0,
          year: pub.year || (pub.published_date ? new Date(pub.published_date).getFullYear() : 'N/A')
        }));

        // Calculate most cited papers (top 3)
        const sortedByCitations = [...transformedPublications]
          .sort((a, b) => b.citations - a.citations)
          .slice(0, 3);

        // Update state with real publications and most cited
        setUserData(prev => ({
          ...prev,
          publications: transformedPublications,
          totalPapers: transformedPublications.length,
          mostCitedPapers: sortedByCitations
        }));
      }
    } catch (error) {
      console.error('Error fetching publications:', error);
    }
  };

  // Check authentication and fetch user data
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');

      // If no token, redirect to login
      if (!token) {
        console.log("No authentication token found");
        navigate('/login');
        return;
      }

      try {
        // Verify token with YOUR backend
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          // Token invalid or expired
          localStorage.removeItem('access_token');
          navigate('/login');
          return;
        }

        const data = await response.json();

        // Set user from YOUR backend response
        setUser({
          id: data.user?.id,
          email: data.user?.email,
          name: data.user?.name
        });

        // Update userData with real backend data
        if (data.user) {
          setUserData(prev => ({
            ...prev,
            name: data.user.name || prev.name,
            email: data.user.email || prev.email,
            affiliation: data.user.affiliation || prev.affiliation,
            institution: data.user.affiliation || prev.institution,
            researchInterests: data.user.research_interests || prev.researchInterests,
            joinedDate: data.user.created_at
              ? new Date(data.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : prev.joinedDate,
            profile_picture_url: data.user.profile_picture_url || null
          }));
        }

        // Fetch user's publications from backend
        await fetchUserPublications(token);

        setLoading(false);

      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem('access_token');
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSaveProfile = async (updatedData) => {
    try {
      const token = localStorage.getItem('access_token');

      // Call your backend API to update profile
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        // Update local state with new data
        setUserData(prev => ({
          ...prev,
          name: updatedData.name,
          affiliation: updatedData.affiliation,
          researchInterests: updatedData.researchInterests,
          institution: updatedData.affiliation
        }));

        console.log('Profile updated:', updatedData);
        alert('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Error: ${error.message}`);
      throw error;
    }
  };

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;

        const token = localStorage.getItem('access_token');

        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile-picture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            imageBase64: base64String,
            fileName: file.name
          })
        });

        if (response.ok) {
          const data = await response.json();

          // Update local state with new profile picture URL
          setUserData(prev => ({
            ...prev,
            profile_picture_url: data.profile_picture_url
          }));

          alert('Profile picture updated successfully!');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload profile picture');
        }
      };

      reader.onerror = () => {
        alert('Error reading file');
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleConfirmPaper = async (paperDetails) => {
    try {
      console.log('✅ Paper added successfully, refreshing publications list...');

      // Refresh the publications list from backend
      await fetchUserPublications();

      alert('Paper added to your publications successfully!');

    } catch (error) {
      console.error('❌ Error refreshing publications:', error);
      alert('Paper was added but failed to refresh the list. Please reload the page.');
    }
  };

  const handleRemovePaper = async (publicationId) => {
    if (!window.confirm('Are you sure you want to remove this publication from your profile?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/papers/publications/${publicationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove publication');
      }

      // Immediate UI update - this WILL work
      setUserData(prev => ({
        ...prev,
        publications: prev.publications.filter(pub => pub.id !== publicationId),
        totalPapers: prev.publications.length - 1,
        mostCitedPapers: prev.publications
          .filter(pub => pub.id !== publicationId)
          .sort((a, b) => b.citations - a.citations)
          .slice(0, 3)
      }));

      alert('Publication removed successfully!');

    } catch (error) {
      console.error('Error removing publication:', error);
      alert('Failed to remove publication. Please try again.');
    }
  };


  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container mt-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container-fluid py-4 px-4">
        <div className="row g-4">
          {/* LEFT SECTION - 8 COLUMNS */}
          <div className="col-lg-8">
            {/* Profile Header Card */}
            <div className="card shadow-sm border-light mb-4">
              <div className="card-body p-4">
                <div className="row align-items-center">
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
                        <div className="avatar-circle">{userData.name.charAt(0)}</div>
                      )}
                      <div
                        className="avatar-edit-btn"
                        onClick={() => document.getElementById('profilePictureInput').click()}
                        style={{ cursor: 'pointer' }}
                      >
                        <span>📷</span>
                      </div>
                      <input
                        type="file"
                        id="profilePictureInput"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleProfilePictureChange}
                      />
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="col">
                    <div className="d-flex align-items-baseline gap-3 mb-2">
                      <h2 className="profile-name mb-0">{userData.name}</h2>
                      <span className="profile-id">{userData.id}</span>
                    </div>

                    <p className="fw-semibold text-dark mb-2">{userData.institution}</p>
                    <p className="text-muted mb-2">{userData.department}</p>

                    <div className="d-flex align-items-center gap-2 mb-3 text-muted">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="#34a853">
                        <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14.4c-3.5 0-6.4-2.9-6.4-6.4S4.5 1.6 8 1.6s6.4 2.9 6.4 6.4-2.9 6.4-6.4 6.4z" />
                        <path d="M10.7 6.3L7.5 9.5 5.3 7.3c-.3-.3-.8-.3-1.1 0s-.3.8 0 1.1l2.8 2.8c.3.3.8.3 1.1 0l3.8-3.8c.3-.3.3-.8 0-1.1-.3-.3-.9-.3-1.2 0z" />
                      </svg>
                      <span className="small">Verified email at {userData.email}</span>
                    </div>

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

                    <div className="d-flex gap-3 align-items-center">
                      <button
                        className="btn btn-outline-primary fw-semibold"
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        Edit Profile
                      </button>
                      <span className="text-muted small">
                        Member since {userData.joinedDate}
                      </span>
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
                  <button className="btn btn-primary fw-semibold d-flex align-items-center gap-2" onClick={() => setIsUploadModalOpen(true)}>
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
                      <div key={idx} className={`publication-item ${idx < userData.publications.length - 1 ? 'border-bottom' : ''}`}>
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
                    <div key={idx} className={`cited-paper ${idx < userData.mostCitedPapers.length - 1 ? 'border-bottom' : ''}`}>
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