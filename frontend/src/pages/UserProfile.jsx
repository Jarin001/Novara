import React from "react";
import { useNavigate } from "react-router-dom";
import './UserProfile.css';

const Navbar = () => {
  const navigate = useNavigate();
  return (
    <nav className="navbar navbar-dark bg-dark fixed-top shadow-sm">
      <div className="container-fluid px-5">
        <span className="navbar-brand fs-4 fw-bold ls-1">NOVARA</span>
        <div className="d-flex gap-4">
          <span className="nav-link-item" onClick={() => navigate('/search')}>Search</span>
          <span className="nav-link-item">Sign In</span>
          <span className="nav-link-item">Log In</span>
          <span className="nav-link-item">About Us</span>
        </div>
      </div>
    </nav>
  );
};

const UserProfile = () => {
  const navigate = useNavigate();
  
  const userData = {
    name: "SANJANA AFREEN",
    id: "220042106",
    institution: "Islamic University of Technology",
    department: "Department of Computer Science and Engineering",
    email: "iut-dhaka.edu",
    researchInterests: ["Machine Learning", "Deep Learning", "Natural Language Processing"],
    joinedDate: "September 2022",
    totalPapers: 47,
    papersRead: 23,
    thisMonth: 15,
    readingNow: 3,
    toRead: 24,
    inProgress: 8,
    completed: 15,
    mostCitedPapers: [
      {
        title: "Machine Learning Approaches for Climate Prediction",
        authors: "Afreen, S., Rahman, M., et al.",
        year: 2024,
        citations: 127
      },
      {
        title: "Deep Learning Applications in Medical Imaging",
        authors: "Afreen, S., Khan, A.",
        year: 2023,
        citations: 89
      },
      {
        title: "Natural Language Processing for Sentiment Analysis",
        authors: "Afreen, S.",
        year: 2023,
        citations: 54
      }
    ],
    publications: [
      { title: "Mcgraw-hill science", authors: "TM Mitchell, M Learning", journal: "Engineering/Math 1, 27", citations: 121, year: 1997 },
      { title: "Tom mitchell", authors: "M Learning", journal: "Publisher: McGraw Hill, 31", citations: 64, year: 1997 },
      { title: "McGraw-Hill", authors: "M Learning", journal: "New York", citations: 57, year: 1997 },
      { title: "Markov logic networks", authors: "R Matthew, D Pedro, M Learning", journal: "Machine learning 62 (1-2), 107-136", citations: 27, year: 2006 }
    ]
  };

  return (
    <div className="bg-light min-vh-100">
      <Navbar />
      
      <div className="container-fluid px-5" style={{ paddingTop: '80px' }}>
        <div className="row g-4 py-4">
          
          {/* LEFT SECTION - 8 COLUMNS */}
          <div className="col-lg-8">
            {/* Profile Section */}
            <div className="card shadow-sm border-light mb-4">
              <div className="card-body p-4">
                <div className="row">
                  {/* Avatar */}
                  <div className="col-auto">
                    <div className="profile-avatar position-relative">
                      <div className="avatar-circle">S</div>
                      <div className="avatar-edit-btn">
                        <span>📷</span>
                      </div>
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
                        <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14.4c-3.5 0-6.4-2.9-6.4-6.4S4.5 1.6 8 1.6s6.4 2.9 6.4 6.4-2.9 6.4-6.4 6.4z"/>
                        <path d="M10.7 6.3L7.5 9.5 5.3 7.3c-.3-.3-.8-.3-1.1 0s-.3.8 0 1.1l2.8 2.8c.3.3.8.3 1.1 0l3.8-3.8c.3-.3.3-.8 0-1.1-.3-.3-.9-.3-1.2 0z"/>
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
                      <button className="btn btn-outline-primary fw-semibold">
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
                  <button className="btn btn-primary fw-semibold d-flex align-items-center gap-2">
                    <span className="fs-5">+</span>
                    <span>Upload Paper</span>
                  </button>
                </div>

                {/* Publications List */}
                <div>
                  {userData.publications.map((pub, idx) => (
                    <div key={idx} className={`publication-item ${idx < userData.publications.length - 1 ? 'border-bottom' : ''}`}>
                      <div className="publication-title mb-2">{pub.title}</div>
                      <div className="publication-authors mb-1">{pub.authors}</div>
                      <div className="publication-journal mb-2">{pub.journal}</div>
                      <div className="publication-meta">
                        <span className="publication-citations">Cited by {pub.citations}</span>
                        <span className="mx-2">•</span>
                        <span>{pub.year}</span>
                      </div>
                    </div>
                  ))}
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
                    <div className="stat-label">TOTAL<br/>PAPERS</div>
                  </div>
                  <div className="col-3">
                    <div className="stat-number">{userData.papersRead}</div>
                    <div className="stat-label">PAPERS<br/>READ</div>
                  </div>
                  <div className="col-3">
                    <div className="stat-number">{userData.thisMonth}</div>
                    <div className="stat-label">THIS<br/>MONTH</div>
                  </div>
                  <div className="col-3">
                    <div className="stat-number">{userData.readingNow}</div>
                    <div className="stat-label">READING<br/>NOW</div>
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
                    <div className="stat-label">IN<br/>PROGRESS</div>
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
                {userData.mostCitedPapers.map((paper, idx) => (
                  <div key={idx} className={`cited-paper ${idx < userData.mostCitedPapers.length - 1 ? 'border-bottom' : ''}`}>
                    <div className="cited-paper-title mb-2">{paper.title}</div>
                    <div className="cited-paper-authors mb-1">{paper.authors}</div>
                    <div className="cited-paper-meta">
                      {paper.year} • <strong>{paper.citations} citations</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;