import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Copy, Download, ArrowLeft, Check, Key, Search } from "lucide-react";
import Navbar from "../components/Navbar";
import axios from "axios";

const Bibtex = ({ papers = [], libraries = [], sharedLibraries = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bibtexData, setBibtexData] = useState([]);
  const [viewMode, setViewMode] = useState("bibtex"); // "bibtex" or "keys"
  const [copiedStates, setCopiedStates] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleBibtexCount, setVisibleBibtexCount] = useState(10);
  const [visibleKeysCount, setVisibleKeysCount] = useState(10);

  // Get the selected library ID from location state or query params
  const searchParams = new URLSearchParams(location.search);
  const selectedLibrary =
    location.state?.selectedLibrary || searchParams.get("library") || "all";

  // Get libraries and papers from location state or props
  const stateLibraries = location.state?.myLibraries || location.state?.libraries || libraries;
  const stateSharedLibraries = location.state?.sharedWithOthers || location.state?.sharedWithMe || location.state?.sharedLibraries || sharedLibraries;
  const statePapers = location.state?.papers || papers;
  const [allCopied, setAllCopied] = useState(false);

  // Fetch BibTeX data from the backend
  useEffect(() => {
    const fetchBibtex = async () => {
      try {
        const response = await axios.get(
          `/api/bibtex/all?library=${selectedLibrary}`,
        );
        setBibtexData(response.data.bibtex);
      } catch (error) {
        console.error("Error fetching BibTeX data:", error);
      }
    };
    fetchBibtex();
  }, [selectedLibrary]);

  // Get papers for the selected library
  const filteredPapers = statePapers.filter((p) =>
    selectedLibrary === "all"
      ? true
      : selectedLibrary.startsWith("s")
        ? p.libraryId === selectedLibrary
        : !p.libraryId.startsWith("s") && p.libraryId === selectedLibrary,
  );

  const sortedPapers = [...filteredPapers].sort(
    (a, b) => b.addedDate - a.addedDate,
  );

  // Get the appropriate library name
  let libraryName = "All Papers";
  if (selectedLibrary === "all") {
    libraryName = "All Papers";
  } else {
    const personalLib = stateLibraries.find((l) => l.id === selectedLibrary);
    const sharedLib = stateSharedLibraries.find(
      (l) => l.id === selectedLibrary,
    );
    libraryName = (personalLib || sharedLib)?.name || "Library";
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates({ ...copiedStates, [id]: true });
      setTimeout(() => setCopiedStates({ ...copiedStates, [id]: false }), 2000);
    });
  };

  const copyAllBibtex = () => {
    if (sortedPapers.length === 0) {
      alert("No papers to copy in this library.");
      return;
    }
    
    let textToCopy = "";
    if (viewMode === "bibtex") {
      textToCopy = sortedPapers.map((p) => p.bibtex).join("\n\n");
    } else {
      // For citation keys view, copy as comma-separated list
      const keys = filteredAndSortedKeys.map(item => item.citationKey);
      textToCopy = keys.join(", ");
    }
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
    });
  };

  const downloadBibtex = () => {
    if (sortedPapers.length === 0) {
      alert("No papers to download in this library.");
      return;
    }
    
    if (viewMode === "bibtex") {
      const allBibtex = sortedPapers.map((p) => p.bibtex).join("\n\n");
      const blob = new Blob([allBibtex], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${libraryName.replace(/\s+/g, "_")}_bibtex.bib`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // For citation keys view, download as text file with comma-separated keys
      const keys = filteredAndSortedKeys.map(item => item.citationKey);
      const allKeys = keys.join(", ");
      const blob = new Blob([allKeys], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${libraryName.replace(/\s+/g, "_")}_citation_keys.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Extract citation key from bibtex
  const getCitationKey = (bibtex) => {
    if (!bibtex) return "";
    const firstLine = bibtex.split("\n")[0];
    const match = firstLine.match(/@\w+{([^,]+),/);
    return match ? match[1].trim() : firstLine.replace("{", "").replace(",", "").trim();
  };

  // Create citation keys array
  const citationKeysArray = sortedPapers
    .filter(p => p.bibtex && p.bibtex.trim() !== "")
    .map(p => ({
      id: p.id,
      title: p.title,
      citationKey: getCitationKey(p.bibtex)
    }))
    .filter(item => item.citationKey); // Remove any with empty keys

  // Filter citation keys by search term
  const filteredAndSortedKeys = citationKeysArray.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get visible items based on view mode
  const visibleBibtex = sortedPapers.slice(0, visibleBibtexCount);
  const visibleKeys = filteredAndSortedKeys.slice(0, visibleKeysCount);

  const loadMoreBibtex = () => {
    setVisibleBibtexCount(prev => prev + 10);
  };

  const loadMoreKeys = () => {
    setVisibleKeysCount(prev => prev + 10);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "white",
      }}
    >
      <Navbar />
      <div
        style={{
          flex: 1,
          overflow: "auto",
          marginTop: "64px",
          padding: "32px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* View Toggle Buttons */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <button
              onClick={() => {
                setViewMode("bibtex");
                setVisibleBibtexCount(10);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: 500,
                border: "1px solid #e5e7eb",
                backgroundColor: viewMode === "bibtex" ? "#E8EDE8" : "white",
                color: viewMode === "bibtex" ? "#3E513E" : "#6b7280",
                cursor: "pointer",
              }}
            >
              Full BibTeX
            </button>
            <button
              onClick={() => {
                setViewMode("keys");
                setVisibleKeysCount(10);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: 500,
                border: "1px solid #e5e7eb",
                backgroundColor: viewMode === "keys" ? "#E8EDE8" : "white",
                color: viewMode === "keys" ? "#3E513E" : "#6b7280",
                cursor: "pointer",
              }}
            >
              Citation Keys
            </button>
          </div>

          {/* YOUR EXISTING HEADER - UNCHANGED */}
          <div
            style={{
              marginBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "#111827",
                  margin: "16px 0 8px 0",
                }}
              >
                BibTeX - {libraryName}
              </h1>
              <p style={{ color: "#6b7280", margin: 0 }}>
                {viewMode === "bibtex" ? sortedPapers.length : filteredAndSortedKeys.length} {viewMode === "bibtex" ? (sortedPapers.length === 1 ? "paper" : "papers") : (filteredAndSortedKeys.length === 1 ? "key" : "keys")}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={copyAllBibtex}
                disabled={viewMode === "bibtex" ? sortedPapers.length === 0 : filteredAndSortedKeys.length === 0}
                style={{
                  padding: "10px 16px",
                  color: (viewMode === "bibtex" ? sortedPapers.length === 0 : filteredAndSortedKeys.length === 0) ? "#9ca3af" : "white",
                  backgroundColor: (viewMode === "bibtex" ? sortedPapers.length === 0 : filteredAndSortedKeys.length === 0) ? "#f3f4f6" : "#3E513E",
                  border: "none",
                  borderRadius: "8px",
                  cursor: (viewMode === "bibtex" ? sortedPapers.length === 0 : filteredAndSortedKeys.length === 0) ? "not-allowed" : "pointer",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: (viewMode === "bibtex" ? sortedPapers.length === 0 : filteredAndSortedKeys.length === 0) ? "0.7" : "1",
                }}
                title={viewMode === "bibtex" ? "Copy all BibTeX" : "Copy all citation keys"}
              >
                {allCopied ? <Check size={18} /> : <Copy size={18} />}
              </button>
              <button
                onClick={downloadBibtex}
                disabled={viewMode === "bibtex" ? sortedPapers.length === 0 : filteredAndSortedKeys.length === 0}
                style={{
                  padding: "10px 16px",
                  color: (viewMode === "bibtex" ? sortedPapers.length === 0 : filteredAndSortedKeys.length === 0) ? "#9ca3af" : "#3E513E",
                  backgroundColor: (viewMode === "bibtex" ? sortedPapers.length === 0 : filteredAndSortedKeys.length === 0) ? "#f3f4f6" : "#E8EDE8",
                  border: "none",
                  borderRadius: "8px",
                  cursor: (viewMode === "bibtex" ? sortedPapers.length === 0 : filteredAndSortedKeys.length === 0) ? "not-allowed" : "pointer",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: (viewMode === "bibtex" ? sortedPapers.length === 0 : filteredAndSortedKeys.length === 0) ? "0.7" : "1",
                }}
                title={viewMode === "bibtex" ? "Download .bib file" : "Download .txt file"}
              >
                <Download size={18} />
              </button>
            </div>
          </div>

          {/* Search Bar - ONLY SHOWS IN CITATION KEYS VIEW */}
          {viewMode === "keys" && (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search papers by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 36px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                  }}
                />
              </div>
            </div>
          )}

          {/* CONTENT AREA */}
          <div
            style={{
              backgroundColor: "#F5F5F0",
              borderRadius: "12px",
              padding: "24px",
              border: "1px solid #E8EDE8",
              minHeight: "300px",
              position: "relative",
              paddingBottom: filteredAndSortedKeys.length > visibleKeysCount || sortedPapers.length > visibleBibtexCount ? "60px" : "24px",
            }}
          >
            {viewMode === "bibtex" ? (
              /* YOUR EXISTING BIBTEX VIEW WITH LOAD MORE */
              <>
                <pre
                  style={{
                    fontFamily: '"Courier New", Courier, monospace',
                    fontSize: "14px",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    margin: 0,
                    color: "#374151",
                    backgroundColor: "transparent",
                  }}
                >
                  {visibleBibtex.length > 0 ? (
                    visibleBibtex.map((p) => p.bibtex).join("\n\n")
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "200px",
                        color: "#9ca3af",
                      }}
                    >
                      <p style={{ fontSize: "1rem", margin: 0 }}>
                        No BibTeX entries in this library
                      </p>
                    </div>
                  )}
                </pre>
                {sortedPapers.length > visibleBibtexCount && (
                  <div style={{ position: "absolute", bottom: "16px", right: "24px" }}>
                    <button
                      onClick={loadMoreBibtex}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "white",
                        border: "1px solid #3E513E",
                        borderRadius: "4px",
                        color: "#3E513E",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#E8EDE8"}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* CITATION KEYS VIEW WITH SEARCH AND LOAD MORE */
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {visibleKeys.length > 0 ? (
                  <>
                    {visibleKeys.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          paddingBottom: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px",
                          }}
                        >
                          <h3
                            style={{
                              fontSize: "1rem",
                              fontWeight: 500,
                              color: "#111827",
                              margin: 0,
                              flex: 1,
                            }}
                          >
                            {item.title}
                          </h3>
                          <button
                            onClick={() => copyToClipboard(item.citationKey, item.id)}
                            style={{
                              padding: "4px 8px",
                              border: "none",
                              background: "transparent",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              color: copiedStates[item.id] ? "#3E513E" : "#6b7280",
                              fontSize: "12px",
                            }}
                            onMouseOver={(e) => {
                              if (!copiedStates[item.id]) {
                                e.currentTarget.style.backgroundColor = "#e5e7eb";
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!copiedStates[item.id]) {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }
                            }}
                          >
                            {copiedStates[item.id] ? (
                              <>
                                <Check size={12} />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copy Key</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div
                          style={{
                            backgroundColor: "white",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            fontFamily: '"Courier New", Courier, monospace',
                            fontSize: "13px",
                            color: "#3E513E",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <code>{item.citationKey}</code>
                        </div>
                      </div>
                    ))}
                    {filteredAndSortedKeys.length > visibleKeysCount && (
                      <div style={{ position: "absolute", bottom: "16px", right: "24px" }}>
                        <button
                          onClick={loadMoreKeys}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "white",
                            border: "1px solid #3E513E",
                            borderRadius: "4px",
                            color: "#3E513E",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#E8EDE8"}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
                        >
                          Load More
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "200px",
                      color: "#9ca3af",
                    }}
                  >
                    <Key size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                    <p style={{ fontSize: "1rem", margin: 0 }}>
                      {searchTerm ? "No matching papers found" : "No citation keys in this library"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bibtex;