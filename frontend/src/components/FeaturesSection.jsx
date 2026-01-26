import React from "react";
import aiSummaryImage from "../images/aiSummary.png";
import citationImage from "../images/citation.png";
import libraryImage from "../images/library.png";
import searchImage from "../images/search.png";
import userNoteImage from "../images/userNote.png";
import userProfileImage from "../images/userProfile.png";
import readingTrackerImage from "../images/readingTracker.png";

const features = [
  {
    title: "AI-Based Paper Summarization",
    description:
      "NOVARA uses intelligent analysis to generate concise summaries of research papers, helping you quickly understand key ideas, methodologies, and conclusions.",
    imagePosition: "left",
    image: aiSummaryImage,
  },
  {
    title: "Collaboration Tools",
    description:
      "Collaborate seamlessly with peers by sharing papers, notes, and annotations. NOVARA supports teamwork for students, researchers, and academic groups.",
    imagePosition: "right",
    image: null,
  },
  {
    title: "User-Driven Paper Summaries",
    description:
      "Create, edit, and share your own paper summaries. NOVARA empowers users to contribute insights and interpretations to enrich research understanding.",
    imagePosition: "left",
    image: userNoteImage,
  },
  {
    title: "Reading Tracker",
    description:
      "Track what you have read, what you are currently reading, and what to read next. NOVARA helps you manage reading progress efficiently.",
    imagePosition: "right",
    image: readingTrackerImage,
  },
  {
    title: "Paper Management",
    description:
      "Organize papers into collections, folders, and tags. NOVARA makes managing large research libraries simple and intuitive.",
    imagePosition: "left",
    image: libraryImage,
  },
  {
    title: "User Profile Creation",
    description:
      "Create a personalized research profile that reflects your interests, saved papers, and activity, enabling better recommendations and collaboration.",
    imagePosition: "right",
    image: userProfileImage,
  },
  {
    title: "Citation Management",
    description:
      "Generate citations and bibliographies instantly in multiple styles. NOVARA ensures accurate and consistent referencing for academic writing.",
    imagePosition: "left",
    image: citationImage,
  },
  {
    title: "Paper Discovery",
    description:
      "Discover relevant research papers through smart search and recommendations. NOVARA keeps you updated with the latest work in your field.",
    imagePosition: "right",
    image: searchImage,
  },
];

const FeaturesSection = () => {
  return (
    <div style={{ padding: "80px 60px", backgroundColor: "#fff" }}>
      {features.map((feature, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            flexDirection:
              feature.imagePosition === "left" ? "row" : "row-reverse",
            alignItems: "center",
            gap: "60px",
            marginBottom: "120px",
          }}
        >
          {/* IMAGE PLACEHOLDER OR ACTUAL IMAGE */}
          <div
            style={{
              flex: 1,
              height: feature.image ? "600px" : "260px",
              backgroundColor: feature.image ? "#fff" : "#f1f3f5",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {feature.image ? (
              <img
                src={feature.image}
                alt={feature.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <span style={{ color: "#999", fontSize: "14px" }}>
                Image Placeholder
              </span>
            )}
          </div>

          {/* TEXT */}
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontSize: "32px",
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              {feature.title}
            </h2>
            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.7",
                color: "#555",
              }}
            >
              {feature.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeaturesSection;