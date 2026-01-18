import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";

const Home = () => {
  useEffect(() => {
    // Check if URL has #features hash
    if (window.location.hash === '#features') {
      const featuresSection = document.getElementById('features-section');
      if (featuresSection) {
        // Small timeout to ensure DOM is ready
        setTimeout(() => {
          featuresSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  return (
    <>
      <Navbar />
      <HeroSection />
      <div id="features-section">
        <FeaturesSection />
      </div>
    </>
  );
};

export default Home;