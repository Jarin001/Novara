import React from "react";
import heroImage from "../images/Find-Recent-Research-Papers.png";

const HeroSection = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        paddingTop: "100px", // space for navbar
        backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div style={{ color: "#fff", marginLeft: "60px" }}>
        <h1 style={{ fontSize: "48px", fontWeight: "bold" }}>
          Your All-in-One Research Companion
        </h1>
      </div>
    </div>
  );
};

export default HeroSection;
