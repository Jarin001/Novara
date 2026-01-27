import React from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Users, 
  FileText, 
  BookOpen, 
  FolderOpen, 
  User, 
  Quote, 
  Search 
} from "lucide-react";

const features = [
  {
    title: "AI-Based Paper Summarization",
    description:
      "NOVARA uses intelligent analysis to generate concise summaries of research papers, helping you quickly understand key ideas, methodologies, and conclusions.",
    icon: Sparkles,
    color: "#22c55e",
  },
  {
    title: "Collaboration Tools",
    description:
      "Collaborate seamlessly with peers by sharing papers, notes, and annotations. NOVARA supports teamwork for students, researchers, and academic groups.",
    icon: Users,
    color: "#10b981",
  },
  {
    title: "User-Driven Paper Summaries",
    description:
      "Create, edit, and share your own paper summaries. NOVARA empowers users to contribute insights and interpretations to enrich research understanding.",
    icon: FileText,
    color: "#14b8a6",
  },
  {
    title: "Reading Tracker",
    description:
      "Track what you have read, what you are currently reading, and what to read next. NOVARA helps you manage reading progress efficiently.",
    icon: BookOpen,
    color: "#16a34a",
  },
  {
    title: "Paper Management",
    description:
      "Organize papers into collections, folders, and tags. NOVARA makes managing large research libraries simple and intuitive.",
    icon: FolderOpen,
    color: "#059669",
  },
  {
    title: "User Profile Creation",
    description:
      "Create a personalized research profile that reflects your interests, saved papers, and activity, enabling better recommendations and collaboration.",
    icon: User,
    color: "#0d9488",
  },
  {
    title: "Citation Management",
    description:
      "Generate citations and bibliographies instantly in multiple styles. NOVARA ensures accurate and consistent referencing for academic writing.",
    icon: Quote,
    color: "#15803d",
  },
  {
    title: "Paper Discovery",
    description:
      "Discover relevant research papers through smart search and recommendations. NOVARA keeps you updated with the latest work in your field.",
    icon: Search,
    color: "#047857",
  },
];

const FeaturesSection = () => {
  return (
    <div style={{ 
      position: "relative",
      padding: "80px 60px", 
      backgroundColor: "#fff",
      overflow: "hidden",
      minHeight: "100vh"
    }}>
      {/* Background blob 1 - Bottom Right */}
      <motion.div
        style={{
          position: "absolute",
          width: "1000px",
          height: "700px",
          borderRadius: "60px",
          background: "linear-gradient(135deg, #c7f0d0, #a7e8c0, #c7f0d0)",
          opacity: 0.3,
          bottom: "5%",
          right: "-10%",
          zIndex: 0,
        }}
        animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Background blob 2 - Top Left */}
      <motion.div
        style={{
          position: "absolute",
          width: "1000px",
          height: "700px",
          borderRadius: "60px",
          background: "linear-gradient(225deg, #a7e8c0, #c7f0d0, #d1fae5)",
          opacity: 0.3,
          top: "5%",
          left: "-10%",
          zIndex: 0,
        }}
        animate={{ scale: [1.05, 1, 1.05], rotate: [5, 0, 5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: "60px" }}
        >
          <h2 style={{ 
            fontSize: "42px", 
            fontWeight: "700", 
            marginBottom: "16px",
            color: "#1f2937"
          }}>
            {/* Features */}
          </h2>
          <p style={{ 
            fontSize: "18px", 
            color: "#6b7280",
            maxWidth: "600px",
            margin: "0 auto"
          }}>
            {/* Everything you need to manage, understand, and collaborate on research papers */}
          </p>
        </motion.div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "48px",
        }}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isEven = index % 2 === 0;
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: isEven ? "flex-start" : "flex-end",
                }}
              >
                <motion.div
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "16px",
                    padding: "32px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    maxWidth: "700px",
                    width: "100%",
                  }}
                >
                <motion.div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "12px",
                    background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "20px",
                  }}
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon size={28} color="#fff" />
                </motion.div>

                <h3 style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  marginBottom: "12px",
                  color: "#1f2937",
                }}>
                  {feature.title}
                </h3>

                <p style={{
                  fontSize: "15px",
                  lineHeight: "1.6",
                  color: "#6b7280",
                  margin: 0,
                }}>
                  {feature.description}
                </p>
              </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;