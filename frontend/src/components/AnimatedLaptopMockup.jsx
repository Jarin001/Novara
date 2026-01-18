import { motion } from "framer-motion";
import { FileText, Users, Sparkles, BookOpen, Quote, Clock, Tag } from "lucide-react";
import "../styles/animatedLaptop.css"; // You can add the CSS for positioning/colors

export default function AnimatedLaptopMockup() {
  return (
    <div className="position-relative mx-auto my-5" style={{ maxWidth: "900px", height: "600px" }}>
      {/* Background blob */}
      <motion.div
        className="bg-blob position-absolute"
        style={{
          width: "800px",
          height: "500px",
          borderRadius: "60px",
          background: "linear-gradient(135deg, #c7f0d0, #a7e8c0, #c7f0d0)",
          opacity: 0.4,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Laptop Frame */}
      <div
        className="position-absolute"
        style={{
          top: "50%",
          left: "50%",
          width: "900px",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          className="shadow-lg rounded-top"
          style={{ background: "#1f2937", padding: "1rem" }}
        >
          {/* Laptop Screen */}
          <div
            className="position-relative rounded-top"
            style={{
              height: "480px",
              background: "linear-gradient(to bottom right, #ecfdf5, #d1fae5)",
              overflow: "hidden",
            }}
          >
            {/* Top Bar */}
            <div
              className="d-flex justify-content-between align-items-center position-absolute"
              style={{
                top: 0,
                left: 0,
                right: 0,
                padding: "0.75rem 1.5rem",
                background: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(6px)",
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <small className="text-muted">Papers</small>
                <small className="text-secondary">›</small>
                <small className="text-dark">Overview</small>
              </div>
              <div className="d-flex align-items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="btn btn-success btn-sm rounded-pill"
                >
                  All Categories
                </motion.button>
                <div style={{ width: "32px", height: "32px", background: "#22c55e", borderRadius: "50%" }} />
              </div>
            </div>

            {/* Sidebar */}
            <div
              className="position-absolute shadow-sm rounded-3 p-3"
              style={{ top: "64px", left: "24px", width: "192px", background: "rgba(255,255,255,0.9)" }}
            >
              <div className="mb-3">
                <small className="text-secondary">Total Papers</small>
                <h4 className="mb-0">247</h4>
              </div>
              <div className="mb-3">
                <small className="text-secondary">Reading</small>
                <h4 className="text-success mb-0">12</h4>
              </div>
              <div>
                <small className="text-secondary">Collections</small>
                <h4 className="text-success mb-0">8</h4>
              </div>
            </div>

            {/* Collections Panel */}
            <div
              className="position-absolute shadow-sm rounded-3 p-3"
              style={{ top: "80px", left: "256px", right: "32px", background: "rgba(255,255,255,0.7)" }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-dark">My Collections</small>
                <Tag size={16} className="text-success" />
              </div>

              {[
                ["Neural Networks", 23],
                ["Computer Vision", 18],
                ["NLP Research", 15],
              ].map(([name, count], i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="d-flex justify-content-between align-items-center p-2 rounded mb-2"
                  style={{ background: "rgba(255,255,255,0.6)" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: i === 0 ? "#16a34a" : i === 1 ? "#10b981" : "#14b8a6",
                      }}
                    />
                    <span className="small text-dark">{name}</span>
                  </div>
                  <small className="text-secondary">{count}</small>
                </motion.div>
              ))}
            </div>

            {/* Floating Paper Card */}
            <motion.div
              className="position-absolute shadow rounded-3 p-3"
              style={{ top: "208px", right: "48px", width: "288px", background: "#fff" }}
              animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="d-flex align-items-start gap-2 mb-2">
                <FileText className="text-success" />
                <strong>Research Paper</strong>
              </div>
              <small className="text-secondary">2024 • 156 citations</small>
            </motion.div>

            {/* Book Card */}
            <motion.div
              className="position-absolute shadow rounded-3 p-3"
              style={{ bottom: "96px", left: "64px", width: "256px", background: "#fff" }}
              animate={{ y: [0, -15, 0], rotate: [0, -2, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <div className="d-flex align-items-start gap-2">
                <BookOpen className="text-success" />
                <div className="flex-1">
                  <div style={{ height: "8px", background: "#d1fae5", borderRadius: "4px", marginBottom: "4px" }} />
                  <div style={{ height: "6px", background: "#ecfdf5", borderRadius: "4px", marginBottom: "4px", width: "66%" }} />
                  <div style={{ height: "6px", background: "#ecfdf5", borderRadius: "4px", width: "80%" }} />
                  <div className="d-flex align-items-center gap-1 mt-2">
                    <Clock className="text-secondary" size={12} />
                    <small className="text-secondary mb-0">In Progress</small>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quote Card */}
            <motion.div
              className="position-absolute shadow rounded-3 p-2"
              style={{ top: "256px", left: "288px", width: "224px", background: "linear-gradient(to bottom right, #fff, #d1fae5)" }}
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <Quote className="text-success mb-1" size={16} />
              <small>AI Summary</small>
            </motion.div>

            {/* AI Badge */}
            <motion.div
              className="position-absolute rounded-circle shadow-lg d-flex justify-content-center align-items-center"
              style={{ bottom: "128px", right: "96px", width: "64px", height: "64px", background: "linear-gradient(to bottom right, #22c55e, #10b981)" }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <Sparkles className="text-white" size={24} />
            </motion.div>

            {/* Collaboration Icon */}
            <motion.div
              className="position-absolute rounded-circle shadow-lg d-flex justify-content-center align-items-center"
              style={{ top: "192px", left: "96px", width: "40px", height: "40px", background: "#fff" }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            >
              <Users className="text-success" size={20} />
            </motion.div>

            {/* Floating Tags */}
            <motion.div
              className="position-absolute d-flex gap-2"
              style={{ bottom: "144px", left: "320px" }}
              animate={{ x: [0, 5, 0], y: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
              <div style={{ background: "#bbf7d0", padding: "2px 8px", borderRadius: "9999px", fontSize: "12px", color: "#15803d" }}>Machine Learning</div>
              <div style={{ background: "#d1fae5", padding: "2px 8px", borderRadius: "9999px", fontSize: "12px", color: "#065f46" }}>AI</div>
            </motion.div>

            {/* Data dots */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="position-absolute rounded-circle"
                style={{ width: "8px", height: "8px", background: "#16a34a", left: `${20 + i * 6}%`, bottom: `${30 + Math.sin(i) * 20}%` }}
                animate={{ y: [0, -10, 0], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 3 + i * 0.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
              />
            ))}
          </div>
        </div>

        {/* Laptop Base */}
        <div
          className="rounded-bottom"
          style={{
            height: "16px",
            background: "linear-gradient(to bottom, #9ca3af, #d1d5db)",
            position: "relative",
          }}
        />
      </div>
    </div>
  );
}
