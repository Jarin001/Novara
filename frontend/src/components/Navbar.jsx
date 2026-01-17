import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleAboutClick = () => {
    if (location.pathname === '/') {
      // If already on home page, scroll to features
      const featuresSection = document.getElementById('features-section');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to home page with hash for features section
      navigate('/#features');
    }
  };

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
      {/* LEFT */}
      <div style={{ fontSize: "24px", fontWeight: "bold" }}>
        NOVARA
      </div>

      {/* RIGHT */}
      <div style={{ display: "flex", gap: "24px", fontSize: "16px" }}>
        <span style={{ cursor: "pointer" }} onClick={() => navigate('/search')}>Search</span>
        <span style={{ cursor: "pointer" }} onClick={handleAboutClick}>About</span>
        <span style={{ cursor: "pointer" }}>Sign In</span>
        <span style={{ cursor: "pointer" }}>Create Account</span>
        
        {/* <span style={{ cursor: "pointer" }}>About Us</span> */}
      </div>
    </div>
  );
};

export default Navbar;