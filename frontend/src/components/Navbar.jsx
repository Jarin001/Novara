import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Get user data from context instead of fetching
  const { userData, isLoggedIn, logout: contextLogout } = useUser();

  const handleAboutClick = () => {
    if (location.pathname === '/') {
      const featuresSection = document.getElementById('features-section');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#features');
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignUp = () => {
    navigate('/register'); // Navigate to register page
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleUserClick = () => {
    toggleDropdown();
  };

  const handleLogout = () => {
    // Use context logout function
    contextLogout();
    setDropdownOpen(false);
    
    // Navigate to home and reload
    navigate('/');
    window.location.reload();
  };

  const handleLibraryClick = () => {
    navigate('/library');
    setDropdownOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setDropdownOpen(false);
  };

  const handleSettingsClick = () => {
    console.log("Settings clicked");
    setDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('.user-dropdown-container');
      const userIcon = document.querySelector('.user-icon');
      
      if (dropdownOpen && dropdown && userIcon && 
          !dropdown.contains(event.target) && 
          !userIcon.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 1000,
        backgroundColor: "#3E513E",
        color: "#fff",
        padding: "16px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* LEFT - Logo */}
      <div 
        style={{ fontSize: "24px", fontWeight: "bold", cursor: "pointer" }}
        onClick={() => navigate('/')}
      >
        NOVARA
      </div>

      {/* RIGHT - Navigation Items */}
      <div style={{ display: "flex", gap: "24px", fontSize: "16px", alignItems: "center" }}>
        <span style={{ cursor: "pointer" }} onClick={() => navigate('/search')}>Search</span>
        <span style={{ cursor: "pointer" }} onClick={handleAboutClick}>About</span>
        
        {/* Conditional rendering based on login state */}
        {!isLoggedIn ? (
          <>
            <span style={{ cursor: "pointer" }} onClick={handleLogin}>Sign In</span>
            <span style={{ cursor: "pointer" }} onClick={handleSignUp}>Create Account</span>
          </>
        ) : (
          <div className="user-dropdown-container" style={{ position: "relative", display: "flex", alignItems: "center" }}>
            {/* User icon */}
            <div 
              className="user-icon"
              onClick={handleUserClick}
              style={{
                cursor: "pointer",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: userData.profile_picture_url ? "transparent" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                border: userData.profile_picture_url ? "2px solid #fff" : "none",
              }}
              title="User Profile"
            >
              {userData.profile_picture_url ? (
                <img 
                  src={userData.profile_picture_url} 
                  alt={userData.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    // Fallback to default icon if image fails to load
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                /* Simple user icon using SVG */
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" 
                    stroke="#3E513E" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M20 21C20 18.8783 19.1571 16.8434 17.6569 15.3431C16.1566 13.8429 14.1217 13 12 13C9.87827 13 7.84344 13.8429 6.34315 15.3431C4.84285 16.8434 4 18.8783 4 21" 
                    stroke="#3E513E" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            
            {/* Dropdown menu - controlled by state */}
            {dropdownOpen && (
              <div 
                className="user-dropdown"
                style={{
                  position: "absolute",
                  top: "50px",
                  right: 0,
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  minWidth: "160px",
                  padding: "8px 0",
                  zIndex: 1001,
                  animation: "fadeIn 0.2s ease",
                }}
              >
                <div style={{
                  padding: "10px 16px",
                  color: "#333",
                  fontSize: "14px",
                  borderBottom: "1px solid #f0f0f0",
                  fontWeight: "600",
                }}>
                  {userData.name}
                </div>
                
                <div 
                  style={{
                    padding: "8px 16px",
                    color: "#666",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                  onClick={handleProfileClick}
                >
                  Profile
                </div>
                
                {/* My Library option */}
                <div 
                  style={{
                    padding: "8px 16px",
                    color: "#666",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                  onClick={handleLibraryClick}
                >
                  My Library
                </div>
                
                <div 
                  style={{
                    padding: "8px 16px",
                    color: "#666",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                  onClick={handleSettingsClick}
                >
                  Settings
                </div>
                
                <div 
                  style={{
                    padding: "8px 16px",
                    color: "#d32f2f",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                    borderTop: "1px solid #f0f0f0",
                    marginTop: "4px",
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#ffebee"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                  onClick={handleLogout}
                >
                  Logout
                </div>
              </div>
            )}
            
            {/* CSS for fadeIn animation */}
            <style>{`
              @keyframes fadeIn {
                from {
                  opacity: 0;
                  transform: translateY(-10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;