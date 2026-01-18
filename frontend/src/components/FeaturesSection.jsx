import React from "react";

const features = [
  {
    title: "AI-Based Paper Summarization",
    description:
      "NOVARA uses intelligent analysis to generate concise summaries of research papers, helping you quickly understand key ideas, methodologies, and conclusions.",
    imagePosition: "left",
  },
  {
    title: "Collaboration Tools",
    description:
      "Collaborate seamlessly with peers by sharing papers, notes, and annotations. NOVARA supports teamwork for students, researchers, and academic groups.",
    imagePosition: "right",
  },
  {
    title: "User-Driven Paper Summaries",
    description:
      "Create, edit, and share your own paper summaries. NOVARA empowers users to contribute insights and interpretations to enrich research understanding.",
    imagePosition: "left",
  },
  {
    title: "Reading Tracker",
    description:
      "Track what you have read, what you are currently reading, and what to read next. NOVARA helps you manage reading progress efficiently.",
    imagePosition: "right",
  },
  {
    title: "Paper Management",
    description:
      "Organize papers into collections, folders, and tags. NOVARA makes managing large research libraries simple and intuitive.",
    imagePosition: "left",
  },
  {
    title: "User Profile Creation",
    description:
      "Create a personalized research profile that reflects your interests, saved papers, and activity, enabling better recommendations and collaboration.",
    imagePosition: "right",
  },
  {
    title: "Citation Management",
    description:
      "Generate citations and bibliographies instantly in multiple styles. NOVARA ensures accurate and consistent referencing for academic writing.",
    imagePosition: "left",
  },
  {
    title: "Paper Discovery",
    description:
      "Discover relevant research papers through smart search and recommendations. NOVARA keeps you updated with the latest work in your field.",
    imagePosition: "right",
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
          {/* IMAGE PLACEHOLDER */}
          <div
            style={{
              flex: 1,
              height: "260px",
              backgroundColor: "#f1f3f5",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
              fontSize: "14px",
            }}
          >
            Image Placeholder
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