import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useLocation, useNavigate } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchResults = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const initial = query.get("q") || "";
  const [q, setQ] = useState(initial);

  useEffect(() => {
    setQ(initial);
  }, [initial]);

  const onSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const suggestions = ["COVID-19", "Bioenergy", "Obesity", "Intrinsic Motivation"];

  return (
    <>
      <Navbar />

      <div
        style={{
          minHeight: "100vh",
          position: "relative",
          paddingTop: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg,#f7fafc,#eef2f6)",
        }}
      >
        <div style={{ width: "100%", maxWidth: 980, padding: "40px 24px", boxSizing: "border-box", textAlign: "center" }}>
          <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 16, color: "#222" }}>Welcome to Novara</h1>
          <p style={{ fontSize: 20, color: "#444", marginBottom: 32 }}>Search for and add articles to your library</p>

          <form onSubmit={onSubmit} style={{ width: "100%", display: "flex", boxShadow: "0 6px 20px rgba(0,0,0,0.08)", borderRadius: 8, overflow: "hidden" }}>
            <input
              type="text"
              placeholder="Search for articles..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ flex: 1, padding: "18px 20px", fontSize: 18, border: "none", outline: "none", background: "#fff" }}
            />
            <button type="submit" style={{ padding: "0 28px", backgroundColor: "#007b8a", color: "#fff", border: "none", cursor: "pointer", fontSize: 18 }}>
              Search
            </button>
          </form>

          <div style={{ marginTop: 20, color: "#333", textAlign: "center" }}>
            <strong>Try:</strong>
            <span style={{ marginLeft: 12 }}>
              {suggestions.map((s, idx) => (
                <React.Fragment key={s}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setQ(s);
                      navigate(`/search?q=${encodeURIComponent(s)}`);
                    }}
                    style={{ marginRight: 12, color: "#007b8a" }}
                  >
                    {s}
                  </a>
                  {idx < suggestions.length - 1 && <span style={{ marginRight: 12, color: "#333" }}>|</span>}
                </React.Fragment>
              ))}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchResults;
