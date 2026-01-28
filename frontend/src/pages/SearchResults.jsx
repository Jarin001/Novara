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
  const searchContainerRef = useRef(null);

  useEffect(() => {
    setQ(initial);
    setSearchType(initialType);
  }, [initial, initialType]);

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
        console.log(`Fetching autocomplete for: "${q}" (type: ${searchType})`);
        
        let endpoint;
        let dataProcessor;
        
        if (searchType === "authors") {
          // Use author autocomplete endpoint
          endpoint = `http://localhost:5000/api/author-autocomplete?query=${encodeURIComponent(q)}`;
          dataProcessor = (data) => {
            // Transform author data to match suggestion format
            return (data.authors || []).map(author => ({
              id: author.id,
              name: author.name,
              affiliation: author.affiliation || "",
              profile_picture_url: author.profile_picture_url,
              type: "author"
            }));
          };
        } else {
          // Use paper autocomplete endpoint (original)
          endpoint = `http://localhost:5000/api/autocomplete?query=${encodeURIComponent(q)}`;
          dataProcessor = (data) => data.matches || [];
        }
        
        const response = await fetch(endpoint);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Autocomplete response:", data);
          const processedSuggestions = dataProcessor(data);
          setSuggestions(processedSuggestions);
          setShowSuggestions(true);
        } else {
          console.error("Autocomplete response not ok:", response.status);
          const errorData = await response.json();
          console.error("Error details:", errorData);
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Autocomplete error:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 1000); // Wait 1 second before sending request

    return () => clearTimeout(timer);
  }, [q, searchType]);

  const onSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setShowSuggestions(false);
    
    // Navigate based on search type
    if (searchType === "authors") {
      navigate(`/authors?q=${encodeURIComponent(q)}`);
    } else {
      // For publications, navigate to ResultsPage
      navigate(`/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(searchType)}`);
    }
  };

  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    
    // Clear suggestions when changing type
    setSuggestions([]);
    setShowSuggestions(false);
    
    // If there's a query, navigate immediately when changing type
    if (q.trim()) {
      if (type === "authors") {
        navigate(`/authors?q=${encodeURIComponent(q)}`);
      } else {
        navigate(`/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setShowSuggestions(false);
    
    // Navigate based on search type
    if (searchType === "authors") {
      // If it's an author suggestion, navigate directly to author profile page
      if (suggestion.type === "author") {
        navigate(`/profile/${suggestion.id}`);
      } else {
        // If it's a publication suggestion but we're in author mode, search for authors with that name
        navigate(`/authors?q=${encodeURIComponent(suggestion.name || suggestion.title)}`);
      }
    } else {
      // For publications, navigate to ResultsPage
      navigate(`/search?q=${encodeURIComponent(suggestion.title)}&type=${encodeURIComponent(searchType)}`);
    }
  };

  // Check if we should show content on this page
  const showAuthorsMessage = searchType === "authors" && initial;

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
                placeholder={searchType === "authors" ? "Search for authors..." : "Search for articles..."}
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
                      alignItems: "center",
                      gap: "12px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9f9f9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {suggestion.type === "author" ? (
                      <>
                        {suggestion.profile_picture_url ? (
                          <img
                            src={suggestion.profile_picture_url}
                            alt={suggestion.name || "Author"}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "1px solid #e0e0e0"
                            }}
                          />
                        ) : (
                          <div style={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: "50%", 
                            background: "#3E513E",
                            color: "#fff",
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            fontWeight: 'bold'
                          }}>
                            {suggestion.name ? suggestion.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        <div style={{ flex: 1, textAlign: "left" }}>
                          <div style={{ fontWeight: 600, marginBottom: "4px", color: "#3E513E" }}>
                            {suggestion.name || "Unknown Author"}
                          </div>
                          {suggestion.affiliation && (
                            <div style={{ fontSize: 12, color: "#666", marginBottom: "2px" }}>
                              {suggestion.affiliation}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: "#888" }}>
                            Click to view profile
                          </div>
                        </div>
                      </>
                    ) : (
                      // Publication suggestion (original format)
                      <>
                        <div style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: "50%", 
                          background: "#f0f0f0",
                          color: "#666",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                        }}>
                          📄
                        </div>
                        <div style={{ flex: 1, textAlign: "left" }}>
                          <div style={{ fontWeight: 500, marginBottom: "2px" }}>{suggestion.title}</div>
                          <div style={{ fontSize: 12, color: "#888" }}>
                            {suggestion.authorsYear || "Publication"}
                          </div>
                        </div>
                      </>
                    )}
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
                Loading {searchType === "authors" ? "author" : "publication"} suggestions...
              </div>
            )}
          </div>

          <div style={{ marginTop: 20, color: "#333", textAlign: "center", display: "flex", justifyContent: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => handleSearchTypeChange("publications")}
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
                onClick={() => handleSearchTypeChange("authors")}
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

          {/* Note for Authors search */}
          {showAuthorsMessage && (
            <div style={{ marginTop: 48, textAlign: "center", padding: "40px 20px", color: "#666" }}>
              <div style={{ fontSize: 18, marginBottom: 16 }}>Searching for authors...</div>
              <div>Click "Search" to view author results on the dedicated authors page.</div>
            </div>
          )}

          {/* Initial state - no search yet */}
          {!initial && (
            <div style={{ marginTop: 48, textAlign: "center", padding: "40px 20px", color: "#666" }}>
              <div style={{ fontSize: 18, marginBottom: 16 }}></div>
              
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchResults;