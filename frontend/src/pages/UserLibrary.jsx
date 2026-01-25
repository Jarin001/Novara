import React, { useState, useEffect } from "react";
import invertedCommasIcon from "../images/inverted-commas.png";
import {
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  FileText,
  TrendingUp,
  X,
  Save,
  StickyNote,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Navbar from "../components/Navbar";
import CitationModal from "../components/CitationModal";
import { useNavigate } from "react-router-dom";

// API Base URL
const API_BASE_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const ResearchLibrary = () => {
  const [libraries, setLibraries] = useState([]);
  const [sharedLibraries, setSharedLibraries] = useState([]);
  const [isSharedExpanded, setIsSharedExpanded] = useState(true);
  const [expandedAbstracts, setExpandedAbstracts] = useState({});
  const [papers, setPapers] = useState([]);
  const [selectedLibrary, setSelectedLibrary] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dateAdded");
  const [showNewLibraryModal, setShowNewLibraryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState(null);
  const [newLibraryName, setNewLibraryName] = useState("");
  const [newLibraryDescription, setNewLibraryDescription] = useState("");
  const [notesModal, setNotesModal] = useState({
    show: false,
    paperId: null,
    notes: "",
  });
  const [citationModal, setCitationModal] = useState({
    isOpen: false,
    paper: null,
  });
  const [loading, setLoading] = useState({
    libraries: false,
    papers: false,
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("access_token");
  };

  // Fetch all libraries for the user
  const fetchLibraries = async () => {
    try {
      setLoading((prev) => ({ ...prev, libraries: true }));
      setError("");

      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/libraries`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch libraries");
      }

      const data = await response.json();

      // Separate into owned and shared libraries
      const myLibraries = data.my_libraries || [];
      const sharedLibraries = data.shared_with_me || [];

      setLibraries([
        { id: "all", name: "All Papers", isDefault: true },
        ...myLibraries.map((lib) => ({
          id: lib.id,
          name: lib.name,
          isDefault: false,
          description: lib.description,
          is_public: lib.is_public,
          paper_count: lib.paper_count,
          role: lib.role,
        })),
      ]);

      setSharedLibraries(
        sharedLibraries.map((lib) => ({
          id: lib.id,
          name: lib.name,
          sharedBy: lib.created_by_user_id ? "User" : "Unknown",
          isShared: true,
          description: lib.description,
          role: lib.role,
        })),
      );
    } catch (err) {
      console.error("Error fetching libraries:", err);
      setError("Failed to load libraries. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, libraries: false }));
    }
  };

  // Fetch papers for selected library
  const fetchPapers = async (libraryId) => {
    try {
      setLoading((prev) => ({ ...prev, papers: true }));
      setError("");

      if (libraryId === "all") {
        // For "All Papers", we need to fetch papers from all libraries
        await fetchAllPapers();
        return;
      }

      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/libraries/${libraryId}/papers`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch papers for library ${libraryId}`);
      }

      const data = await response.json();

      // Transform backend data to frontend format
      const transformedPapers =
        data.papers?.map((paper) => ({
          id: paper.library_paper_id,
          dbPaperId: paper.id,
          s2PaperId: paper.s2_paper_id,
          title: paper.title,
          authors: paper.authors || [],
          venue: paper.venue || "Unknown Venue",
date: paper.year ? String(paper.year) : "",
          citations: paper.citation_count || 0,
          source: "Database",
          abstract: paper.abstract || "",
          libraryId: libraryId,
          readingStatus: paper.reading_status || "unread",
          notes: paper.user_note || "",
          addedDate: new Date(paper.added_at || Date.now()),
          field: paper.fields_of_study || "",
          bibtex: paper.bibtex || "",
        })) || [];

      setPapers(transformedPapers);
    } catch (err) {
      console.error("Error fetching papers:", err);
      setError("Failed to load papers. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, papers: false }));
    }
  };

  // Fetch all papers from all libraries (deduplicated from backend)
  const fetchAllPapers = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      // Fetch all unique papers across all libraries from backend
      const response = await fetch(`${API_BASE_URL}/api/user/papers`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch all papers");
      }

      const data = await response.json();

      // Transform backend data to frontend format
      const transformedPapers =
        data.papers?.map((paper) => ({
          id: paper.paper_id,
          dbPaperId: paper.id,
          s2PaperId: paper.s2_paper_id,
          title: paper.title,
          authors: paper.authors || [],
          venue: paper.venue || "Unknown Venue",
      date: paper.year ? String(paper.year) : "",
          citations: paper.citation_count || 0,
          source: "Database",
          abstract: paper.abstract || "",
          libraryId: paper.library_ids?.[0] || "all",
          readingStatus: paper.reading_statuses?.[0] || "unread",
          notes: paper.notes?.[0]?.user_note || "",
          addedDate: new Date(paper.first_added_at || Date.now()),
          field: paper.fields_of_study || "",
          bibtex: paper.bibtex || "",
        })) || [];

      setPapers(transformedPapers);
    } catch (err) {
      console.error("Error fetching all papers:", err);
    }
  };

  // Create new library
  const handleCreateLibrary = async () => {
    if (!newLibraryName.trim()) return;

    try {
      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/libraries`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newLibraryName.trim(),
          description: newLibraryDescription.trim(),
          is_public: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create library");
      }

      const data = await response.json();

      // Add new library to state
      const newLib = {
        id: data.library.id,
        name: data.library.name,
        isDefault: false,
        description: data.library.description,
        is_public: data.library.is_public,
        paper_count: 0,
        role: "creator",
      };

      setLibraries((prev) => [
        { id: "all", name: "All Papers", isDefault: true },
        ...prev.filter((lib) => lib.id !== "all"),
        newLib,
      ]);

      setNewLibraryName("");
      setNewLibraryDescription("");
      setShowNewLibraryModal(false);
      setError("");
    } catch (err) {
      console.error("Error creating library:", err);
      setError(err.message || "Failed to create library");
    }
  };

  // Edit library
  const handleEditLibrary = async () => {
    if (!newLibraryName.trim() || !editingLibrary) return;

    try {
      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/libraries/${editingLibrary.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newLibraryName.trim(),
            description: newLibraryDescription.trim(),
            is_public: editingLibrary.is_public || false,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update library");
      }

      const data = await response.json();

      // Update library in state
      setLibraries((prev) =>
        prev.map((lib) =>
          lib.id === editingLibrary.id
            ? {
                ...lib,
                name: data.library.name,
                description: data.library.description,
              }
            : lib,
        ),
      );

      setNewLibraryName("");
      setNewLibraryDescription("");
      setEditingLibrary(null);
      setShowEditModal(false);
      setError("");
    } catch (err) {
      console.error("Error updating library:", err);
      setError(err.message || "Failed to update library");
    }
  };

  // Delete library
  const handleDeleteLibrary = async (id) => {
    if (!window.confirm("Are you sure you want to delete this library?")) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/libraries/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete library");
      }

      // Remove library from state
      setLibraries((prev) => prev.filter((lib) => lib.id !== id));

      if (selectedLibrary === id) {
        setSelectedLibrary("all");
      }

      setError("");
    } catch (err) {
      console.error("Error deleting library:", err);
      setError(err.message || "Failed to delete library");
    }
  };

  // Remove paper from library
  const handleRemovePaper = async (paperId, dbPaperId) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this paper from the library?",
      )
    ) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/libraries/${selectedLibrary}/papers/${dbPaperId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove paper");
      }

      // Remove paper from state
      setPapers((prev) => prev.filter((p) => p.id !== paperId));
      setError("");
    } catch (err) {
      console.error("Error removing paper:", err);
      setError(err.message || "Failed to remove paper");
    }
  };

  // Update reading status
  const handleReadingStatusChange = async (paperId, dbPaperId, status) => {
    try {
      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      // Find the paper to get its library ID
      const paper = papers.find((p) => p.id === paperId);
      if (!paper) {
        console.error("Paper not found with id:", paperId);
        console.log(
          "Available paper ids:",
          papers.map((p) => p.id),
        );
        setError("Paper not found");
        return;
      }

      console.log("Updating reading status for paper:", {
        paperId,
        dbPaperId,
        libraryId: paper.libraryId,
        status,
        url: `${API_BASE_URL}/api/libraries/${paper.libraryId}/papers/${dbPaperId}/status`,
      });

      // Revert back to using dbPaperId (paper_id from papers table)
      const response = await fetch(
        `${API_BASE_URL}/api/libraries/${paper.libraryId}/papers/${dbPaperId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reading_status: status }),
        },
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error:", errorData);
        throw new Error(
          errorData.message ||
            `HTTP ${response.status}: Failed to update reading status`,
        );
      }

      const responseData = await response.json();
      console.log("Success response:", responseData);

      setPapers((prev) =>
        prev.map((p) =>
          p.id === paperId ? { ...p, readingStatus: status } : p,
        ),
      );
      setError("");
    } catch (err) {
      console.error("Error updating reading status:", err);
      setError(err.message || "Failed to update reading status");
    }
  };

  // Save notes
  const saveNotes = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      if (!notesModal.notes.trim()) {
        deleteNotes();
        return;
      }

      const paper = papers.find((p) => p.id === notesModal.paperId);
      if (!paper) return;

      const response = await fetch(
        `${API_BASE_URL}/api/libraries/${paper.libraryId}/papers/${paper.dbPaperId}/note`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_note: notesModal.notes }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save note");
      }

      setPapers((prev) =>
        prev.map((p) =>
          p.id === notesModal.paperId ? { ...p, notes: notesModal.notes } : p,
        ),
      );
      setNotesModal({ show: false, paperId: null, notes: "" });
      setError("");
    } catch (err) {
      console.error("Error saving note:", err);
      setError("Failed to save note");
    }
  };

  const deleteNotes = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const paper = papers.find((p) => p.id === notesModal.paperId);
      if (!paper) return;

      const response = await fetch(
        `${API_BASE_URL}/api/libraries/${paper.libraryId}/papers/${paper.dbPaperId}/note`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_note: "" }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete note");
      }

      setPapers((prev) =>
        prev.map((p) =>
          p.id === notesModal.paperId ? { ...p, notes: "" } : p,
        ),
      );
      setNotesModal({ show: false, paperId: null, notes: "" });
      setError("");
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Failed to delete note");
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchLibraries();
  }, []);

  // Fetch papers when selected library changes
  useEffect(() => {
    if (selectedLibrary) {
      fetchPapers(selectedLibrary);
    }
  }, [selectedLibrary]);

  // Filter and sort papers
  const filteredPapers = papers.filter((p) => {
    // First filter by library selection
    const libraryMatch =
      selectedLibrary === "all"
        ? true
        : selectedLibrary.startsWith("s")
          ? p.libraryId === selectedLibrary
          : !p.libraryId?.startsWith("s") && p.libraryId === selectedLibrary;

    // Then filter by search term if it exists
    if (!searchTerm.trim()) return libraryMatch;

    const searchLower = searchTerm.toLowerCase();
    return libraryMatch && p.title.toLowerCase().includes(searchLower);
  });

  const sortedPapers = [...filteredPapers].sort((a, b) => {
    switch (sortBy) {
      case "citations":
        return b.citations - a.citations;
      case "dateAdded":
        return b.addedDate - a.addedDate;
      case "datePublished":
        return new Date(b.date) - new Date(a.date);
      default:
        return 0;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "read":
        return { backgroundColor: "#d1f4e0", color: "#166534" };
      case "in_progress":
        return { backgroundColor: "#fef3c7", color: "#854d0e" };
      case "unread":
        return { backgroundColor: "#f3f4f6", color: "#1f2937" };
      default:
        return { backgroundColor: "#f3f4f6", color: "#1f2937" };
    }
  };

  const toggleAbstract = (paperId) => {
    setExpandedAbstracts((prev) => ({
      ...prev,
      [paperId]: !prev[paperId],
    }));
  };

  // Show loading state until libraries are loaded on initial page load, OR until initial papers load
  if (loading.libraries || (papers.length === 0 && loading.papers)) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
        }}
      >
        <Navbar />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "64px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Loader2
              size={48}
              className="spin"
              style={{
                color: "#3E513E",
                marginBottom: "16px",
                animation: "spin 1s linear infinite",
              }}
            />
            <p style={{ color: "#3E513E" }}>
              {loading.libraries ? "Loading libraries..." : "Loading papers..."}
            </p>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F5F5F0",
      }}
    >
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
        rel="stylesheet"
      />

      {/* Navbar */}
      <Navbar />

      {/* Error Message */}
      {error && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            padding: "12px 24px",
            borderRadius: "8px",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            style={{
              background: "none",
              border: "none",
              color: "#dc2626",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          marginTop: "64px",
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: "256px",
            backgroundColor: "white",
            borderRight: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
            <h2
              style={{
                fontSize: "1.0rem",
                fontWeight: 600,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: "0",
                textAlign: "left",
              }}
            >
              Libraries
            </h2>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {libraries.map((library) => (
              <div
                key={library.id}
                className="library-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  cursor: "pointer",
                  backgroundColor:
                    selectedLibrary === library.id ? "#E8EDE8" : "white",
                  borderLeft:
                    selectedLibrary === library.id
                      ? "4px solid #3E513E"
                      : "none",
                }}
                onMouseEnter={(e) => {
                  const actions =
                    e.currentTarget.querySelector(".library-actions");
                  if (actions && !library.isDefault)
                    actions.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  const actions =
                    e.currentTarget.querySelector(".library-actions");
                  if (actions) actions.style.opacity = "0";
                }}
                onClick={() => setSelectedLibrary(library.id)}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <FolderOpen
                    size={18}
                    style={{
                      color:
                        selectedLibrary === library.id ? "#3E513E" : "#9ca3af",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color:
                        selectedLibrary === library.id ? "#3E513E" : "#374151",
                      fontWeight: selectedLibrary === library.id ? 500 : 400,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {library.name}{" "}
                    {library.paper_count !== undefined
                      ? `(${library.paper_count})`
                      : ""}
                  </span>
                </div>

                {!library.isDefault && (
                  <div
                    className="library-actions"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      opacity: 0,
                      transition: "opacity 0.2s",
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLibrary(library);
                        setNewLibraryName(library.name);
                        setNewLibraryDescription(library.description || "");
                        setShowEditModal(true);
                      }}
                      style={{
                        padding: "4px",
                        border: "none",
                        background: "transparent",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#e5e7eb")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <Edit2 size={14} style={{ color: "#6b7280" }} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLibrary(library.id);
                      }}
                      style={{
                        padding: "4px",
                        border: "none",
                        background: "transparent",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#e5e7eb")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <Trash2 size={14} style={{ color: "#6b7280" }} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Shared Libraries Section */}
            {sharedLibraries.length > 0 && (
              <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "8px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    cursor: "pointer",
                    backgroundColor: "white",
                  }}
                  onClick={() => setIsSharedExpanded(!isSharedExpanded)}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {isSharedExpanded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#374151",
                        fontWeight: 500,
                      }}
                    >
                      Shared ({sharedLibraries.length})
                    </span>
                  </div>
                </div>

                {isSharedExpanded &&
                  sharedLibraries.map((library) => (
                    <div
                      key={library.id}
                      className="library-item"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px 12px 40px",
                        cursor: "pointer",
                        backgroundColor:
                          selectedLibrary === library.id ? "#E8EDE8" : "white",
                        borderLeft:
                          selectedLibrary === library.id
                            ? "4px solid #3E513E"
                            : "none",
                      }}
                      onClick={() => setSelectedLibrary(library.id)}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.875rem",
                            color:
                              selectedLibrary === library.id
                                ? "#3E513E"
                                : "#374151",
                            fontWeight:
                              selectedLibrary === library.id ? 500 : 400,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {library.name}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          by {library.sharedBy}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div style={{ padding: "16px", borderTop: "1px solid #e5e7eb" }}>
            <button
              onClick={() => setShowNewLibraryModal(true)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "8px 16px",
                color: "white",
                backgroundColor: "#3E513E",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Plus size={18} />
              New Library
            </button>
          </div>
        </div>

        {/* Papers List */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: "white",
          }}
        >
          {/* Header */}
          <div
            style={{ borderBottom: "1px solid #e5e7eb", padding: "16px 24px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <FolderOpen size={24} style={{ color: "#3E513E" }} />
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  {selectedLibrary === "all"
                    ? "All Papers"
                    : libraries.find((l) => l.id === selectedLibrary)?.name ||
                      sharedLibraries.find((l) => l.id === selectedLibrary)
                        ?.name ||
                      "Library"}
                </h2>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <button
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#3E513E",
                    backgroundColor: "#E8EDE8",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Share
                </button>
                <button
                  onClick={() =>
                    navigate("/bibtex", {
                      state: {
                        selectedLibrary,
                        libraries,
                        sharedLibraries,
                        papers,
                      },
                    })
                  }
                  style={{
                    padding: "8px 16px",
                    color: "#6b7280",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f3f4f6")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  BibTeX
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ flex: 1, maxWidth: "448px" }}>
                <input
                  type="text"
                  placeholder="Search Papers"
                  className="form-control"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                  }}
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-select"
                style={{
                  width: "auto",
                  padding: "8px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                }}
              >
                <option value="dateAdded">Sort by Date Added</option>
                <option value="citations">Sort by Citations</option>
                <option value="datePublished">Sort by Publication Date</option>
              </select>
            </div>
          </div>

          {/* Papers */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
            {loading.papers ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#9ca3af",
                }}
              >
                <Loader2
                  size={48}
                  className="spin"
                  style={{
                    marginBottom: "16px",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <p style={{ fontSize: "1.125rem" }}>Loading papers...</p>
              </div>
            ) : sortedPapers.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#9ca3af",
                }}
              >
                <FileText size={64} style={{ marginBottom: "16px" }} />
                <p style={{ fontSize: "1.125rem" }}>
                  No papers in this library
                </p>
                {selectedLibrary !== "all" && (
                  <p style={{ fontSize: "0.875rem", marginTop: "8px" }}>
                    Add papers to this library to see them here
                  </p>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                {sortedPapers.map((paper) => (
                  <div
                    key={paper.id}
                    style={{
                      borderBottom: "1px solid #eee", // Changed from #e5e7eb to #eee
                      paddingBottom: "24px",
                      padding: "18px 0", // Added padding top/bottom like ResultsPage
                    }}
                  >
                    {/* Title with Note Icon */}
                    {/* Title with Note Icon */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <button
                        onClick={() => navigate(`/paper/${paper.s2PaperId}`)} // Navigate using semantic scholar ID
                        style={{
                          fontSize: "20px", // Changed from 1.125rem to 20px
                          fontWeight: 600, // Changed from 400 to 600
                          color: "#3E513E",
                          cursor: "pointer",
                          flex: 1,
                          margin: 0,
                          textAlign: "left",
                          background: "transparent",
                          border: "none",
                          padding: 0,
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.opacity = "0.8")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.opacity = "1")
                        }
                      >
                        {paper.title}
                      </button>
                      {selectedLibrary !== "all" && (
                        <button
                          onClick={() =>
                            setNotesModal({
                              show: true,
                              paperId: paper.id,
                              notes: paper.notes || "",
                            })
                          }
                          title="Add/Edit Notes"
                          style={{
                            padding: "4px",
                            border: "none",
                            background: "transparent",
                            borderRadius: "4px",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f3f4f6")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                        >
                          <StickyNote
                            size={18}
                            style={{
                              color: paper.notes ? "#ca8a04" : "#9ca3af",
                            }}
                            fill={paper.notes ? "#fef3c7" : "none"}
                          />
                        </button>
                      )}
                    </div>

                    {/* Authors */}
                    {/* Authors - Updated to match ResultsPage */}
                    {/* Authors and Fields of Study - UPDATED */}
                    <div
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      {/* Authors - CHANGED COLOR to #f2f2f2 (was #f2f6f8) */}
                      {Array.isArray(paper.authors) && paper.authors.length > 0
                        ? paper.authors.map((a, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: "#f2f2f2", // CHANGED COLOR
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                              }}
                            >
                              {typeof a === "object" ? a.name || "" : a || ""}
                            </span>
                          ))
                        : ""}

                      {/* Field of Study - CHANGED COLOR to #f2f6f8 (was #f2f2f2) and moved beside authors */}
                      {paper.field && (
                        <>
                          {(Array.isArray(paper.field) ? paper.field : []).map(
                            (f, idx) => (
                              <span
                                key={idx}
                                style={{
                                  background: "#f2f6f8", // CHANGED COLOR
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                }}
                              >
                                {typeof f === "object" ? f.name || "" : f || ""}
                              </span>
                            ),
                          )}
                        </>
                      )}
                    </div>

                    {/* Venue and Date - Updated styling */}
                    <div
                      style={{
                        fontSize: "13px", // Changed from 0.875rem to 13px
                        color: "#888", // Changed from #6b7280 to #888
                        marginBottom: "10px",
                      }}
                    >
                      {paper.venue} · {paper.date}
                    </div>

                    {/* Abstract */}
                    {/* Abstract - Updated colors */}
                    {/* Abstract */}
                    {/* Abstract - Updated colors */}
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#444", // Changed from #374151 to #444
                        marginBottom: "12px",
                        lineHeight: "1.5",
                      }}
                    >
                      {paper.abstract ? (
                        expandedAbstracts[paper.id] ? (
                          paper.abstract
                        ) : (
                          <>
                            {paper.abstract.length > 300
                              ? `${paper.abstract.substring(0, 300)}... `
                              : paper.abstract}
                            {paper.abstract.length > 300 && (
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleAbstract(paper.id);
                                }}
                                style={{
                                  color: "#3E513E",
                                  textDecoration: "none",
                                  cursor: "pointer",
                                }}
                                onMouseOver={(e) =>
                                  (e.currentTarget.style.textDecoration =
                                    "underline")
                                }
                                onMouseOut={(e) =>
                                  (e.currentTarget.style.textDecoration =
                                    "none")
                                }
                              >
                                Expand
                              </a>
                            )}
                          </>
                        )
                      ) : (
                        "No abstract available"
                      )}
                      {expandedAbstracts[paper.id] &&
                        paper.abstract &&
                        paper.abstract.length > 300 && (
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleAbstract(paper.id);
                            }}
                            style={{
                              color: "#3E513E",
                              textDecoration: "none",
                              cursor: "pointer",
                              marginLeft: "8px",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.textDecoration =
                                "underline")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.textDecoration = "none")
                            }
                          >
                            Show less
                          </a>
                        )}
                    </p>

                    {/* Bottom Actions */}
                    {/* Bottom Actions - Updated citation styling */}
                    {/* Bottom Actions - Fixed layout with status on right */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "12px",
                      }}
                    >
                      {/* Left side: Citations, Cite, Remove buttons */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px", // Changed from 16px to 12px for better spacing
                        }}
                      >
                        {/* Citations Count with ResultsPage badge styling */}
                        {/* Citations Count with ResultsPage badge styling - ADDED INVERTED COMMA ICON */}
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 10px",
                            background: "#f5f5f5",
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                            fontSize: "12px",
                            color: "#333",
                            fontWeight: 500,
                          }}
                        >
                          <img
                            src={invertedCommasIcon}
                            alt="Citations"
                            style={{
                              width: "12px",
                              height: "12px",
                              opacity: 0.8,
                            }}
                          />
                          {paper.citations}
                        </span>

                        {/* Cite Button with ResultsPage styling */}
                        <button
                          onClick={() =>
                            setCitationModal({
                              isOpen: true,
                              paper,
                            })
                          }
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 10px",
                            background: "#fff",
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                            fontSize: "12px",
                            color: "#333",
                            cursor: "pointer",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.opacity = "0.8")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.opacity = "1")
                          }
                        >
                          <img
                            src={invertedCommasIcon}
                            alt="Cite"
                            style={{ width: "12px", height: "12px" }}
                          />
                          Cite
                        </button>

                        {/* Remove button - Keep original style */}
                        <button
                          onClick={() =>
                            handleRemovePaper(paper.id, paper.dbPaperId)
                          }
                          style={{
                            color: "#dc2626",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            display:
                              selectedLibrary === "all" ? "none" : "block",
                            fontSize: "0.875rem",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.color = "#991b1b")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.color = "#dc2626")
                          }
                        >
                          Remove
                        </button>
                      </div>

                      {/* Right side: Reading Status */}
                      {selectedLibrary !== "all" && (
                        <select
                          value={paper.readingStatus}
                          onChange={(e) =>
                            handleReadingStatusChange(
                              paper.id,
                              paper.dbPaperId,
                              e.target.value,
                            )
                          }
                          style={{
                            padding: "4px 12px",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            border: "none",
                            cursor: "pointer",
                            ...getStatusColor(paper.readingStatus),
                          }}
                        >
                          <option value="unread">Unread</option>
                          <option value="in_progress">In Progress</option>
                          <option value="read">Read</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes Modal */}
      {notesModal.show && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
            padding: "24px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              width: "100%",
              maxWidth: "896px",
              height: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 32px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#E8EDE8",
                  }}
                >
                  <StickyNote size={20} style={{ color: "#3E513E" }} />
                </div>
                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  Notes for Paper
                </h3>
              </div>
              <button
                onClick={() =>
                  setNotesModal({ show: false, paperId: null, notes: "" })
                }
                style={{
                  padding: "8px",
                  border: "none",
                  background: "transparent",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f3f4f6")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <X size={20} style={{ color: "#6b7280" }} />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}>
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#64748b",
                    marginBottom: "4px",
                  }}
                >
                  Paper Title
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "#1e293b",
                    fontWeight: 500,
                  }}
                >
                  {papers.find((p) => p.id === notesModal.paperId)?.title}
                </p>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    color: "#374151",
                    fontWeight: 500,
                    marginBottom: "8px",
                  }}
                >
                  Your Notes
                </label>
                <textarea
                  value={notesModal.notes}
                  onChange={(e) =>
                    setNotesModal({ ...notesModal, notes: e.target.value })
                  }
                  placeholder="Add your notes here..."
                  style={{
                    width: "100%",
                    minHeight: "200px",
                    padding: "16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    lineHeight: "1.5",
                    resize: "vertical",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 32px",
                borderTop: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
              }}
            >
              <button
                onClick={deleteNotes}
                disabled={!notesModal.notes.trim()}
                style={{
                  padding: "10px 20px",
                  color: !notesModal.notes.trim() ? "#9ca3af" : "#dc2626",
                  backgroundColor: "transparent",
                  border: `1px solid ${!notesModal.notes.trim() ? "#9ca3af" : "#dc2626"}`,
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: !notesModal.notes.trim() ? "not-allowed" : "pointer",
                }}
                onMouseOver={(e) =>
                  !notesModal.notes.trim()
                    ? null
                    : (e.currentTarget.style.backgroundColor = "#fef2f2")
                }
                onMouseOut={(e) =>
                  !notesModal.notes.trim()
                    ? null
                    : (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                Delete Notes
              </button>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <button
                  onClick={() =>
                    setNotesModal({ show: false, paperId: null, notes: "" })
                  }
                  style={{
                    padding: "10px 20px",
                    color: "#6b7280",
                    backgroundColor: "transparent",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f3f4f6")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  Cancel
                </button>
                <button
                  onClick={saveNotes}
                  style={{
                    padding: "10px 20px",
                    color: "white",
                    backgroundColor: "#3E513E",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Library Modal */}
      {showNewLibraryModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "20px",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Create New Library
              </h3>
              <button
                onClick={() => setShowNewLibraryModal(false)}
                style={{
                  padding: "8px",
                  border: "none",
                  background: "transparent",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} style={{ color: "#6b7280" }} />
              </button>
            </div>
            <input
              type="text"
              value={newLibraryName}
              onChange={(e) => setNewLibraryName(e.target.value)}
              placeholder="Enter library name"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "12px",
                outline: "none",
              }}
              onKeyPress={(e) => e.key === "Enter" && handleCreateLibrary()}
            />
            <textarea
              value={newLibraryDescription}
              onChange={(e) => setNewLibraryDescription(e.target.value)}
              placeholder="Enter optional description"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "20px",
                outline: "none",
                resize: "vertical",
                minHeight: "80px",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                onClick={() => {
                  setShowNewLibraryModal(false);
                  setNewLibraryName("");
                  setNewLibraryDescription("");
                }}
                style={{
                  padding: "10px 16px",
                  color: "#6b7280",
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLibrary}
                disabled={!newLibraryName.trim()}
                style={{
                  padding: "10px 16px",
                  color: "white",
                  backgroundColor: newLibraryName.trim()
                    ? "#3E513E"
                    : "#9ca3af",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: newLibraryName.trim() ? "pointer" : "not-allowed",
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Library Modal */}
      {showEditModal && editingLibrary && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "20px",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Edit Library
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingLibrary(null);
                  setNewLibraryName("");
                  setNewLibraryDescription("");
                }}
                style={{
                  padding: "8px",
                  border: "none",
                  background: "transparent",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} style={{ color: "#6b7280" }} />
              </button>
            </div>
            <input
              type="text"
              value={newLibraryName}
              onChange={(e) => setNewLibraryName(e.target.value)}
              placeholder="Enter library name"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "12px",
                outline: "none",
              }}
              onKeyPress={(e) => e.key === "Enter" && handleEditLibrary()}
            />
            <textarea
              value={newLibraryDescription}
              onChange={(e) => setNewLibraryDescription(e.target.value)}
              placeholder="Enter optional description"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "20px",
                outline: "none",
                resize: "vertical",
                minHeight: "80px",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingLibrary(null);
                  setNewLibraryName("");
                  setNewLibraryDescription("");
                }}
                style={{
                  padding: "10px 16px",
                  color: "#6b7280",
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditLibrary}
                disabled={!newLibraryName.trim()}
                style={{
                  padding: "10px 16px",
                  color: "white",
                  backgroundColor: newLibraryName.trim()
                    ? "#3E513E"
                    : "#9ca3af",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: newLibraryName.trim() ? "pointer" : "not-allowed",
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Citation Modal */}
      <CitationModal
        isOpen={citationModal.isOpen}
        onClose={() =>
          setCitationModal({
            isOpen: false,
            paper: null,
          })
        }
        paper={citationModal.paper}
        API_BASE_URL={API_BASE_URL}
      />
    </div>
  );
};

export default ResearchLibrary;
