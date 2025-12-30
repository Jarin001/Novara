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
      }}
    >
      {/* LEFT */}
      <div style={{ fontSize: "24px", fontWeight: "bold" }}>
        NOVARA
      </div>

      {/* RIGHT */}
      <div style={{ display: "flex", gap: "24px", fontSize: "16px" }}>
        <span style={{ cursor: "pointer" }} onClick={() => navigate('/search')}>Search</span>
        <span style={{ cursor: "pointer" }}>Sign In</span>
        <span style={{ cursor: "pointer" }}>Create Account</span>
        <span style={{ cursor: "pointer" }}>About Us</span>
      </div>
    </div>
  );
};

export default Navbar;
