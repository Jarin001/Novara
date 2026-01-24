import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import { useLocation, useNavigate } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchResults = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const initial = query.get("q") || "";
  const initialType = query.get("type") || "publications";
  const [q, setQ] = useState(initial);
  const [searchType, setSearchType] = useState(initialType);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [papers, setPapers] = useState([]);
  const [papersLoading, setPapersLoading] = useState(false);
  const [papersError, setPapersError] = useState(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    setQ(initial);
    setSearchType(initialType);
  }, [initial, initialType]);

  // Load papers when search query or type changes
  useEffect(() => {
    if (!initial) {
      setPapers([]);
      return;
    }

    const fetchPapers = async () => {
      try {
        setPapersLoading(true);
        setPapersError(null);
        console.log(`Loading papers for query: "${initial}"`);
        
        const response = await fetch(
          `http://localhost:5000/api/papers?query=${encodeURIComponent(initial)}&limit=20`
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log("Papers loaded:", data);
          setPapers(data.data || []);
        } else {
          setPapersError("Failed to load papers");
        }
      } catch (error) {
        console.error("Paper search error:", error);
        setPapersError("Error loading papers");
      } finally {
        setPapersLoading(false);
      }
    };

    fetchPapers();
  }, [initial]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autocomplete handler with 1 second delay
  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        console.log(`Fetching autocomplete for: "${q}"`);
        const response = await fetch(`http://localhost:5000/api/autocomplete?query=${encodeURIComponent(q)}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Autocomplete response:", data);
          setSuggestions(data.matches || []);
          setShowSuggestions(true);
        } else {
          console.error("Autocomplete response not ok:", response.status);
          const errorData = await response.json();
          console.error("Error details:", errorData);
        }
      } catch (error) {
        console.error("Autocomplete error:", error);
      } finally {
        setLoading(false);
      }
    }, 1000); // Wait 1 second before sending request to Semantic Scholar

    return () => clearTimeout(timer);
  }, [q]);

  const onSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(searchType)}`);
  };

  const handleSuggestionClick = (suggestion) => {
    setQ(suggestion.title);
    setShowSuggestions(false);
  };

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

          <div ref={searchContainerRef} style={{ position: "relative", width: "100%", marginBottom: 20 }}>
            <form onSubmit={onSubmit} style={{ width: "100%", display: "flex", boxShadow: "0 6px 20px rgba(0,0,0,0.08)", borderRadius: "24px", overflow: "hidden" }}>
              <input
                type="text"
                placeholder="Search for articles..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => q.trim().length >= 2 && setShowSuggestions(true)}
                style={{ 
                  flex: 1, 
                  padding: "18px 24px", 
                  fontSize: 18, 
                  border: "none", 
                  outline: "none", 
                  background: "#fff",
                  borderRadius: "24px 0 0 24px",
                  width: "100%",
                  boxSizing: "border-box"
                }}
              />
              <button 
                type="submit" 
                style={{ 
                  padding: "0 32px", 
                  backgroundColor: "#3E513E", 
                  color: "#fff", 
                  border: "none", 
                  cursor: "pointer", 
                  fontSize: 18,
                  borderRadius: "0 24px 24px 0",
                  fontWeight: "500"
                }}
              >
                Search
              </button>
            </form>

            {/* Autocomplete Dropdown - Positioned below form */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#fff",
                  border: "1px solid #e0e0e0",
                  borderTop: "none",
                  borderRadius: "0 0 24px 24px",
                  maxHeight: "400px",
                  overflowY: "auto",
                  zIndex: 1000,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  marginTop: 0
                }}
              >
                {suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{
                      padding: "16px 24px",
                      cursor: "pointer",
                      borderBottom: idx < suggestions.length - 1 ? "1px solid #f0f0f0" : "none",
                      transition: "background-color 0.15s ease",
                      fontSize: 14,
                      color: "#222",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9f9f9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ marginTop: "2px", color: "#999", fontSize: "16px" }}></div>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontWeight: 500, marginBottom: "4px" }}>{suggestion.title}</div>
                      {suggestion.authorsYear && (
                        <div style={{ fontSize: 12, color: "#888" }}>{suggestion.authorsYear}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loading indicator */}
            {loading && q.trim().length >= 2 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  padding: "16px 24px",
                  backgroundColor: "#fff",
                  border: "1px solid #e0e0e0",
                  borderTop: "none",
                  borderRadius: "0 0 24px 24px",
                  fontSize: 14,
                  color: "#666",
                  zIndex: 1000,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
                }}
              >
                Loading suggestions...
              </div>
            )}
          </div>

          <div style={{ marginTop: 20, color: "#333", textAlign: "center", display: "flex", justifyContent: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => {
                  setSearchType("publications");
                  navigate(`/search?q=${encodeURIComponent(q)}&type=publications`);
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: "12px",
                  border: searchType === "publications" ? "2px solid #3E513E" : "1px solid #ccc",
                  background: searchType === "publications" ? "#e6f7f8" : "#fff",
                  color: "#3E513E",
                  cursor: "pointer",
                }}
              >
                Publications
              </button>

              <button
                onClick={() => {
                  setSearchType("authors");
                  navigate(`/search?q=${encodeURIComponent(q)}&type=authors`);
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: "12px",
                  border: searchType === "authors" ? "2px solid #3E513E" : "1px solid #ccc",
                  background: searchType === "authors" ? "#e6f7f8" : "#fff",
                  color: "#3E513E",
                  cursor: "pointer",
                }}
              >
                Authors
              </button>
            </div>
          </div>

          {/* Papers Results Section */}
          {initial && (
            <div style={{ marginTop: 48, width: "100%", maxWidth: 900, marginLeft: "auto", marginRight: "auto" }}>
              {papersLoading && (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: 18, color: "#666" }}>Loading papers...</div>
                </div>
              )}

              {papersError && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#d32f2f" }}>
                  <div>{papersError}</div>
                </div>
              )}

              {!papersLoading && papers.length === 0 && !papersError && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
                  <div>No papers found. Try a different search.</div>
                </div>
              )}

              {papers.length > 0 && (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: "#222" }}>
                    Found {papers.length} papers
                  </div>
                  
                  {papers.map((paper, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "#fff",
                        border: "1px solid #e0e0e0",
                        borderRadius: "12px",
                        padding: "20px 24px",
                        marginBottom: 16,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      onClick={() => navigate(`/paper/${paper.paperId}`)}
                    >
                      {/* Title */}
                      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#1f1f1f", lineHeight: 1.4 }}>
                        {paper.title}
                      </div>

                      {/* Authors */}
                      {paper.authors && paper.authors.length > 0 && (
                        <div style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
                          {paper.authors.map((author, i) => (
                            <span key={i}>
                              {author.name}
                              {i < paper.authors.length - 1 ? ", " : ""}
                            </span>
                          ))}
                          {paper.year && <span style={{ marginLeft: 12, color: "#999" }}>({paper.year})</span>}
                        </div>
                      )}

                      {/* Venue and Citation Count */}
                      <div style={{ fontSize: 13, color: "#888", marginBottom: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
                        {paper.venue && (
                          <div>
                            <strong>Venue:</strong> {Array.isArray(paper.venue) ? paper.venue.join(", ") : paper.venue}
                          </div>
                        )}
                        {paper.citationCount !== undefined && (
                          <div>
                            <strong>Citations:</strong> {paper.citationCount}
                          </div>
                        )}
                      </div>

                      {/* Fields of Study */}
                      {paper.fieldsOfStudy && paper.fieldsOfStudy.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {paper.fieldsOfStudy.slice(0, 5).map((field, i) => (
                              <span
                                key={i}
                                style={{
                                  backgroundColor: "#e3f2fd",
                                  color: "#1976d2",
                                  padding: "4px 12px",
                                  borderRadius: "20px",
                                  fontSize: 12,
                                  fontWeight: 500
                                }}
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Abstract */}
                      {paper.abstract && (
                        <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginTop: 12 }}>
                          <p style={{ margin: 0 }}>
                            {paper.abstract.length > 300 ? `${paper.abstract.substring(0, 300)}...` : paper.abstract}
                          </p>
                        </div>
                      )}

                      {/* Paper ID */}
                      <div style={{ fontSize: 12, color: "#aaa", marginTop: 12 }}>
                        Paper ID: {paper.paperId}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchResults;

