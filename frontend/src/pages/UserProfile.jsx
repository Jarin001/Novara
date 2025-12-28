import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 1000,
        backgroundColor: "#000",
        color: "#fff",
        padding: "16px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
      }}
    >
      <div style={{ fontSize: "24px", fontWeight: "bold", letterSpacing: "1px" }}>
        NOVARA
      </div>
      <div style={{ display: "flex", gap: "32px", fontSize: "16px" }}>
        <span style={{ cursor: "pointer", transition: "opacity 0.2s" }} onClick={() => navigate('/search')}>Search</span>
        <span style={{ cursor: "pointer", transition: "opacity 0.2s" }}>Sign In</span>
        <span style={{ cursor: "pointer", transition: "opacity 0.2s" }}>Log In</span>
        <span style={{ cursor: "pointer", transition: "opacity 0.2s" }}>About Us</span>
      </div>
    </div>
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
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Navbar />
      
      <div style={{ 
        maxWidth: "1400px", 
        margin: "0 auto", 
        paddingTop: "80px",
        display: "flex",
        gap: "24px",
        padding: "80px 40px 40px 40px"
      }}>
        
        {/* LEFT SECTION - 2 COLUMNS */}
        <div style={{ flex: "0 0 calc(66.666% - 12px)" }}>
          {/* Profile Section - Horizontal Layout */}
          <div style={{ 
            backgroundColor: "#fff", 
            padding: "32px",
            borderRadius: "12px",
            marginBottom: "24px",
            display: "flex",
            gap: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e8eaed"
          }}>
            {/* Left: Avatar */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: "130px",
                height: "130px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "52px",
                color: "#fff",
                position: "relative",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
              }}>
                S
                <div style={{
                  position: "absolute",
                  bottom: "5px",
                  right: "5px",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  transition: "transform 0.2s"
                }}>
                  <span style={{ fontSize: "18px" }}>📷</span>
                </div>
              </div>
            </div>

            {/* Right: Profile Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
                <h2 style={{ 
                  fontSize: "26px", 
                  margin: "0", 
                  color: "#1f1f1f",
                  fontWeight: "500",
                  letterSpacing: "-0.5px"
                }}>
                  {userData.name}
                </h2>
                <span style={{ 
                  fontSize: "18px", 
                  color: "#5f6368",
                  fontWeight: "400"
                }}>
                  {userData.id}
                </span>
              </div>
              
              <p style={{ fontSize: "15px", color: "#202124", margin: "6px 0", fontWeight: "500" }}>
                {userData.institution}
              </p>
              
              <p style={{ fontSize: "14px", color: "#5f6368", margin: "6px 0" }}>
                {userData.department}
              </p>

              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px",
                margin: "8px 0",
                fontSize: "14px",
                color: "#5f6368"
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#34a853">
                  <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14.4c-3.5 0-6.4-2.9-6.4-6.4S4.5 1.6 8 1.6s6.4 2.9 6.4 6.4-2.9 6.4-6.4 6.4z"/>
                  <path d="M10.7 6.3L7.5 9.5 5.3 7.3c-.3-.3-.8-.3-1.1 0s-.3.8 0 1.1l2.8 2.8c.3.3.8.3 1.1 0l3.8-3.8c.3-.3.3-.8 0-1.1-.3-.3-.9-.3-1.2 0z"/>
                </svg>
                <span>Verified email at {userData.email}</span>
              </div>

              <div style={{ marginTop: "16px" }}>
                <div style={{ fontSize: "13px", color: "#5f6368", marginBottom: "8px", fontWeight: "500" }}>
                  Research Interests
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {userData.researchInterests.map((interest, idx) => (
                    <span key={idx} style={{
                      fontSize: "13px",
                      color: "#1a73e8",
                      padding: "6px 14px",
                      backgroundColor: "#e8f0fe",
                      borderRadius: "16px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      border: "1px solid #d2e3fc"
                    }}>
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
                <button style={{
                  padding: "9px 20px",
                  backgroundColor: "#fff",
                  border: "2px solid #1a73e8",
                  borderRadius: "6px",
                  color: "#1a73e8",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                }}>
                  Edit Profile
                </button>
                <span style={{ fontSize: "13px", color: "#5f6368" }}>
                  Member since {userData.joinedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Publications Section */}
          <div style={{ 
            backgroundColor: "#fff", 
            padding: "28px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e8eaed"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "2px solid #e8eaed"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <h2 style={{ 
                  fontSize: "22px", 
                  margin: "0", 
                  color: "#1f1f1f",
                  fontWeight: "500"
                }}>
                  Publications
                </h2>
                <span style={{
                  backgroundColor: "#f1f3f4",
                  color: "#5f6368",
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: "600"
                }}>
                  {userData.publications.length} papers
                </span>
              </div>
              <button style={{
                padding: "9px 20px",
                backgroundColor: "#1a73e8",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "background-color 0.2s",
                boxShadow: "0 2px 4px rgba(26, 115, 232, 0.3)"
              }}>
                <span style={{ fontSize: "16px" }}>+</span>
                <span>Upload Paper</span>
              </button>
            </div>

            {/* Publications List */}
            <div>
              {userData.publications.map((pub, idx) => (
                <div key={idx} style={{
                  padding: "20px 0",
                  borderBottom: idx < userData.publications.length - 1 ? "1px solid #f1f3f4" : "none",
                  transition: "background-color 0.2s"
                }}>
                  <div style={{ 
                    color: "#1a73e8", 
                    fontSize: "17px",
                    cursor: "pointer",
                    marginBottom: "8px",
                    fontWeight: "500",
                    lineHeight: "1.4"
                  }}>
                    {pub.title}
                  </div>
                  <div style={{ 
                    fontSize: "14px", 
                    color: "#5f6368",
                    marginBottom: "5px",
                    lineHeight: "1.5"
                  }}>
                    {pub.authors}
                  </div>
                  <div style={{ 
                    fontSize: "14px", 
                    color: "#5f6368",
                    marginBottom: "8px",
                    lineHeight: "1.5"
                  }}>
                    {pub.journal}
                  </div>
                  <div style={{ 
                    fontSize: "14px", 
                    color: "#5f6368",
                    display: "flex",
                    gap: "16px",
                    alignItems: "center"
                  }}>
                    <span style={{ 
                      color: "#1a73e8", 
                      cursor: "pointer",
                      fontWeight: "500"
                    }}>
                      Cited by {pub.citations}
                    </span>
                    <span>•</span>
                    <span>{pub.year}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR - 1 COLUMN */}
        <div style={{ flex: "0 0 calc(33.333% - 12px)" }}>
          {/* Overview Section */}
          <div style={{ 
            backgroundColor: "#fff", 
            padding: "24px",
            borderRadius: "12px",
            marginBottom: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e8eaed"
          }}>
            <h3 style={{ 
              fontSize: "18px", 
              margin: "0 0 20px 0",
              color: "#1f1f1f",
              borderBottom: "3px solid #1a73e8",
              paddingBottom: "10px",
              fontWeight: "500"
            }}>
              Overview
            </h3>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
              textAlign: "center"
            }}>
              <div>
                <div style={{ fontSize: "36px", fontWeight: "600", color: "#202124" }}>
                  {userData.totalPapers}
                </div>
                <div style={{ fontSize: "11px", color: "#5f6368", marginTop: "6px", fontWeight: "500", lineHeight: "1.3" }}>
                  TOTAL<br/>PAPERS
                </div>
              </div>
              <div>
                <div style={{ fontSize: "36px", fontWeight: "600", color: "#202124" }}>
                  {userData.papersRead}
                </div>
                <div style={{ fontSize: "11px", color: "#5f6368", marginTop: "6px", fontWeight: "500", lineHeight: "1.3" }}>
                  PAPERS<br/>READ
                </div>
              </div>
              <div>
                <div style={{ fontSize: "36px", fontWeight: "600", color: "#202124" }}>
                  {userData.thisMonth}
                </div>
                <div style={{ fontSize: "11px", color: "#5f6368", marginTop: "6px", fontWeight: "500", lineHeight: "1.3" }}>
                  THIS<br/>MONTH
                </div>
              </div>
              <div>
                <div style={{ fontSize: "36px", fontWeight: "600", color: "#202124" }}>
                  {userData.readingNow}
                </div>
                <div style={{ fontSize: "11px", color: "#5f6368", marginTop: "6px", fontWeight: "500", lineHeight: "1.3" }}>
                  READING<br/>NOW
                </div>
              </div>
            </div>
          </div>

          {/* Reading Progress Section */}
          <div style={{ 
            backgroundColor: "#fff", 
            padding: "24px",
            borderRadius: "12px",
            marginBottom: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e8eaed"
          }}>
            <h3 style={{ 
              fontSize: "18px", 
              margin: "0 0 20px 0",
              color: "#1f1f1f",
              borderBottom: "3px solid #1a73e8",
              paddingBottom: "10px",
              fontWeight: "500"
            }}>
              Reading Progress
            </h3>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
              textAlign: "center"
            }}>
              <div>
                <div style={{ fontSize: "36px", fontWeight: "600", color: "#202124" }}>
                  {userData.toRead}
                </div>
                <div style={{ fontSize: "12px", color: "#5f6368", marginTop: "6px", fontWeight: "500" }}>
                  TO READ
                </div>
              </div>
              <div>
                <div style={{ fontSize: "36px", fontWeight: "600", color: "#202124" }}>
                  {userData.inProgress}
                </div>
                <div style={{ fontSize: "12px", color: "#5f6368", marginTop: "6px", fontWeight: "500", lineHeight: "1.3" }}>
                  IN<br/>PROGRESS
                </div>
              </div>
              <div>
                <div style={{ fontSize: "36px", fontWeight: "600", color: "#202124" }}>
                  {userData.completed}
                </div>
                <div style={{ fontSize: "12px", color: "#5f6368", marginTop: "6px", fontWeight: "500" }}>
                  COMPLETED
                </div>
              </div>
            </div>
          </div>

          {/* Most Cited Papers Section */}
          <div style={{ 
            backgroundColor: "#fff", 
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e8eaed"
          }}>
            <h3 style={{ 
              fontSize: "18px", 
              margin: "0 0 20px 0",
              color: "#1f1f1f",
              borderBottom: "3px solid #1a73e8",
              paddingBottom: "10px",
              fontWeight: "500"
            }}>
              Most Cited Papers
            </h3>
            {userData.mostCitedPapers.map((paper, idx) => (
              <div key={idx} style={{ 
                marginBottom: "20px",
                paddingBottom: "16px",
                borderBottom: idx < userData.mostCitedPapers.length - 1 ? "1px solid #f1f3f4" : "none"
              }}>
                <div style={{ 
                  fontSize: "14px", 
                  color: "#1a73e8",
                  marginBottom: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                  lineHeight: "1.4"
                }}>
                  {paper.title}
                </div>
                <div style={{ fontSize: "13px", color: "#5f6368", lineHeight: "1.5" }}>
                  {paper.authors}
                </div>
                <div style={{ fontSize: "13px", color: "#5f6368", marginTop: "4px" }}>
                  {paper.year} • <strong style={{ color: "#202124" }}>{paper.citations} citations</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;