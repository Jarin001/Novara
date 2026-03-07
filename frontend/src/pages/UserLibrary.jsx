// import React, { useState, useEffect } from "react";
// import invertedCommasIcon from "../images/inverted-commas.png";
// import {
//   FolderOpen,
//   Plus,
//   Edit2,
//   Trash2,
//   FileText,
//   TrendingUp,
//   X,
//   Save,
//   StickyNote,
//   ChevronDown,
//   ChevronRight,
//   Loader2,
// } from "lucide-react";
// import Navbar from "../components/Navbar";
// import CitationModal from "../components/CitationModal";
// import { useNavigate } from "react-router-dom";

// // API Base URL
// const API_BASE_URL =
//   process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

// const ResearchLibrary = () => {
//   const [libraries, setLibraries] = useState([]);
//   const [sharedLibraries, setSharedLibraries] = useState([]);
//   const [isSharedExpanded, setIsSharedExpanded] = useState(true);
//   const [expandedAbstracts, setExpandedAbstracts] = useState({});
//   const [papers, setPapers] = useState([]);
//   const [selectedLibrary, setSelectedLibrary] = useState("all");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortBy, setSortBy] = useState("dateAdded");
//   const [showNewLibraryModal, setShowNewLibraryModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [editingLibrary, setEditingLibrary] = useState(null);
//   const [newLibraryName, setNewLibraryName] = useState("");
//   const [newLibraryDescription, setNewLibraryDescription] = useState("");
//   const [notesModal, setNotesModal] = useState({
//     show: false,
//     paperId: null,
//     notes: "",
//   });
//   const [citationModal, setCitationModal] = useState({
//     isOpen: false,
//     paper: null,
//   });
//   const [loading, setLoading] = useState({
//     libraries: false,
//     papers: false,
//   });
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   // Get auth token
//   const getAuthToken = () => {
//     return localStorage.getItem("access_token");
//   };

//   // Fetch all libraries for the user
//   const fetchLibraries = async () => {
//     try {
//       setLoading((prev) => ({ ...prev, libraries: true }));
//       setError("");

//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       const response = await fetch(`${API_BASE_URL}/api/libraries`, {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (!response.ok) {
//         throw new Error("Failed to fetch libraries");
//       }

//       const data = await response.json();

//       // Separate into owned and shared libraries
//       const myLibraries = data.my_libraries || [];
//       const sharedLibraries = data.shared_with_me || [];

//       setLibraries([
//         { id: "all", name: "All Papers", isDefault: true },
//         ...myLibraries.map((lib) => ({
//           id: lib.id,
//           name: lib.name,
//           isDefault: false,
//           description: lib.description,
//           is_public: lib.is_public,
//           paper_count: lib.paper_count,
//           role: lib.role,
//         })),
//       ]);

//       setSharedLibraries(
//         sharedLibraries.map((lib) => ({
//           id: lib.id,
//           name: lib.name,
//           sharedBy: lib.created_by_user_id ? "User" : "Unknown",
//           isShared: true,
//           description: lib.description,
//           role: lib.role,
//         })),
//       );
//     } catch (err) {
//       console.error("Error fetching libraries:", err);
//       setError("Failed to load libraries. Please try again.");
//     } finally {
//       setLoading((prev) => ({ ...prev, libraries: false }));
//     }
//   };

//   // Fetch papers for selected library
//   const fetchPapers = async (libraryId) => {
//     try {
//       setLoading((prev) => ({ ...prev, papers: true }));
//       setError("");

//       if (libraryId === "all") {
//         // For "All Papers", we need to fetch papers from all libraries
//         await fetchAllPapers();
//         return;
//       }

//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       const response = await fetch(
//         `${API_BASE_URL}/api/libraries/${libraryId}/papers`,
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         },
//       );

//       if (!response.ok) {
//         throw new Error(`Failed to fetch papers for library ${libraryId}`);
//       }

//       const data = await response.json();

//       // Transform backend data to frontend format
//       const transformedPapers =
//         data.papers?.map((paper) => ({
//           id: paper.library_paper_id,
//           dbPaperId: paper.id,
//           s2PaperId: paper.s2_paper_id,
//           title: paper.title,
//           authors: paper.authors || [],
//           venue: paper.venue || "Unknown Venue",
//           date: paper.year ? String(paper.year) : "",
//           citations: paper.citation_count || 0,
//           source: "Database",
//           abstract: paper.abstract || "",
//           libraryId: libraryId,
//           readingStatus: paper.reading_status || "unread",
//           notes: paper.user_note || "",
//           addedDate: new Date(paper.added_at || Date.now()),
//           field: paper.fields_of_study || "",
//           bibtex: paper.bibtex || "",
//         })) || [];

//       setPapers(transformedPapers);
//     } catch (err) {
//       console.error("Error fetching papers:", err);
//       setError("Failed to load papers. Please try again.");
//     } finally {
//       setLoading((prev) => ({ ...prev, papers: false }));
//     }
//   };

//   // Fetch all papers from all libraries
//   const fetchAllPapers = async () => {
//     try {
//       const token = getAuthToken();
//       if (!token) return;

//       // Fetch all unique papers across all libraries from backend
//       const response = await fetch(`${API_BASE_URL}/api/user/papers`, {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (!response.ok) {
//         throw new Error("Failed to fetch all papers");
//       }

//       const data = await response.json();

//       // Transform backend data to frontend format
//       const transformedPapers =
//         data.papers?.map((paper) => ({
//           id: paper.paper_id,
//           dbPaperId: paper.id,
//           s2PaperId: paper.s2_paper_id,
//           title: paper.title,
//           authors: paper.authors || [],
//           venue: paper.venue || "Unknown Venue",
//           date: paper.year ? String(paper.year) : "",
//           citations: paper.citation_count || 0,
//           source: "Database",
//           abstract: paper.abstract || "",
//           libraryId: paper.library_ids?.[0] || "all",
//           readingStatus: paper.reading_statuses?.[0] || "unread",
//           notes: paper.notes?.[0]?.user_note || "",
//           addedDate: new Date(paper.first_added_at || Date.now()),
//           field: paper.fields_of_study || "",
//           bibtex: paper.bibtex || "",
//         })) || [];

//       setPapers(transformedPapers);
//     } catch (err) {
//       console.error("Error fetching all papers:", err);
//     }
//   };

//   // Create new library
//   const handleCreateLibrary = async () => {
//     if (!newLibraryName.trim()) return;

//     try {
//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       const response = await fetch(`${API_BASE_URL}/api/libraries`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           name: newLibraryName.trim(),
//           description: newLibraryDescription.trim(),
//           is_public: false,
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to create library");
//       }

//       const data = await response.json();

//       // Add new library to state
//       const newLib = {
//         id: data.library.id,
//         name: data.library.name,
//         isDefault: false,
//         description: data.library.description,
//         is_public: data.library.is_public,
//         paper_count: 0,
//         role: "creator",
//       };

//       setLibraries((prev) => [
//         { id: "all", name: "All Papers", isDefault: true },
//         ...prev.filter((lib) => lib.id !== "all"),
//         newLib,
//       ]);

//       setNewLibraryName("");
//       setNewLibraryDescription("");
//       setShowNewLibraryModal(false);
//       setError("");
//     } catch (err) {
//       console.error("Error creating library:", err);
//       setError(err.message || "Failed to create library");
//     }
//   };

//   // Edit library
//   const handleEditLibrary = async () => {
//     if (!newLibraryName.trim() || !editingLibrary) return;

//     try {
//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       const response = await fetch(
//         `${API_BASE_URL}/api/libraries/${editingLibrary.id}`,
//         {
//           method: "PUT",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             name: newLibraryName.trim(),
//             description: newLibraryDescription.trim(),
//             is_public: editingLibrary.is_public || false,
//           }),
//         },
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to update library");
//       }

//       const data = await response.json();

//       // Update library in state
//       setLibraries((prev) =>
//         prev.map((lib) =>
//           lib.id === editingLibrary.id
//             ? {
//                 ...lib,
//                 name: data.library.name,
//                 description: data.library.description,
//               }
//             : lib,
//         ),
//       );

//       setNewLibraryName("");
//       setNewLibraryDescription("");
//       setEditingLibrary(null);
//       setShowEditModal(false);
//       setError("");
//     } catch (err) {
//       console.error("Error updating library:", err);
//       setError(err.message || "Failed to update library");
//     }
//   };

//   // Delete library
//   const handleDeleteLibrary = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this library?")) {
//       return;
//     }

//     try {
//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       const response = await fetch(`${API_BASE_URL}/api/libraries/${id}`, {
//         method: "DELETE",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to delete library");
//       }

//       // Remove library from state
//       setLibraries((prev) => prev.filter((lib) => lib.id !== id));

//       if (selectedLibrary === id) {
//         setSelectedLibrary("all");
//       }

//       setError("");
//     } catch (err) {
//       console.error("Error deleting library:", err);
//       setError(err.message || "Failed to delete library");
//     }
//   };

//   // Remove paper from library
//   const handleRemovePaper = async (paperId, dbPaperId) => {
//     if (
//       !window.confirm(
//         "Are you sure you want to remove this paper from the library?",
//       )
//     ) {
//       return;
//     }

//     try {
//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       const response = await fetch(
//         `${API_BASE_URL}/api/libraries/${selectedLibrary}/papers/${dbPaperId}`,
//         {
//           method: "DELETE",
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         },
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to remove paper");
//       }

//       // Remove paper from state
//       setPapers((prev) => prev.filter((p) => p.id !== paperId));
//       setError("");
//     } catch (err) {
//       console.error("Error removing paper:", err);
//       setError(err.message || "Failed to remove paper");
//     }
//   };

//   // Update reading status
//   const handleReadingStatusChange = async (paperId, dbPaperId, status) => {
//     try {
//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       // Find the paper to get its library ID
//       const paper = papers.find((p) => p.id === paperId);
//       if (!paper) {
//         console.error("Paper not found with id:", paperId);
//         console.log(
//           "Available paper ids:",
//           papers.map((p) => p.id),
//         );
//         setError("Paper not found");
//         return;
//       }

//       console.log("Updating reading status for paper:", {
//         paperId,
//         dbPaperId,
//         libraryId: paper.libraryId,
//         status,
//         url: `${API_BASE_URL}/api/libraries/${paper.libraryId}/papers/${dbPaperId}/status`,
//       });

//       // Revert back to using dbPaperId (paper_id from papers table)
//       const response = await fetch(
//         `${API_BASE_URL}/api/libraries/${paper.libraryId}/papers/${dbPaperId}/status`,
//         {
//           method: "PATCH",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ reading_status: status }),
//         },
//       );

//       console.log("Response status:", response.status);

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error("Backend error:", errorData);
//         throw new Error(
//           errorData.message ||
//             `HTTP ${response.status}: Failed to update reading status`,
//         );
//       }

//       const responseData = await response.json();
//       console.log("Success response:", responseData);

//       setPapers((prev) =>
//         prev.map((p) =>
//           p.id === paperId ? { ...p, readingStatus: status } : p,
//         ),
//       );
//       setError("");
//     } catch (err) {
//       console.error("Error updating reading status:", err);
//       setError(err.message || "Failed to update reading status");
//     }
//   };

//   // Save notes
//   const saveNotes = async () => {
//     try {
//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       if (!notesModal.notes.trim()) {
//         deleteNotes();
//         return;
//       }

//       const paper = papers.find((p) => p.id === notesModal.paperId);
//       if (!paper) return;

//       const response = await fetch(
//         `${API_BASE_URL}/api/libraries/${paper.libraryId}/papers/${paper.dbPaperId}/note`,
//         {
//           method: "PATCH",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ user_note: notesModal.notes }),
//         },
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to save note");
//       }

//       setPapers((prev) =>
//         prev.map((p) =>
//           p.id === notesModal.paperId ? { ...p, notes: notesModal.notes } : p,
//         ),
//       );
//       setNotesModal({ show: false, paperId: null, notes: "" });
//       setError("");
//     } catch (err) {
//       console.error("Error saving note:", err);
//       setError("Failed to save note");
//     }
//   };

//   const deleteNotes = async () => {
//     try {
//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       const paper = papers.find((p) => p.id === notesModal.paperId);
//       if (!paper) return;

//       const response = await fetch(
//         `${API_BASE_URL}/api/libraries/${paper.libraryId}/papers/${paper.dbPaperId}/note`,
//         {
//           method: "PATCH",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ user_note: "" }),
//         },
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to delete note");
//       }

//       setPapers((prev) =>
//         prev.map((p) =>
//           p.id === notesModal.paperId ? { ...p, notes: "" } : p,
//         ),
//       );
//       setNotesModal({ show: false, paperId: null, notes: "" });
//       setError("");
//     } catch (err) {
//       console.error("Error deleting note:", err);
//       setError("Failed to delete note");
//     }
//   };

//   // Load data on component mount
//   useEffect(() => {
//     fetchLibraries();
//   }, []);

//   // Fetch papers when selected library changes
//   useEffect(() => {
//     if (selectedLibrary) {
//       fetchPapers(selectedLibrary);
//     }
//   }, [selectedLibrary]);

//   // Filter and sort papers
//   const filteredPapers = papers.filter((p) => {
//     // First filter by library selection
//     const libraryMatch =
//       selectedLibrary === "all"
//         ? true
//         : selectedLibrary.startsWith("s")
//           ? p.libraryId === selectedLibrary
//           : !p.libraryId?.startsWith("s") && p.libraryId === selectedLibrary;

//     // Then filter by search term if it exists
//     if (!searchTerm.trim()) return libraryMatch;

//     const searchLower = searchTerm.toLowerCase();
//     return libraryMatch && p.title.toLowerCase().includes(searchLower);
//   });

//   const sortedPapers = [...filteredPapers].sort((a, b) => {
//     switch (sortBy) {
//       case "citations":
//         return b.citations - a.citations;
//       case "dateAdded":
//         return b.addedDate - a.addedDate;
//       case "datePublished":
//         return new Date(b.date) - new Date(a.date);
//       default:
//         return 0;
//     }
//   });

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "read":
//         return { backgroundColor: "#d1f4e0", color: "#166534" };
//       case "in_progress":
//         return { backgroundColor: "#fef3c7", color: "#854d0e" };
//       case "unread":
//         return { backgroundColor: "#f3f4f6", color: "#1f2937" };
//       default:
//         return { backgroundColor: "#f3f4f6", color: "#1f2937" };
//     }
//   };

//   const toggleAbstract = (paperId) => {
//     setExpandedAbstracts((prev) => ({
//       ...prev,
//       [paperId]: !prev[paperId],
//     }));
//   };

//   // Show loading state until librarie & papers are loaded
//   if (loading.libraries || (papers.length === 0 && loading.papers)) {
//     return (
//       <div
//         style={{
//           height: "100vh",
//           display: "flex",
//           flexDirection: "column",
//           backgroundColor: "#ffffff",
//         }}
//       >
//         <Navbar />
//         <div
//           style={{
//             flex: 1,
//             display: "flex",
//             flexDirection: "column",
//             justifyContent: "center",
//             alignItems: "center",
//             minHeight: "calc(100vh - 80px)",
//             marginTop: "80px",
//           }}
//         >
//           <div
//             className="spinner-border"
//             role="status"
//             style={{
//               width: "3rem",
//               height: "3rem",
//               color: "#2e7d32",
//             }}
//           >
//             <span className="visually-hidden">Loading...</span>
//           </div>
//           <p className="mt-3 text-muted">
//             {loading.libraries ? "Loading libraries..." : "Loading papers..."}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div
//       style={{
//         height: "100vh",
//         display: "flex",
//         flexDirection: "column",
//         backgroundColor: "#F5F5F0",
//       }}
//     >
//       <link
//         href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
//         rel="stylesheet"
//       />

//       {/* Navbar */}
//       <Navbar />

//       {/* Error Message */}
//       {error && (
//         <div
//           style={{
//             position: "fixed",
//             top: "80px",
//             left: "50%",
//             transform: "translateX(-50%)",
//             backgroundColor: "#fef2f2",
//             border: "1px solid #fecaca",
//             color: "#dc2626",
//             padding: "12px 24px",
//             borderRadius: "8px",
//             zIndex: 1000,
//             display: "flex",
//             alignItems: "center",
//             gap: "8px",
//           }}
//         >
//           <span>{error}</span>
//           <button
//             onClick={() => setError("")}
//             style={{
//               background: "none",
//               border: "none",
//               color: "#dc2626",
//               cursor: "pointer",
//             }}
//           >
//             <X size={16} />
//           </button>
//         </div>
//       )}

//       {/* Main Content */}
//       <div
//         style={{
//           display: "flex",
//           flex: 1,
//           overflow: "hidden",
//           marginTop: "64px",
//         }}
//       >
//         {/* Sidebar */}
//         <div
//           style={{
//             width: "256px",
//             backgroundColor: "white",
//             borderRight: "1px solid #e5e7eb",
//             display: "flex",
//             flexDirection: "column",
//           }}
//         >
//           <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
//             <h2
//               style={{
//                 fontSize: "1.0rem",
//                 fontWeight: 600,
//                 color: "#6b7280",
//                 textTransform: "uppercase",
//                 letterSpacing: "0.05em",
//                 margin: "0",
//                 textAlign: "left",
//               }}
//             >
//               Libraries
//             </h2>
//           </div>

//           <div style={{ flex: 1, overflowY: "auto" }}>
//             {libraries.map((library) => (
//               <div
//                 key={library.id}
//                 className="library-item"
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "space-between",
//                   padding: "12px 16px",
//                   cursor: "pointer",
//                   backgroundColor:
//                     selectedLibrary === library.id ? "#E8EDE8" : "white",
//                   borderLeft:
//                     selectedLibrary === library.id
//                       ? "4px solid #3E513E"
//                       : "none",
//                 }}
//                 onMouseEnter={(e) => {
//                   const actions =
//                     e.currentTarget.querySelector(".library-actions");
//                   if (actions && !library.isDefault)
//                     actions.style.opacity = "1";
//                 }}
//                 onMouseLeave={(e) => {
//                   const actions =
//                     e.currentTarget.querySelector(".library-actions");
//                   if (actions) actions.style.opacity = "0";
//                 }}
//                 onClick={() => setSelectedLibrary(library.id)}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: "8px",
//                     flex: 1,
//                     minWidth: 0,
//                   }}
//                 >
//                   <FolderOpen
//                     size={18}
//                     style={{
//                       color:
//                         selectedLibrary === library.id ? "#3E513E" : "#9ca3af",
//                     }}
//                   />
//                   <span
//                     style={{
//                       fontSize: "0.875rem",
//                       color:
//                         selectedLibrary === library.id ? "#3E513E" : "#374151",
//                       fontWeight: selectedLibrary === library.id ? 500 : 400,
//                       overflow: "hidden",
//                       textOverflow: "ellipsis",
//                       whiteSpace: "nowrap",
//                     }}
//                   >
//                     {library.name}{" "}
//                     {library.paper_count !== undefined
//                       ? `(${library.paper_count})`
//                       : ""}
//                   </span>
//                 </div>

//                 {!library.isDefault && (
//                   <div
//                     className="library-actions"
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       gap: "4px",
//                       opacity: 0,
//                       transition: "opacity 0.2s",
//                     }}
//                   >
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         setEditingLibrary(library);
//                         setNewLibraryName(library.name);
//                         setNewLibraryDescription(library.description || "");
//                         setShowEditModal(true);
//                       }}
//                       style={{
//                         padding: "4px",
//                         border: "none",
//                         background: "transparent",
//                         borderRadius: "4px",
//                         cursor: "pointer",
//                       }}
//                       onMouseOver={(e) =>
//                         (e.currentTarget.style.backgroundColor = "#e5e7eb")
//                       }
//                       onMouseOut={(e) =>
//                         (e.currentTarget.style.backgroundColor = "transparent")
//                       }
//                     >
//                       <Edit2 size={14} style={{ color: "#6b7280" }} />
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleDeleteLibrary(library.id);
//                       }}
//                       style={{
//                         padding: "4px",
//                         border: "none",
//                         background: "transparent",
//                         borderRadius: "4px",
//                         cursor: "pointer",
//                       }}
//                       onMouseOver={(e) =>
//                         (e.currentTarget.style.backgroundColor = "#e5e7eb")
//                       }
//                       onMouseOut={(e) =>
//                         (e.currentTarget.style.backgroundColor = "transparent")
//                       }
//                     >
//                       <Trash2 size={14} style={{ color: "#6b7280" }} />
//                     </button>
//                   </div>
//                 )}
//               </div>
//             ))}

//             {/* Shared Libraries Section */}
//             {sharedLibraries.length > 0 && (
//               <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "8px" }}>
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "space-between",
//                     padding: "12px 16px",
//                     cursor: "pointer",
//                     backgroundColor: "white",
//                   }}
//                   onClick={() => setIsSharedExpanded(!isSharedExpanded)}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       gap: "8px",
//                     }}
//                   >
//                     {isSharedExpanded ? (
//                       <ChevronDown size={16} />
//                     ) : (
//                       <ChevronRight size={16} />
//                     )}
//                     <span
//                       style={{
//                         fontSize: "0.875rem",
//                         color: "#374151",
//                         fontWeight: 500,
//                       }}
//                     >
//                       Shared ({sharedLibraries.length})
//                     </span>
//                   </div>
//                 </div>

//                 {isSharedExpanded &&
//                   sharedLibraries.map((library) => (
//                     <div
//                       key={library.id}
//                       className="library-item"
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "space-between",
//                         padding: "12px 16px 12px 40px",
//                         cursor: "pointer",
//                         backgroundColor:
//                           selectedLibrary === library.id ? "#E8EDE8" : "white",
//                         borderLeft:
//                           selectedLibrary === library.id
//                             ? "4px solid #3E513E"
//                             : "none",
//                       }}
//                       onClick={() => setSelectedLibrary(library.id)}
//                     >
//                       <div
//                         style={{
//                           display: "flex",
//                           flexDirection: "column",
//                           flex: 1,
//                           minWidth: 0,
//                         }}
//                       >
//                         <span
//                           style={{
//                             fontSize: "0.875rem",
//                             color:
//                               selectedLibrary === library.id
//                                 ? "#3E513E"
//                                 : "#374151",
//                             fontWeight:
//                               selectedLibrary === library.id ? 500 : 400,
//                             overflow: "hidden",
//                             textOverflow: "ellipsis",
//                             whiteSpace: "nowrap",
//                           }}
//                         >
//                           {library.name}
//                         </span>
//                         <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
//                           by {library.sharedBy}
//                         </span>
//                       </div>
//                     </div>
//                   ))}
//               </div>
//             )}
//           </div>

//           <div style={{ padding: "16px", borderTop: "1px solid #e5e7eb" }}>
//             <button
//               onClick={() => setShowNewLibraryModal(true)}
//               style={{
//                 width: "100%",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 gap: "8px",
//                 padding: "8px 16px",
//                 color: "white",
//                 backgroundColor: "#3E513E",
//                 border: "none",
//                 borderRadius: "8px",
//                 fontSize: "0.875rem",
//                 fontWeight: 500,
//                 cursor: "pointer",
//               }}
//               onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
//               onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
//             >
//               <Plus size={18} />
//               New Library
//             </button>
//           </div>
//         </div>

//         {/* Papers List */}
//         <div
//           style={{
//             flex: 1,
//             display: "flex",
//             flexDirection: "column",
//             overflow: "hidden",
//             backgroundColor: "white",
//           }}
//         >
//           {/* Header */}
//           <div
//             style={{ borderBottom: "1px solid #e5e7eb", padding: "16px 24px" }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 marginBottom: "16px",
//               }}
//             >
//               <div
//                 style={{ display: "flex", alignItems: "center", gap: "12px" }}
//               >
//                 <FolderOpen size={24} style={{ color: "#3E513E" }} />
//                 <h2
//                   style={{
//                     fontSize: "1.25rem",
//                     fontWeight: 600,
//                     color: "#111827",
//                     margin: 0,
//                   }}
//                 >
//                   {selectedLibrary === "all"
//                     ? "All Papers"
//                     : libraries.find((l) => l.id === selectedLibrary)?.name ||
//                       sharedLibraries.find((l) => l.id === selectedLibrary)
//                         ?.name ||
//                       "Library"}
//                 </h2>
//               </div>
//               <div
//                 style={{ display: "flex", alignItems: "center", gap: "12px" }}
//               >
//                 <button
//                   style={{
//                     padding: "8px 16px",
//                     borderRadius: "8px",
//                     fontSize: "0.875rem",
//                     fontWeight: 500,
//                     color: "#3E513E",
//                     backgroundColor: "#E8EDE8",
//                     border: "none",
//                     cursor: "pointer",
//                   }}
//                   onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
//                   onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
//                 >
//                   Share
//                 </button>
//                 <button
//                   onClick={() =>
//                     navigate("/bibtex", {
//                       state: {
//                         selectedLibrary,
//                         libraries,
//                         sharedLibraries,
//                         papers,
//                       },
//                     })
//                   }
//                   style={{
//                     padding: "8px 16px",
//                     color: "#6b7280",
//                     backgroundColor: "transparent",
//                     border: "none",
//                     borderRadius: "8px",
//                     fontSize: "0.875rem",
//                     fontWeight: 500,
//                     cursor: "pointer",
//                   }}
//                   onMouseOver={(e) =>
//                     (e.currentTarget.style.backgroundColor = "#f3f4f6")
//                   }
//                   onMouseOut={(e) =>
//                     (e.currentTarget.style.backgroundColor = "transparent")
//                   }
//                 >
//                   BibTeX
//                 </button>
//               </div>
//             </div>

//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//               }}
//             >
//               <div style={{ flex: 1, maxWidth: "448px" }}>
//                 <input
//                   type="text"
//                   placeholder="Search Papers"
//                   className="form-control"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   style={{
//                     padding: "8px 16px",
//                     border: "1px solid #d1d5db",
//                     borderRadius: "8px",
//                   }}
//                 />
//               </div>
//               <select
//                 value={sortBy}
//                 onChange={(e) => setSortBy(e.target.value)}
//                 className="form-select"
//                 style={{
//                   width: "auto",
//                   padding: "8px 16px",
//                   border: "1px solid #d1d5db",
//                   borderRadius: "8px",
//                   fontSize: "0.875rem",
//                 }}
//               >
//                 <option value="dateAdded">Sort by Date Added</option>
//                 <option value="citations">Sort by Citations</option>
//                 <option value="datePublished">Sort by Publication Date</option>
//               </select>
//             </div>
//           </div>

//           {/* Papers */}
//           <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
//             {loading.papers ? (
//               <div
//                 style={{
//                   display: "flex",
//                   flexDirection: "column",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   height: "100%",
//                   color: "#9ca3af",
//                 }}
//               >
//                 <div
//                   className="spinner-border"
//                   role="status"
//                   style={{
//                     width: "3rem",
//                     height: "3rem",
//                     color: "#2e7d32",
//                     marginBottom: "16px",
//                   }}
//                 >
//                   <span className="visually-hidden">Loading...</span>
//                 </div>
//                 <p className="text-muted">Loading papers...</p>
//               </div>
//             ) : sortedPapers.length === 0 ? (
//               <div
//                 style={{
//                   display: "flex",
//                   flexDirection: "column",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   height: "100%",
//                   color: "#9ca3af",
//                 }}
//               >
//                 <FileText size={64} style={{ marginBottom: "16px" }} />
//                 <p style={{ fontSize: "1.125rem" }}>
//                   No papers in this library
//                 </p>
//                 {selectedLibrary !== "all" && (
//                   <p style={{ fontSize: "0.875rem", marginTop: "8px" }}>
//                     Add papers to this library to see them here
//                   </p>
//                 )}
//               </div>
//             ) : (
//               <div
//                 style={{
//                   display: "flex",
//                   flexDirection: "column",
//                   gap: "24px",
//                 }}
//               >
//                 {sortedPapers.map((paper) => (
//                   <div
//                     key={paper.id}
//                     style={{
//                       borderBottom: "1px solid #eee",
//                       paddingBottom: "24px",
//                       padding: "18px 0",
//                     }}
//                   >
//                     {/* Title with Note Icon */}
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "flex-start",
//                         gap: "8px",
//                         marginBottom: "8px",
//                       }}
//                     >
//                       <button
//                         onClick={() => navigate(`/paper/${paper.s2PaperId}`)}
//                         style={{
//                           fontSize: "20px",
//                           fontWeight: 600,
//                           color: "#3E513E",
//                           cursor: "pointer",
//                           flex: 1,
//                           margin: 0,
//                           textAlign: "left",
//                           background: "transparent",
//                           border: "none",
//                           padding: 0,
//                         }}
//                         onMouseOver={(e) =>
//                           (e.currentTarget.style.opacity = "0.8")
//                         }
//                         onMouseOut={(e) =>
//                           (e.currentTarget.style.opacity = "1")
//                         }
//                       >
//                         {paper.title}
//                       </button>
//                       {selectedLibrary !== "all" && (
//                         <button
//                           onClick={() =>
//                             setNotesModal({
//                               show: true,
//                               paperId: paper.id,
//                               notes: paper.notes || "",
//                             })
//                           }
//                           title="Add/Edit Notes"
//                           style={{
//                             padding: "4px",
//                             border: "none",
//                             background: "transparent",
//                             borderRadius: "4px",
//                             cursor: "pointer",
//                             flexShrink: 0,
//                           }}
//                           onMouseOver={(e) =>
//                             (e.currentTarget.style.backgroundColor = "#f3f4f6")
//                           }
//                           onMouseOut={(e) =>
//                             (e.currentTarget.style.backgroundColor =
//                               "transparent")
//                           }
//                         >
//                           <StickyNote
//                             size={18}
//                             style={{
//                               color: paper.notes ? "#ca8a04" : "#9ca3af",
//                             }}
//                             fill={paper.notes ? "#fef3c7" : "none"}
//                           />
//                         </button>
//                       )}
//                     </div>

//                     {/* Authors */}

//                     <div
//                       style={{
//                         marginTop: "8px",
//                         display: "flex",
//                         gap: "8px",
//                         flexWrap: "wrap",
//                         alignItems: "center",
//                         marginBottom: "8px",
//                       }}
//                     >
//                       {Array.isArray(paper.authors) && paper.authors.length > 0
//                         ? paper.authors.map((a, idx) => (
//                             <span
//                               key={idx}
//                               style={{
//                                 background: "#f2f2f2",
//                                 padding: "4px 8px",
//                                 borderRadius: "4px",
//                                 fontSize: "12px",
//                               }}
//                             >
//                               {typeof a === "object" ? a.name || "" : a || ""}
//                             </span>
//                           ))
//                         : ""}

//                       {/* Field of Study*/}

//                       {paper.field && (
//                         <>
//                           {(Array.isArray(paper.field) ? paper.field : []).map(
//                             (f, idx) => (
//                               <span
//                                 key={idx}
//                                 style={{
//                                   background: "#e8f4f8",
//                                   padding: "4px 8px",
//                                   borderRadius: "4px",
//                                   fontSize: "11px",
//                                   color: "#1a73e8",
//                                   fontWeight: 400,
//                                 }}
//                               >
//                                 {typeof f === "object" ? f.name || "" : f || ""}
//                               </span>
//                             ),
//                           )}
//                         </>
//                       )}
//                     </div>

//                     {/* Venue and Date */}
//                     <div
//                       style={{
//                         fontSize: "13px",
//                         color: "#888",
//                         marginBottom: "10px",
//                       }}
//                     >
//                       {paper.venue} · {paper.date}
//                     </div>

//                     {/* Abstract */}

//                     <p
//                       style={{
//                         fontSize: "0.875rem",
//                         color: "#444",
//                         marginBottom: "12px",
//                         lineHeight: "1.5",
//                       }}
//                     >
//                       {paper.abstract ? (
//                         expandedAbstracts[paper.id] ? (
//                           paper.abstract
//                         ) : (
//                           <>
//                             {paper.abstract.length > 300
//                               ? `${paper.abstract.substring(0, 300)}... `
//                               : paper.abstract}
//                             {paper.abstract.length > 300 && (
//                               <a
//                                 href="#"
//                                 onClick={(e) => {
//                                   e.preventDefault();
//                                   toggleAbstract(paper.id);
//                                 }}
//                                 style={{
//                                   color: "#3E513E",
//                                   textDecoration: "none",
//                                   cursor: "pointer",
//                                 }}
//                                 onMouseOver={(e) =>
//                                   (e.currentTarget.style.textDecoration =
//                                     "underline")
//                                 }
//                                 onMouseOut={(e) =>
//                                   (e.currentTarget.style.textDecoration =
//                                     "none")
//                                 }
//                               >
//                                 Expand
//                               </a>
//                             )}
//                           </>
//                         )
//                       ) : (
//                         "No abstract available"
//                       )}
//                       {expandedAbstracts[paper.id] &&
//                         paper.abstract &&
//                         paper.abstract.length > 300 && (
//                           <a
//                             href="#"
//                             onClick={(e) => {
//                               e.preventDefault();
//                               toggleAbstract(paper.id);
//                             }}
//                             style={{
//                               color: "#3E513E",
//                               textDecoration: "none",
//                               cursor: "pointer",
//                               marginLeft: "8px",
//                             }}
//                             onMouseOver={(e) =>
//                               (e.currentTarget.style.textDecoration =
//                                 "underline")
//                             }
//                             onMouseOut={(e) =>
//                               (e.currentTarget.style.textDecoration = "none")
//                             }
//                           >
//                             Show less
//                           </a>
//                         )}
//                     </p>

//                     {/* Bottom Actions */}

//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "space-between",
//                         marginTop: "12px",
//                       }}
//                     >
//                       {/* Left side: Citations, Cite, Remove buttons */}
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           gap: "12px",
//                         }}
//                       >
//                         {/* Citations Count */}

//                         <span
//                           style={{
//                             display: "inline-flex",
//                             alignItems: "center",
//                             gap: "6px",
//                             padding: "6px 10px",
//                             background: "#f5f5f5",
//                             border: "1px solid #e0e0e0",
//                             borderRadius: "4px",
//                             fontSize: "12px",
//                             color: "#333",
//                             fontWeight: 500,
//                           }}
//                         >
//                           <img
//                             src={invertedCommasIcon}
//                             alt="Citations"
//                             style={{
//                               width: "12px",
//                               height: "12px",
//                               opacity: 0.8,
//                             }}
//                           />
//                           {paper.citations}
//                         </span>

//                         {/* Cite Button */}
//                         <button
//                           onClick={() =>
//                             setCitationModal({
//                               isOpen: true,
//                               paper,
//                             })
//                           }
//                           style={{
//                             display: "inline-flex",
//                             alignItems: "center",
//                             gap: "6px",
//                             padding: "6px 10px",
//                             background: "#fff",
//                             border: "1px solid #e0e0e0",
//                             borderRadius: "4px",
//                             fontSize: "12px",
//                             color: "#333",
//                             cursor: "pointer",
//                             fontWeight: 500,
//                             whiteSpace: "nowrap",
//                           }}
//                           onMouseOver={(e) =>
//                             (e.currentTarget.style.opacity = "0.8")
//                           }
//                           onMouseOut={(e) =>
//                             (e.currentTarget.style.opacity = "1")
//                           }
//                         >
//                           <img
//                             src={invertedCommasIcon}
//                             alt="Cite"
//                             style={{ width: "12px", height: "12px" }}
//                           />
//                           Cite
//                         </button>

//                         {/* Remove button */}
//                         <button
//                           onClick={() =>
//                             handleRemovePaper(paper.id, paper.dbPaperId)
//                           }
//                           style={{
//                             color: "#dc2626",
//                             background: "none",
//                             border: "none",
//                             cursor: "pointer",
//                             padding: 0,
//                             display:
//                               selectedLibrary === "all" ? "none" : "block",
//                             fontSize: "0.875rem",
//                           }}
//                           onMouseOver={(e) =>
//                             (e.currentTarget.style.color = "#991b1b")
//                           }
//                           onMouseOut={(e) =>
//                             (e.currentTarget.style.color = "#dc2626")
//                           }
//                         >
//                           Remove
//                         </button>
//                       </div>

//                       {/* Right side: Reading Status */}
//                       {selectedLibrary !== "all" && (
//                         <select
//                           value={paper.readingStatus}
//                           onChange={(e) =>
//                             handleReadingStatusChange(
//                               paper.id,
//                               paper.dbPaperId,
//                               e.target.value,
//                             )
//                           }
//                           style={{
//                             padding: "4px 12px",
//                             borderRadius: "9999px",
//                             fontSize: "0.75rem",
//                             fontWeight: 500,
//                             border: "none",
//                             cursor: "pointer",
//                             ...getStatusColor(paper.readingStatus),
//                           }}
//                         >
//                           <option value="unread">Unread</option>
//                           <option value="in_progress">In Progress</option>
//                           <option value="read">Read</option>
//                         </select>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Notes Modal */}
//       {notesModal.show && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             backgroundColor: "rgba(0, 0, 0, 0.6)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 1050,
//             padding: "24px",
//           }}
//         >
//           <div
//             style={{
//               backgroundColor: "white",
//               borderRadius: "16px",
//               boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
//               width: "100%",
//               maxWidth: "896px",
//               height: "85vh",
//               display: "flex",
//               flexDirection: "column",
//             }}
//           >
//             {/* Header */}
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 padding: "20px 32px",
//                 borderBottom: "1px solid #e5e7eb",
//               }}
//             >
//               <div
//                 style={{ display: "flex", alignItems: "center", gap: "12px" }}
//               >
//                 <div
//                   style={{
//                     width: "40px",
//                     height: "40px",
//                     borderRadius: "50%",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     backgroundColor: "#E8EDE8",
//                   }}
//                 >
//                   <StickyNote size={20} style={{ color: "#3E513E" }} />
//                 </div>
//                 <h3
//                   style={{
//                     fontSize: "1.5rem",
//                     fontWeight: 600,
//                     color: "#111827",
//                     margin: 0,
//                   }}
//                 >
//                   Notes for Paper
//                 </h3>
//               </div>
//               <button
//                 onClick={() =>
//                   setNotesModal({ show: false, paperId: null, notes: "" })
//                 }
//                 style={{
//                   padding: "8px",
//                   border: "none",
//                   background: "transparent",
//                   borderRadius: "4px",
//                   cursor: "pointer",
//                 }}
//                 onMouseOver={(e) =>
//                   (e.currentTarget.style.backgroundColor = "#f3f4f6")
//                 }
//                 onMouseOut={(e) =>
//                   (e.currentTarget.style.backgroundColor = "transparent")
//                 }
//               >
//                 <X size={20} style={{ color: "#6b7280" }} />
//               </button>
//             </div>

//             {/* Content */}
//             <div style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}>
//               <div
//                 style={{
//                   backgroundColor: "#f8fafc",
//                   borderRadius: "8px",
//                   padding: "16px",
//                   marginBottom: "16px",
//                 }}
//               >
//                 <p
//                   style={{
//                     fontSize: "0.875rem",
//                     color: "#64748b",
//                     marginBottom: "4px",
//                   }}
//                 >
//                   Paper Title
//                 </p>
//                 <p
//                   style={{
//                     fontSize: "1rem",
//                     color: "#1e293b",
//                     fontWeight: 500,
//                   }}
//                 >
//                   {papers.find((p) => p.id === notesModal.paperId)?.title}
//                 </p>
//               </div>

//               <div style={{ marginBottom: "24px" }}>
//                 <label
//                   style={{
//                     display: "block",
//                     fontSize: "0.875rem",
//                     color: "#374151",
//                     fontWeight: 500,
//                     marginBottom: "8px",
//                   }}
//                 >
//                   Your Notes
//                 </label>
//                 <textarea
//                   value={notesModal.notes}
//                   onChange={(e) =>
//                     setNotesModal({ ...notesModal, notes: e.target.value })
//                   }
//                   placeholder="Add your notes here..."
//                   style={{
//                     width: "100%",
//                     minHeight: "200px",
//                     padding: "16px",
//                     border: "1px solid #d1d5db",
//                     borderRadius: "8px",
//                     fontSize: "0.875rem",
//                     lineHeight: "1.5",
//                     resize: "vertical",
//                     outline: "none",
//                   }}
//                 />
//               </div>
//             </div>

//             {/* Footer */}
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 padding: "20px 32px",
//                 borderTop: "1px solid #e5e7eb",
//                 backgroundColor: "#f9fafb",
//               }}
//             >
//               <button
//                 onClick={deleteNotes}
//                 disabled={!notesModal.notes.trim()}
//                 style={{
//                   padding: "10px 20px",
//                   color: !notesModal.notes.trim() ? "#9ca3af" : "#dc2626",
//                   backgroundColor: "transparent",
//                   border: `1px solid ${!notesModal.notes.trim() ? "#9ca3af" : "#dc2626"}`,
//                   borderRadius: "8px",
//                   fontSize: "0.875rem",
//                   fontWeight: 500,
//                   cursor: !notesModal.notes.trim() ? "not-allowed" : "pointer",
//                 }}
//                 onMouseOver={(e) =>
//                   !notesModal.notes.trim()
//                     ? null
//                     : (e.currentTarget.style.backgroundColor = "#fef2f2")
//                 }
//                 onMouseOut={(e) =>
//                   !notesModal.notes.trim()
//                     ? null
//                     : (e.currentTarget.style.backgroundColor = "transparent")
//                 }
//               >
//                 Delete Notes
//               </button>
//               <div
//                 style={{ display: "flex", alignItems: "center", gap: "12px" }}
//               >
//                 <button
//                   onClick={() =>
//                     setNotesModal({ show: false, paperId: null, notes: "" })
//                   }
//                   style={{
//                     padding: "10px 20px",
//                     color: "#6b7280",
//                     backgroundColor: "transparent",
//                     border: "1px solid #d1d5db",
//                     borderRadius: "8px",
//                     fontSize: "0.875rem",
//                     fontWeight: 500,
//                     cursor: "pointer",
//                   }}
//                   onMouseOver={(e) =>
//                     (e.currentTarget.style.backgroundColor = "#f3f4f6")
//                   }
//                   onMouseOut={(e) =>
//                     (e.currentTarget.style.backgroundColor = "transparent")
//                   }
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={saveNotes}
//                   style={{
//                     padding: "10px 20px",
//                     color: "white",
//                     backgroundColor: "#3E513E",
//                     border: "none",
//                     borderRadius: "8px",
//                     fontSize: "0.875rem",
//                     fontWeight: 500,
//                     cursor: "pointer",
//                   }}
//                   onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
//                   onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
//                 >
//                   Save Notes
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* New Library Modal */}
//       {showNewLibraryModal && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             backgroundColor: "rgba(0, 0, 0, 0.5)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 1050,
//           }}
//         >
//           <div
//             style={{
//               backgroundColor: "white",
//               borderRadius: "8px",
//               padding: "20px",
//               width: "90%",
//               maxWidth: "500px",
//               boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 marginBottom: "20px",
//               }}
//             >
//               <h3
//                 style={{
//                   fontSize: "18px",
//                   fontWeight: 600,
//                   color: "#111827",
//                   margin: 0,
//                 }}
//               >
//                 Create New Library
//               </h3>
//               <button
//                 onClick={() => setShowNewLibraryModal(false)}
//                 style={{
//                   padding: "8px",
//                   border: "none",
//                   background: "transparent",
//                   borderRadius: "4px",
//                   cursor: "pointer",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//               >
//                 <X size={20} style={{ color: "#6b7280" }} />
//               </button>
//             </div>
//             <input
//               type="text"
//               value={newLibraryName}
//               onChange={(e) => setNewLibraryName(e.target.value)}
//               placeholder="Enter library name"
//               style={{
//                 width: "100%",
//                 padding: "10px 12px",
//                 border: "1px solid #d1d5db",
//                 borderRadius: "6px",
//                 fontSize: "14px",
//                 marginBottom: "12px",
//                 outline: "none",
//               }}
//               onKeyPress={(e) => e.key === "Enter" && handleCreateLibrary()}
//             />
//             <textarea
//               value={newLibraryDescription}
//               onChange={(e) => setNewLibraryDescription(e.target.value)}
//               placeholder="Enter optional description"
//               style={{
//                 width: "100%",
//                 padding: "10px 12px",
//                 border: "1px solid #d1d5db",
//                 borderRadius: "6px",
//                 fontSize: "14px",
//                 marginBottom: "20px",
//                 outline: "none",
//                 resize: "vertical",
//                 minHeight: "80px",
//               }}
//             />
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "flex-end",
//                 gap: "12px",
//               }}
//             >
//               <button
//                 onClick={() => {
//                   setShowNewLibraryModal(false);
//                   setNewLibraryName("");
//                   setNewLibraryDescription("");
//                 }}
//                 style={{
//                   padding: "10px 16px",
//                   color: "#6b7280",
//                   backgroundColor: "#f3f4f6",
//                   border: "1px solid #d1d5db",
//                   borderRadius: "6px",
//                   fontSize: "14px",
//                   fontWeight: 500,
//                   cursor: "pointer",
//                 }}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleCreateLibrary}
//                 disabled={!newLibraryName.trim()}
//                 style={{
//                   padding: "10px 16px",
//                   color: "white",
//                   backgroundColor: newLibraryName.trim()
//                     ? "#3E513E"
//                     : "#9ca3af",
//                   border: "none",
//                   borderRadius: "6px",
//                   fontSize: "14px",
//                   fontWeight: 500,
//                   cursor: newLibraryName.trim() ? "pointer" : "not-allowed",
//                 }}
//               >
//                 Create
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit Library Modal */}
//       {showEditModal && editingLibrary && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             backgroundColor: "rgba(0, 0, 0, 0.5)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 1050,
//           }}
//         >
//           <div
//             style={{
//               backgroundColor: "white",
//               borderRadius: "8px",
//               padding: "20px",
//               width: "90%",
//               maxWidth: "500px",
//               boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 marginBottom: "20px",
//               }}
//             >
//               <h3
//                 style={{
//                   fontSize: "18px",
//                   fontWeight: 600,
//                   color: "#111827",
//                   margin: 0,
//                 }}
//               >
//                 Edit Library
//               </h3>
//               <button
//                 onClick={() => {
//                   setShowEditModal(false);
//                   setEditingLibrary(null);
//                   setNewLibraryName("");
//                   setNewLibraryDescription("");
//                 }}
//                 style={{
//                   padding: "8px",
//                   border: "none",
//                   background: "transparent",
//                   borderRadius: "4px",
//                   cursor: "pointer",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//               >
//                 <X size={20} style={{ color: "#6b7280" }} />
//               </button>
//             </div>
//             <input
//               type="text"
//               value={newLibraryName}
//               onChange={(e) => setNewLibraryName(e.target.value)}
//               placeholder="Enter library name"
//               style={{
//                 width: "100%",
//                 padding: "10px 12px",
//                 border: "1px solid #d1d5db",
//                 borderRadius: "6px",
//                 fontSize: "14px",
//                 marginBottom: "12px",
//                 outline: "none",
//               }}
//               onKeyPress={(e) => e.key === "Enter" && handleEditLibrary()}
//             />
//             <textarea
//               value={newLibraryDescription}
//               onChange={(e) => setNewLibraryDescription(e.target.value)}
//               placeholder="Enter optional description"
//               style={{
//                 width: "100%",
//                 padding: "10px 12px",
//                 border: "1px solid #d1d5db",
//                 borderRadius: "6px",
//                 fontSize: "14px",
//                 marginBottom: "20px",
//                 outline: "none",
//                 resize: "vertical",
//                 minHeight: "80px",
//               }}
//             />
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "flex-end",
//                 gap: "12px",
//               }}
//             >
//               <button
//                 onClick={() => {
//                   setShowEditModal(false);
//                   setEditingLibrary(null);
//                   setNewLibraryName("");
//                   setNewLibraryDescription("");
//                 }}
//                 style={{
//                   padding: "10px 16px",
//                   color: "#6b7280",
//                   backgroundColor: "#f3f4f6",
//                   border: "1px solid #d1d5db",
//                   borderRadius: "6px",
//                   fontSize: "14px",
//                   fontWeight: 500,
//                   cursor: "pointer",
//                 }}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleEditLibrary}
//                 disabled={!newLibraryName.trim()}
//                 style={{
//                   padding: "10px 16px",
//                   color: "white",
//                   backgroundColor: newLibraryName.trim()
//                     ? "#3E513E"
//                     : "#9ca3af",
//                   border: "none",
//                   borderRadius: "6px",
//                   fontSize: "14px",
//                   fontWeight: 500,
//                   cursor: newLibraryName.trim() ? "pointer" : "not-allowed",
//                 }}
//               >
//                 Save Changes
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Citation Modal */}
//       <CitationModal
//         isOpen={citationModal.isOpen}
//         onClose={() =>
//           setCitationModal({
//             isOpen: false,
//             paper: null,
//           })
//         }
//         paper={citationModal.paper}
//         API_BASE_URL={API_BASE_URL}
//       />
//     </div>
//   );
// };

// export default ResearchLibrary;




















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
  Share2,
  UserPlus,
  Check,
  Search,
  Star,
  Users,
  Book,
  Calendar,
  Clock,
  User,
  Info,
  Mail,
} from "lucide-react";
import Navbar from "../components/Navbar";
import CitationModal from "../components/CitationModal";
import { useNavigate } from "react-router-dom";

// API Base URL
const API_BASE_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5050";

// Share Library Modal Component
const ShareLibraryModal = ({
  isOpen,
  onClose,
  library,
  onShare,
  API_BASE_URL,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Debounce search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_BASE_URL}/api/users/search?query=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to search users");

      const data = await response.json();
      // Filter out already selected users
      const filteredResults = (data.authors || []).filter(
        (user) => !selectedUsers.find((u) => u.id === user.id),
      );
      setSearchResults(filteredResults);
    } catch (err) {
      console.error("Error searching users:", err);
      setError("Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setSharing(true);
      setError("");
      setSuccess("");
      const token = localStorage.getItem("access_token");

      // Share with each selected user
      for (const user of selectedUsers) {
        const response = await fetch(
          `${API_BASE_URL}/api/libraries/${library.id}/share`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ recipient_id: user.id }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          // Show specific error message from backend
          throw new Error(
            errorData.message || `Failed to share with ${user.name}`,
          );
        }
      }

      setSuccess(
        `Library shared with ${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""}`,
      );
      setTimeout(() => {
        onShare(selectedUsers);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error sharing library:", err);
      setError(err.message || "Failed to share library");
    } finally {
      setSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
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
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          width: "90%",
          maxWidth: "500px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
              <Share2 size={20} style={{ color: "#3E513E" }} />
            </div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#111827",
                margin: 0,
              }}
            >
              Share Library
            </h3>
          </div>
          <button
            onClick={onClose}
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

        {/* Library Info */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              color: "#64748b",
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Sharing
          </p>
          <p
            style={{
              fontSize: "1rem",
              color: "#1e293b",
              fontWeight: 500,
              margin: 0,
            }}
          >
            {library?.name}
          </p>
          {library?.description && (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#64748b",
                marginTop: "4px",
                marginBottom: 0,
              }}
            >
              {library.description}
            </p>
          )}
        </div>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#374151",
                fontWeight: 500,
                marginBottom: "8px",
              }}
            >
              Selected Users ({selectedUsers.length})
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px 4px 12px",
                    backgroundColor: "#E8EDE8",
                    borderRadius: "16px",
                    fontSize: "0.875rem",
                  }}
                >
                  <span style={{ color: "#3E513E" }}>{user.name}</span>
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    style={{
                      padding: "2px",
                      border: "none",
                      background: "transparent",
                      borderRadius: "50%",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgba(0,0,0,0.1)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <X size={14} style={{ color: "#3E513E" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Input */}
        <div style={{ marginBottom: "16px", position: "relative" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name..."
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

          {/* Search Results Dropdown */}
          {searchQuery.length >= 2 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                marginTop: "4px",
                maxHeight: "240px",
                overflowY: "auto",
                zIndex: 10,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            >
              {loading ? (
                <div
                  style={{
                    padding: "12px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    style={{
                      padding: "10px 12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f9fafb")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "white")
                    }
                  >
                    {user.profile_picture_url ? (
                      <img
                        src={user.profile_picture_url}
                        alt={user.name}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "#E8EDE8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#3E513E",
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#111827",
                        }}
                      >
                        {user.name}
                      </div>
                      {user.affiliation && (
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          {user.affiliation}
                        </div>
                      )}
                    </div>
                    <button
                      style={{
                        padding: "4px",
                        border: "none",
                        background: "transparent",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      <UserPlus size={16} style={{ color: "#3E513E" }} />
                    </button>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "12px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  No users found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "0.875rem",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              backgroundColor: "#d1fae5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "0.875rem",
              marginBottom: "16px",
            }}
          >
            {success}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "20px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              color: "#6b7280",
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#e5e7eb")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#f3f4f6")
            }
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={selectedUsers.length === 0 || sharing}
            style={{
              padding: "10px 16px",
              color: "white",
              backgroundColor:
                selectedUsers.length === 0 ? "#9ca3af" : "#3E513E",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: selectedUsers.length === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseOver={(e) => {
              if (selectedUsers.length > 0 && !sharing) {
                e.currentTarget.style.backgroundColor = "#2D3A2D";
              }
            }}
            onMouseOut={(e) => {
              if (selectedUsers.length > 0 && !sharing) {
                e.currentTarget.style.backgroundColor = "#3E513E";
              }
            }}
          >
            {sharing ? (
              <>
                <Loader2 size={16} className="spinner" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 size={16} />
                Share with {selectedUsers.length} user
                {selectedUsers.length !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const ResearchLibrary = () => {
  const [myLibraries, setMyLibraries] = useState([]);
  const [sharedWithOthers, setSharedWithOthers] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [isMyLibrariesExpanded, setIsMyLibrariesExpanded] = useState(true);
  const [isSharedWithOthersExpanded, setIsSharedWithOthersExpanded] = useState(true);
  const [isSharedWithMeExpanded, setIsSharedWithMeExpanded] = useState(true);
  const [expandedAbstracts, setExpandedAbstracts] = useState({});
  const [papers, setPapers] = useState([]);
  const [selectedLibrary, setSelectedLibrary] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dateAdded");
  const [showNewLibraryModal, setShowNewLibraryModal] = useState(false);
  const [showEditSidebar, setShowEditSidebar] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState(null);
  const [sharingLibrary, setSharingLibrary] = useState(null);
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
      console.log("fetchLibraries called");
      setLoading((prev) => ({ ...prev, libraries: true }));
      setError("");

      const token = getAuthToken();
      if (!token) {
        console.error("No auth token found");
        navigate("/login");
        return;
      }
      console.log("Auth token found, fetching from:", `${API_BASE_URL}/api/libraries`);

      const response = await fetch(`${API_BASE_URL}/api/libraries`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response received, status:", response.status, "ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response error:", response.status, errorText);
        throw new Error(`Failed to fetch libraries: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("JSON parsed successfully");
      
      if (!data) {
        console.error("Empty response from backend");
        throw new Error("Empty response from backend");
      }
      
      console.log("Raw backend response:", JSON.stringify(data, null, 2));
      
      // Process my_libraries - backend returns: id, name, description, created_at, updated_at only
      const myLibs = (data.my_libraries || []).map((lib, idx) => {
        try {
          console.log(`Processing myLib ${idx}:`, JSON.stringify(lib));
          if (!lib || !lib.id) {
            console.warn(`Skipping myLib ${idx} - no id`);
            return null;
          }
          return {
            id: lib.id,
            name: lib.name || "",
            description: lib.description || "",
            created_at: lib.created_at,
            updated_at: lib.updated_at,
            // Default values for fields not returned by backend
            is_public: false,
            paper_count: 0,
            role: "creator",
            is_owner: true,
          };
        } catch (e) {
          console.error("Error processing my_library:", lib, e);
          return null;
        }
      }).filter(lib => lib !== null);

      // Process shared_with_others (created by me, with collaborators)
      const sharedOthers = (data.shared_with_others || []).map((lib, idx) => {
        try {
          console.log(`Processing sharedOther ${idx}:`, JSON.stringify(lib));
          if (!lib || !lib.id) {
            console.warn(`Skipping sharedOther ${idx} - no id`);
            return null;
          }
          return {
            id: lib.id,
            name: lib.name || "",
            description: lib.description || "",
            is_public: lib.is_public || false,
            paper_count: lib.paper_count || 0,
            created_at: lib.created_at,
            updated_at: lib.updated_at,
            role: lib.role || "creator",
            is_owner: lib.is_owner || true,
            creator: lib.creator || { user_id: null, name: null },
            shared_with: lib.shared_with || [],
          };
        } catch (e) {
          console.error("Error processing shared_with_other:", lib, e);
          return null;
        }
      }).filter(lib => lib !== null);

      // Process shared_with_me (where I'm a collaborator)
      const sharedMe = (data.shared_with_me || []).map((lib, idx) => {
        try {
          console.log(`Processing sharedMe ${idx}:`, JSON.stringify(lib));
          if (!lib || !lib.id) {
            console.warn(`Skipping sharedMe ${idx} - no id`);
            return null;
          }
          return {
            id: lib.id,
            name: lib.name || "",
            description: lib.description || "",
            is_public: lib.is_public || false,
            paper_count: lib.paper_count || 0,
            created_at: lib.created_at,
            updated_at: lib.updated_at,
            role: lib.role || "collaborator",
            is_owner: lib.is_owner || false,
            creator: lib.creator || { user_id: null, name: null },
            invited_by: lib.invited_by || null,
            joined_at: lib.joined_at,
            collaborators: lib.collaborators || [],
          };
        } catch (e) {
          console.error("Error processing shared_with_me:", lib, e);
          return null;
        }
      }).filter(lib => lib !== null);
      
      console.log("After mapping - myLibs count:", myLibs.length, "sharedOthers count:", sharedOthers.length, "sharedMe count:", sharedMe.length);

      setMyLibraries(myLibs);
      setSharedWithOthers(sharedOthers);
      setSharedWithMe(sharedMe);
      
      console.log("State updated successfully");
    } catch (err) {
      console.error("Error fetching libraries:", err);
      console.error("Full error object:", err);
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
      console.log("Backend response data:", data);
      console.log("First paper object:", data.papers?.[0]);

      // Transform backend data to frontend format
      const transformedPapers =
        data.papers?.map((paper) => {
          console.log("Processing paper - Full object:", JSON.stringify(paper, null, 2));
          console.log("PDF URL value:", paper.pdf_url);
          return {
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
            pdf_url: paper.pdf_url || "",
          };
        }) || [];

      setPapers(transformedPapers);
    } catch (err) {
      console.error("Error fetching papers:", err);
      setError("Failed to load papers. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, papers: false }));
    }
  };

  // Fetch all papers from all libraries
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
          pdf_url: paper.pdf_url || "",
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

      // Add new library to myLibraries since newly created libraries have no collaborators
      const newLib = {
        id: data.library.id,
        name: data.library.name,
        description: data.library.description,
        created_at: data.library.created_at,
        updated_at: data.library.updated_at,
        is_public: data.library.is_public,
        paper_count: 0,
        role: "creator",
        is_owner: true,
      };

      setMyLibraries((prev) => [...prev, newLib]);

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

      // Update library in appropriate array based on role and shared_with status
      const updatedLib = {
        ...editingLibrary,
        name: data.library.name,
        description: data.library.description,
        is_public: data.library.is_public,
      };

      if (editingLibrary.role === "creator") {
        // Could be in myLibraries or sharedWithOthers
        setMyLibraries((prev) =>
          prev.map((lib) =>
            lib.id === editingLibrary.id ? updatedLib : lib,
          ),
        );
        setSharedWithOthers((prev) =>
          prev.map((lib) =>
            lib.id === editingLibrary.id ? updatedLib : lib,
          ),
        );
      } else {
        // In sharedWithMe
        setSharedWithMe((prev) =>
          prev.map((lib) =>
            lib.id === editingLibrary.id ? updatedLib : lib,
          ),
        );
      }

      setNewLibraryName("");
      setNewLibraryDescription("");
      setEditingLibrary(null);
      setShowEditSidebar(false);
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

      // Remove library from all arrays
      setMyLibraries((prev) => prev.filter((lib) => lib.id !== id));
      setSharedWithOthers((prev) => prev.filter((lib) => lib.id !== id));
      setSharedWithMe((prev) => prev.filter((lib) => lib.id !== id));

      if (selectedLibrary === id) {
        setSelectedLibrary("all");
      }

      setError("");
    } catch (err) {
      console.error("Error deleting library:", err);
      setError(err.message || "Failed to delete library");
    }
  };

  // Handle share button click
  const handleShareClick = () => {
    // Find the current library object
    const currentLibrary =
      myLibraries.find((l) => l.id === selectedLibrary) ||
      sharedWithOthers.find((l) => l.id === selectedLibrary) ||
      sharedWithMe.find((l) => l.id === selectedLibrary);

    if (currentLibrary) {
      setSharingLibrary(currentLibrary);
      setShowShareModal(true);
    }
  };

  // Handle share success
  const handleShareSuccess = (sharedWithUsers) => {
    // You can add any post-share logic here
    console.log("Library shared with:", sharedWithUsers);
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
        : p.libraryId === selectedLibrary;

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Show loading state until librarie & papers are loaded
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
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 80px)",
            marginTop: "80px",
          }}
        >
          <div
            className="spinner-border"
            role="status"
            style={{
              width: "3rem",
              height: "3rem",
              color: "#2e7d32",
            }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">
            {loading.libraries ? "Loading libraries..." : "Loading papers..."}
          </p>
        </div>
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
            {/* All Papers */}
            <div
              key="all"
              className="library-item"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                cursor: "pointer",
                backgroundColor: selectedLibrary === "all" ? "#E8EDE8" : "white",
                borderLeft: selectedLibrary === "all" ? "4px solid #3E513E" : "none",
              }}
              onClick={() => setSelectedLibrary("all")}
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
                    color: selectedLibrary === "all" ? "#3E513E" : "#9ca3af",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.875rem",
                    color: selectedLibrary === "all" ? "#3E513E" : "#374151",
                    fontWeight: selectedLibrary === "all" ? 500 : 400,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  All Papers
                </span>
              </div>
            </div>

            {/* My Libraries Section */}
            {myLibraries.length > 0 && (
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
                  onClick={() => setIsMyLibrariesExpanded(!isMyLibrariesExpanded)}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flex: 1,
                    }}
                  >
                    {isMyLibrariesExpanded ? (
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
                      My Libraries ({myLibraries.length})
                    </span>
                  </div>
                </div>

                {isMyLibrariesExpanded &&
                  myLibraries.map((library) => (
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
                      onMouseEnter={(e) => {
                        const actions =
                          e.currentTarget.querySelector(".library-actions");
                        if (actions) actions.style.opacity = "1";
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
                          size={16}
                          style={{
                            color:
                              selectedLibrary === library.id
                                ? "#3E513E"
                                : "#9ca3af",
                          }}
                        />
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
                      </div>

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
                            setShowEditSidebar(true);
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
                    </div>
                  ))}
              </div>
            )}

            {/* Shared with Others Section */}
            {sharedWithOthers.length > 0 && (
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
                  onClick={() => setIsSharedWithOthersExpanded(!isSharedWithOthersExpanded)}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flex: 1,
                    }}
                  >
                    {isSharedWithOthersExpanded ? (
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
                      Shared with Others ({sharedWithOthers.length})
                    </span>
                  </div>
                </div>

                {isSharedWithOthersExpanded &&
                  sharedWithOthers.map((library) => (
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
                      onMouseEnter={(e) => {
                        const actions =
                          e.currentTarget.querySelector(".library-actions");
                        if (actions) actions.style.opacity = "1";
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
                          size={16}
                          style={{
                            color:
                              selectedLibrary === library.id
                                ? "#3E513E"
                                : "#9ca3af",
                          }}
                        />
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
                          {library.shared_with && library.shared_with.length > 0 && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#9ca3af",
                              }}
                            >
                              {library.shared_with.length}{" "}
                              {library.shared_with.length === 1
                                ? "collaborator"
                                : "collaborators"}
                            </span>
                          )}
                        </div>
                      </div>

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
                            setShowEditSidebar(true);
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
                    </div>
                  ))}
              </div>
            )}

            {/* Shared with Me Section */}
            {sharedWithMe.length > 0 && (
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
                  onClick={() => setIsSharedWithMeExpanded(!isSharedWithMeExpanded)}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flex: 1,
                    }}
                  >
                    {isSharedWithMeExpanded ? (
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
                      Shared with Me ({sharedWithMe.length})
                    </span>
                  </div>
                </div>

                {isSharedWithMeExpanded &&
                  sharedWithMe.map((library) => (
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
                      onMouseEnter={(e) => {
                        const actions =
                          e.currentTarget.querySelector(".library-actions");
                        if (actions) actions.style.opacity = "1";
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
                          size={16}
                          style={{
                            color:
                              selectedLibrary === library.id
                                ? "#3E513E"
                                : "#9ca3af",
                          }}
                        />
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
                          {library.creator && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#9ca3af",
                              }}
                            >
                              by {library.creator.name || "Unknown"}
                            </span>
                          )}
                        </div>
                      </div>

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
                            setShowEditSidebar(true);
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
                          disabled={library.role === "collaborator"}
                          style={{
                            padding: "4px",
                            border: "none",
                            background: "transparent",
                            borderRadius: "4px",
                            cursor:
                              library.role === "collaborator"
                                ? "not-allowed"
                                : "pointer",
                            opacity: library.role === "collaborator" ? 0.5 : 1,
                          }}
                          onMouseOver={(e) => {
                            if (library.role !== "collaborator") {
                              e.currentTarget.style.backgroundColor = "#e5e7eb";
                            }
                          }}
                          onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor = "transparent")
                          }
                        >
                          <Trash2 size={14} style={{ color: "#6b7280" }} />
                        </button>
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
                    : myLibraries.find((l) => l.id === selectedLibrary)?.name ||
                      sharedWithOthers.find((l) => l.id === selectedLibrary)?.name ||
                      sharedWithMe.find((l) => l.id === selectedLibrary)?.name ||
                      "Library"}
                </h2>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                {selectedLibrary !== "all" && (
                  <button
                    onClick={handleShareClick}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "white",
                      backgroundColor: "#3E513E",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
                    onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                )}
                <button
                  onClick={() =>
                    navigate("/bibtex", {
                      state: {
                        selectedLibrary,
                        myLibraries,
                        sharedWithOthers,
                        sharedWithMe,
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
                <div
                  className="spinner-border"
                  role="status"
                  style={{
                    width: "3rem",
                    height: "3rem",
                    color: "#2e7d32",
                    marginBottom: "16px",
                  }}
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted">Loading papers...</p>
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
                {sortedPapers.map((paper) => {
                  console.log("Rendering paper:", paper.title, "PDF URL:", paper.pdf_url, "Type:", typeof paper.pdf_url);
                  return (
                  <div
                    key={paper.id}
                    style={{
                      borderBottom: "1px solid #eee",
                      paddingBottom: "24px",
                      padding: "18px 0",
                    }}
                  >
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
                        onClick={() =>
                          navigate(`/paper/${paper.s2PaperId}`, {
                            state: {
                              libraryId: selectedLibrary,
                              libraryName:
                                selectedLibrary === "all"
                                  ? "All Papers"
                                  : myLibraries.find(
                                      (l) => l.id === selectedLibrary,
                                    )?.name ||
                                    sharedWithOthers.find(
                                      (l) => l.id === selectedLibrary,
                                    )?.name ||
                                    sharedWithMe.find(
                                      (l) => l.id === selectedLibrary,
                                    )?.name,
                            },
                          })
                        }
                        style={{
                          fontSize: "20px",
                          fontWeight: 600,
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
                      {Array.isArray(paper.authors) && paper.authors.length > 0
                        ? paper.authors.map((a, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: "#f2f2f2",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                              }}
                            >
                              {typeof a === "object" ? a.name || "" : a || ""}
                            </span>
                          ))
                        : ""}

                      {/* Field of Study*/}
                      {paper.field && (
                        <>
                          {(Array.isArray(paper.field) ? paper.field : []).map(
                            (f, idx) => (
                              <span
                                key={idx}
                                style={{
                                  background: "#e8f4f8",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  color: "#1a73e8",
                                  fontWeight: 400,
                                }}
                              >
                                {typeof f === "object" ? f.name || "" : f || ""}
                              </span>
                            ),
                          )}
                        </>
                      )}
                    </div>

                    {/* Venue and Date */}
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#888",
                        marginBottom: "10px",
                      }}
                    >
                      {paper.venue} · {paper.date}
                    </div>

                    {/* Abstract */}
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#444",
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
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "12px",
  }}
>
  {/* Left side: Citations, Cite, PDF Viewer, Remove buttons */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    }}
  >
    {/* Citations Count */}
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

    {/* Cite Button */}
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
      onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
      onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
    >
      <img
        src={invertedCommasIcon}
        alt="Cite"
        style={{ width: "12px", height: "12px" }}
      />
      Cite
    </button>

    {/* PDF Viewer Button - only show when not in "All Papers" view */}
    {selectedLibrary !== "all" && (
      <button
        onClick={() => {
          if (paper.pdf_url) {
            navigate(`/pdf-viewer/${paper.s2PaperId}`, {
              state: {
                libraryId: selectedLibrary,
                paperId: paper.dbPaperId,
                pdfUrl: paper.pdf_url,
                paperTitle: paper.title,
              },
            });
          }
        }}
        disabled={!paper.pdf_url}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 10px",
          background: paper.pdf_url ? "#E8EDE8" : "#f3f4f6",
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          fontSize: "12px",
          color: paper.pdf_url ? "#3E513E" : "#9ca3af",
          cursor: paper.pdf_url ? "pointer" : "not-allowed",
          fontWeight: 500,
          whiteSpace: "nowrap",
          opacity: paper.pdf_url ? 1 : 0.7,
        }}
        onMouseOver={(e) => {
          if (paper.pdf_url) {
            e.currentTarget.style.backgroundColor = "#d1e0d1";
          }
        }}
        onMouseOut={(e) => {
          if (paper.pdf_url) {
            e.currentTarget.style.backgroundColor = "#E8EDE8";
          }
        }}
        title={paper.pdf_url ? "Open in Novara PDF Viewer" : "No PDF available"}
      >
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ marginRight: "2px" }}
        >
          <path 
            d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
          />
          <path 
            d="M14 2V8H20" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
          />
          <path 
            d="M16 13H8" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M16 17H8" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M10 9H9H8" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        Novara PDF Viewer
      </button>
    )}

    {/* Remove button */}
    <button
      onClick={() => handleRemovePaper(paper.id, paper.dbPaperId)}
      style={{
        color: "#dc2626",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: selectedLibrary === "all" ? "none" : "block",
        fontSize: "0.875rem",
      }}
      onMouseOver={(e) => (e.currentTarget.style.color = "#991b1b")}
      onMouseOut={(e) => (e.currentTarget.style.color = "#dc2626")}
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
                  );
                })}
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

      {/* Edit Library Sidebar - Overlay Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: showEditSidebar ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0)",
          transition: "background-color 0.3s ease",
          zIndex: showEditSidebar ? 1049 : -1,
          pointerEvents: showEditSidebar ? "auto" : "none",
        }}
        onClick={() => {
          setShowEditSidebar(false);
          setEditingLibrary(null);
          setNewLibraryName("");
          setNewLibraryDescription("");
        }}
      />

      {/* Edit Library Sidebar Panel - Clean Professional Design */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "420px",
          backgroundColor: "white",
          boxShadow: "-2px 0 12px rgba(0, 0, 0, 0.1)",
          transition: "transform 0.3s ease",
          transform: showEditSidebar ? "translateX(0)" : "translateX(100%)",
          zIndex: 1050,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {showEditSidebar && editingLibrary && (
          <>
            {/* Simple Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  Edit Library
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowEditSidebar(false);
                  setEditingLibrary(null);
                  setNewLibraryName("");
                  setNewLibraryDescription("");
                }}
                style={{
                  width: "36px",
                  height: "36px",
                  border: "none",
                  background: "transparent",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <X size={20} color="#6b7280" />
              </button>
            </div>

            {/* Content Area */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
              }}
            >
              {/* Edit Fields Section */}
              <div style={{ marginBottom: "32px" }}>
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Name <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newLibraryName}
                    onChange={(e) => setNewLibraryName(e.target.value)}
                    placeholder="Library name"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "0.95rem",
                      outline: "none",
                      transition: "all 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#3E513E";
                      e.currentTarget.style.boxShadow = "0 0 0 2px rgba(62, 81, 62, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    onKeyPress={(e) => e.key === "Enter" && handleEditLibrary()}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    value={newLibraryDescription}
                    onChange={(e) => setNewLibraryDescription(e.target.value)}
                    placeholder="Add an optional description"
                    rows="4"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "0.95rem",
                      outline: "none",
                      resize: "vertical",
                      transition: "all 0.2s",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#3E513E";
                      e.currentTarget.style.boxShadow = "0 0 0 2px rgba(62, 81, 62, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "32px 0" }} />

              {/* Library Information Section */}
              <div style={{ marginBottom: "32px" }}>
                <h4
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#374151",
                    margin: "0 0 16px 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Library Information
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Paper Count */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>Papers</span>
                    <span style={{ fontSize: "0.95rem", fontWeight: 500, color: "#111827" }}>
                      {editingLibrary.paper_count || 0}
                    </span>
                  </div>

                  {/* Visibility Status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>Visibility</span>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        backgroundColor: editingLibrary.is_public ? "#dcfce7" : "#f3f4f6",
                        color: editingLibrary.is_public ? "#166534" : "#374151",
                        padding: "4px 10px",
                        borderRadius: "4px",
                      }}
                    >
                      {editingLibrary.is_public ? "Public" : "Private"}
                    </span>
                  </div>

                  {/* Your Role */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>Your Role</span>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        color: "#3E513E",
                      }}
                    >
                      {editingLibrary.role === "creator" ? "Owner" : "Collaborator"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "32px 0" }} />

              {/* People Section */}
              <div style={{ marginBottom: "32px" }}>
                <h4
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#374151",
                    margin: "0 0 16px 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  People
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Creator */}
                  {editingLibrary.creator && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "2px" }}>Creator</div>
                        <div style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 500 }}>
                          {typeof editingLibrary.creator === "string" 
                            ? editingLibrary.creator 
                            : editingLibrary.creator?.name || "Unknown"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Invited By (for collaborators) */}
                  {editingLibrary.invited_by && editingLibrary.role !== "creator" && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px" }}>
                      <div>
                        <div style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "2px" }}>Invited By</div>
                        <div style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 500 }}>
                          {typeof editingLibrary.invited_by === "string" 
                            ? editingLibrary.invited_by 
                            : editingLibrary.invited_by?.name || "Unknown"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "32px 0" }} />

              {/* Dates Section */}
              <div style={{ marginBottom: "32px" }}>
                <h4
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#374151",
                    margin: "0 0 16px 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Timeline
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Created Date */}
                  {editingLibrary.created_at && (
                    <div>
                      <div style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "4px" }}>Created</div>
                      <div style={{ fontSize: "0.95rem", color: "#111827" }}>
                        {new Date(editingLibrary.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  )}

                  {/* Updated Date */}
                  {editingLibrary.updated_at && (
                    <div>
                      <div style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "4px" }}>Last Updated</div>
                      <div style={{ fontSize: "0.95rem", color: "#111827" }}>
                        {new Date(editingLibrary.updated_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  )}

                  {/* Joined Date (for collaborators) */}
                  {editingLibrary.joined_at && editingLibrary.role !== "creator" && (
                    <div>
                      <div style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "4px" }}>Joined</div>
                      <div style={{ fontSize: "0.95rem", color: "#111827" }}>
                        {new Date(editingLibrary.joined_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider - Only if there are collaborators */}
              {(editingLibrary.collaborators?.length > 0 || editingLibrary.shared_with?.length > 0) && (
                <div style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "32px 0" }} />
              )}

              {/* Collaborators Section */}
              {(editingLibrary.collaborators?.length > 0 || editingLibrary.shared_with?.length > 0) && (
                <div>
                  <h4
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#374151",
                      margin: "0 0 16px 0",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Collaborators ({(editingLibrary.collaborators || editingLibrary.shared_with || []).length})
                  </h4>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(editingLibrary.collaborators || editingLibrary.shared_with || []).map((collab, idx) => {
                      // Handle different field name formats
                      const name = collab.user_name || collab.name || collab.email || "Unknown User";
                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 12px",
                            backgroundColor: "#f9fafb",
                            borderRadius: "6px",
                            fontSize: "0.9rem",
                          }}
                        >
                          <span style={{ color: "#111827", fontWeight: 500 }}>
                            {name}
                          </span>
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "#6b7280",
                            }}
                          >
                            Collaborator
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Action Buttons */}
            <div
              style={{
                padding: "20px 24px",
                borderTop: "1px solid #e5e7eb",
                background: "white",
                display: "flex",
                gap: "12px",
              }}
            >
              <button
                onClick={() => {
                  setShowEditSidebar(false);
                  setEditingLibrary(null);
                  setNewLibraryName("");
                  setNewLibraryDescription("");
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#e5e7eb")}
                onMouseOut={(e) => (e.currentTarget.style.background = "#f3f4f6")}
              >
                Cancel
              </button>
              <button
                onClick={handleEditLibrary}
                disabled={!newLibraryName.trim()}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  background: !newLibraryName.trim() ? "#d1d5db" : "#3E513E",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: !newLibraryName.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  if (newLibraryName.trim()) {
                    e.currentTarget.style.background = "#2D3A2D";
                  }
                }}
                onMouseOut={(e) => {
                  if (newLibraryName.trim()) {
                    e.currentTarget.style.background = "#3E513E";
                  }
                }}
              >
                Save Changes
              </button>
            </div>

            {/* Delete Button Area - Only for owners */}
            {editingLibrary.role === "creator" && (
              <div
                style={{
                  padding: "0 24px 20px 24px",
                  background: "white",
                }}
              >
                <button
                  onClick={() => handleDeleteLibrary(editingLibrary.id)}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    background: "#fee2e2",
                    color: "#991b1b",
                    border: "1px solid #fecaca",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#fecaca";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#fee2e2";
                  }}
                >
                  Delete Library
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Share Library Modal */}
      <ShareLibraryModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setSharingLibrary(null);
        }}
        library={sharingLibrary}
        onShare={handleShareSuccess}
        API_BASE_URL={API_BASE_URL}
      />

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




// import React, { useState, useEffect } from "react";
// import invertedCommasIcon from "../images/inverted-commas.png";
// import {
//   FolderOpen,
//   Plus,
//   Edit2,
//   Trash2,
//   FileText,
//   TrendingUp,
//   X,
//   Save,
//   StickyNote,
//   ChevronDown,
//   ChevronRight,
//   Loader2,
//   Share2,
//   UserPlus,
//   Check,
//   Search,
// } from "lucide-react";
// import Navbar from "../components/Navbar";
// import CitationModal from "../components/CitationModal";
// import { useNavigate } from "react-router-dom";

// // API Base URL
// const API_BASE_URL =
//   process.env.REACT_APP_BACKEND_URL || "http://localhost:5050";

// // Share Library Modal Component
// const ShareLibraryModal = ({
//   isOpen,
//   onClose,
//   library,
//   onShare,
//   API_BASE_URL,
// }) => {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState([]);
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [sharing, setSharing] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   // Debounce search
//   useEffect(() => {
//     if (!searchQuery.trim() || searchQuery.length < 2) {
//       setSearchResults([]);
//       return;
//     }

//     const delayDebounce = setTimeout(() => {
//       searchUsers();
//     }, 300);

//     return () => clearTimeout(delayDebounce);
//   }, [searchQuery]);

//   const searchUsers = async () => {
//     try {
//       setLoading(true);
//       setError("");
//       const token = localStorage.getItem("access_token");

//       const response = await fetch(
//         `${API_BASE_URL}/api/users/search?query=${encodeURIComponent(searchQuery)}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         },
//       );

//       if (!response.ok) throw new Error("Failed to search users");

//       const data = await response.json();
//       // Filter out already selected users
//       const filteredResults = (data.authors || []).filter(
//         (user) => !selectedUsers.find((u) => u.id === user.id),
//       );
//       setSearchResults(filteredResults);
//     } catch (err) {
//       console.error("Error searching users:", err);
//       setError("Failed to search users");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSelectUser = (user) => {
//     if (!selectedUsers.find((u) => u.id === user.id)) {
//       setSelectedUsers([...selectedUsers, user]);
//     }
//     setSearchQuery("");
//     setSearchResults([]);
//   };

//   const handleRemoveUser = (userId) => {
//     setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
//   };

//   const handleShare = async () => {
//     if (selectedUsers.length === 0) return;

//     try {
//       setSharing(true);
//       setError("");
//       setSuccess("");
//       const token = localStorage.getItem("access_token");

//       // Share with each selected user
//       for (const user of selectedUsers) {
//         const response = await fetch(
//           `${API_BASE_URL}/api/libraries/${library.id}/share`,
//           {
//             method: "POST",
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({ recipient_id: user.id }),
//           },
//         );

//         if (!response.ok) {
//           const errorData = await response.json();
//           // Show specific error message from backend
//           throw new Error(
//             errorData.message || `Failed to share with ${user.name}`,
//           );
//         }
//       }

//       setSuccess(
//         `Library shared with ${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""}`,
//       );
//       setTimeout(() => {
//         onShare(selectedUsers);
//         onClose();
//       }, 1500);
//     } catch (err) {
//       console.error("Error sharing library:", err);
//       setError(err.message || "Failed to share library");
//     } finally {
//       setSharing(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div
//       style={{
//         position: "fixed",
//         inset: 0,
//         backgroundColor: "rgba(0, 0, 0, 0.5)",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         zIndex: 1050,
//       }}
//       onClick={(e) => e.target === e.currentTarget && onClose()}
//     >
//       <div
//         style={{
//           backgroundColor: "white",
//           borderRadius: "12px",
//           padding: "24px",
//           width: "90%",
//           maxWidth: "500px",
//           boxShadow:
//             "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//         }}
//       >
//         {/* Header */}
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             marginBottom: "20px",
//           }}
//         >
//           <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//             <div
//               style={{
//                 width: "40px",
//                 height: "40px",
//                 borderRadius: "50%",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 backgroundColor: "#E8EDE8",
//               }}
//             >
//               <Share2 size={20} style={{ color: "#3E513E" }} />
//             </div>
//             <h3
//               style={{
//                 fontSize: "18px",
//                 fontWeight: 600,
//                 color: "#111827",
//                 margin: 0,
//               }}
//             >
//               Share Library
//             </h3>
//           </div>
//           <button
//             onClick={onClose}
//             style={{
//               padding: "8px",
//               border: "none",
//               background: "transparent",
//               borderRadius: "4px",
//               cursor: "pointer",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//             onMouseOver={(e) =>
//               (e.currentTarget.style.backgroundColor = "#f3f4f6")
//             }
//             onMouseOut={(e) =>
//               (e.currentTarget.style.backgroundColor = "transparent")
//             }
//           >
//             <X size={20} style={{ color: "#6b7280" }} />
//           </button>
//         </div>

//         {/* Library Info */}
//         <div
//           style={{
//             backgroundColor: "#f8fafc",
//             borderRadius: "8px",
//             padding: "12px",
//             marginBottom: "20px",
//           }}
//         >
//           <p
//             style={{
//               fontSize: "0.75rem",
//               color: "#64748b",
//               marginBottom: "4px",
//               textTransform: "uppercase",
//               letterSpacing: "0.05em",
//             }}
//           >
//             Sharing
//           </p>
//           <p
//             style={{
//               fontSize: "1rem",
//               color: "#1e293b",
//               fontWeight: 500,
//               margin: 0,
//             }}
//           >
//             {library?.name}
//           </p>
//           {library?.description && (
//             <p
//               style={{
//                 fontSize: "0.875rem",
//                 color: "#64748b",
//                 marginTop: "4px",
//                 marginBottom: 0,
//               }}
//             >
//               {library.description}
//             </p>
//           )}
//         </div>

//         {/* Selected Users */}
//         {selectedUsers.length > 0 && (
//           <div style={{ marginBottom: "16px" }}>
//             <p
//               style={{
//                 fontSize: "0.875rem",
//                 color: "#374151",
//                 fontWeight: 500,
//                 marginBottom: "8px",
//               }}
//             >
//               Selected Users ({selectedUsers.length})
//             </p>
//             <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
//               {selectedUsers.map((user) => (
//                 <div
//                   key={user.id}
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: "4px",
//                     padding: "4px 8px 4px 12px",
//                     backgroundColor: "#E8EDE8",
//                     borderRadius: "16px",
//                     fontSize: "0.875rem",
//                   }}
//                 >
//                   <span style={{ color: "#3E513E" }}>{user.name}</span>
//                   <button
//                     onClick={() => handleRemoveUser(user.id)}
//                     style={{
//                       padding: "2px",
//                       border: "none",
//                       background: "transparent",
//                       borderRadius: "50%",
//                       cursor: "pointer",
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                     }}
//                     onMouseOver={(e) =>
//                       (e.currentTarget.style.backgroundColor =
//                         "rgba(0,0,0,0.1)")
//                     }
//                     onMouseOut={(e) =>
//                       (e.currentTarget.style.backgroundColor = "transparent")
//                     }
//                   >
//                     <X size={14} style={{ color: "#3E513E" }} />
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Search Input */}
//         <div style={{ marginBottom: "16px", position: "relative" }}>
//           <div style={{ position: "relative" }}>
//             <input
//               type="text"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               placeholder="Search users by name..."
//               style={{
//                 width: "100%",
//                 padding: "10px 12px 10px 36px",
//                 border: "1px solid #d1d5db",
//                 borderRadius: "8px",
//                 fontSize: "14px",
//                 outline: "none",
//               }}
//             />
//             <Search
//               size={18}
//               style={{
//                 position: "absolute",
//                 left: "12px",
//                 top: "50%",
//                 transform: "translateY(-50%)",
//                 color: "#9ca3af",
//               }}
//             />
//           </div>

//           {/* Search Results Dropdown */}
//           {searchQuery.length >= 2 && (
//             <div
//               style={{
//                 position: "absolute",
//                 top: "100%",
//                 left: 0,
//                 right: 0,
//                 backgroundColor: "white",
//                 border: "1px solid #e5e7eb",
//                 borderRadius: "8px",
//                 marginTop: "4px",
//                 maxHeight: "240px",
//                 overflowY: "auto",
//                 zIndex: 10,
//                 boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
//               }}
//             >
//               {loading ? (
//                 <div
//                   style={{
//                     padding: "12px",
//                     textAlign: "center",
//                     color: "#6b7280",
//                   }}
//                 >
//                   Searching...
//                 </div>
//               ) : searchResults.length > 0 ? (
//                 searchResults.map((user) => (
//                   <div
//                     key={user.id}
//                     onClick={() => handleSelectUser(user)}
//                     style={{
//                       padding: "10px 12px",
//                       cursor: "pointer",
//                       display: "flex",
//                       alignItems: "center",
//                       gap: "8px",
//                       borderBottom: "1px solid #f3f4f6",
//                     }}
//                     onMouseOver={(e) =>
//                       (e.currentTarget.style.backgroundColor = "#f9fafb")
//                     }
//                     onMouseOut={(e) =>
//                       (e.currentTarget.style.backgroundColor = "white")
//                     }
//                   >
//                     {user.profile_picture_url ? (
//                       <img
//                         src={user.profile_picture_url}
//                         alt={user.name}
//                         style={{
//                           width: "32px",
//                           height: "32px",
//                           borderRadius: "50%",
//                           objectFit: "cover",
//                         }}
//                       />
//                     ) : (
//                       <div
//                         style={{
//                           width: "32px",
//                           height: "32px",
//                           borderRadius: "50%",
//                           backgroundColor: "#E8EDE8",
//                           display: "flex",
//                           alignItems: "center",
//                           justifyContent: "center",
//                           color: "#3E513E",
//                           fontSize: "14px",
//                           fontWeight: 500,
//                         }}
//                       >
//                         {user.name.charAt(0).toUpperCase()}
//                       </div>
//                     )}
//                     <div style={{ flex: 1 }}>
//                       <div
//                         style={{
//                           fontSize: "14px",
//                           fontWeight: 500,
//                           color: "#111827",
//                         }}
//                       >
//                         {user.name}
//                       </div>
//                       {user.affiliation && (
//                         <div style={{ fontSize: "12px", color: "#6b7280" }}>
//                           {user.affiliation}
//                         </div>
//                       )}
//                     </div>
//                     <button
//                       style={{
//                         padding: "4px",
//                         border: "none",
//                         background: "transparent",
//                         borderRadius: "4px",
//                         cursor: "pointer",
//                       }}
//                     >
//                       <UserPlus size={16} style={{ color: "#3E513E" }} />
//                     </button>
//                   </div>
//                 ))
//               ) : (
//                 <div
//                   style={{
//                     padding: "12px",
//                     textAlign: "center",
//                     color: "#6b7280",
//                   }}
//                 >
//                   No users found
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Error/Success Messages */}
//         {error && (
//           <div
//             style={{
//               backgroundColor: "#fef2f2",
//               border: "1px solid #fecaca",
//               color: "#dc2626",
//               padding: "10px 12px",
//               borderRadius: "8px",
//               fontSize: "0.875rem",
//               marginBottom: "16px",
//             }}
//           >
//             {error}
//           </div>
//         )}

//         {success && (
//           <div
//             style={{
//               backgroundColor: "#d1fae5",
//               border: "1px solid #a7f3d0",
//               color: "#065f46",
//               padding: "10px 12px",
//               borderRadius: "8px",
//               fontSize: "0.875rem",
//               marginBottom: "16px",
//             }}
//           >
//             {success}
//           </div>
//         )}

//         {/* Actions */}
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "flex-end",
//             gap: "12px",
//             marginTop: "20px",
//           }}
//         >
//           <button
//             onClick={onClose}
//             style={{
//               padding: "10px 16px",
//               color: "#6b7280",
//               backgroundColor: "#f3f4f6",
//               border: "1px solid #d1d5db",
//               borderRadius: "8px",
//               fontSize: "14px",
//               fontWeight: 500,
//               cursor: "pointer",
//             }}
//             onMouseOver={(e) =>
//               (e.currentTarget.style.backgroundColor = "#e5e7eb")
//             }
//             onMouseOut={(e) =>
//               (e.currentTarget.style.backgroundColor = "#f3f4f6")
//             }
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleShare}
//             disabled={selectedUsers.length === 0 || sharing}
//             style={{
//               padding: "10px 16px",
//               color: "white",
//               backgroundColor:
//                 selectedUsers.length === 0 ? "#9ca3af" : "#3E513E",
//               border: "none",
//               borderRadius: "8px",
//               fontSize: "14px",
//               fontWeight: 500,
//               cursor: selectedUsers.length === 0 ? "not-allowed" : "pointer",
//               display: "flex",
//               alignItems: "center",
//               gap: "8px",
//             }}
//             onMouseOver={(e) => {
//               if (selectedUsers.length > 0 && !sharing) {
//                 e.currentTarget.style.backgroundColor = "#2D3A2D";
//               }
//             }}
//             onMouseOut={(e) => {
//               if (selectedUsers.length > 0 && !sharing) {
//                 e.currentTarget.style.backgroundColor = "#3E513E";
//               }
//             }}
//           >
//             {sharing ? (
//               <>
//                 <Loader2 size={16} className="spinner" />
//                 Sharing...
//               </>
//             ) : (
//               <>
//                 <Share2 size={16} />
//                 Share with {selectedUsers.length} user
//                 {selectedUsers.length !== 1 ? "s" : ""}
//               </>
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const ResearchLibrary = () => {
//   const [myLibraries, setMyLibraries] = useState([]);
//   const [sharedWithOthers, setSharedWithOthers] = useState([]);
//   const [sharedWithMe, setSharedWithMe] = useState([]);
//   const [isMyLibrariesExpanded, setIsMyLibrariesExpanded] = useState(true);
//   const [isSharedWithOthersExpanded, setIsSharedWithOthersExpanded] = useState(true);
//   const [isSharedWithMeExpanded, setIsSharedWithMeExpanded] = useState(true);
//   const [expandedAbstracts, setExpandedAbstracts] = useState({});
//   const [papers, setPapers] = useState([]);
//   const [selectedLibrary, setSelectedLibrary] = useState("all");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortBy, setSortBy] = useState("dateAdded");
//   const [showNewLibraryModal, setShowNewLibraryModal] = useState(false);
//   const [showEditSidebar, setShowEditSidebar] = useState(false);
//   const [showShareModal, setShowShareModal] = useState(false);
//   const [editingLibrary, setEditingLibrary] = useState(null);
//   const [sharingLibrary, setSharingLibrary] = useState(null);
//   const [newLibraryName, setNewLibraryName] = useState("");
//   const [newLibraryDescription, setNewLibraryDescription] = useState("");
//   const [notesModal, setNotesModal] = useState({
//     show: false,
//     paperId: null,
//     notes: "",
//   });
//   const [citationModal, setCitationModal] = useState({
//     isOpen: false,
//     paper: null,
//   });
//   const [loading, setLoading] = useState({
//     libraries: false,
//     papers: false,
//   });
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   // Get auth token
//   const getAuthToken = () => {
//     return localStorage.getItem("access_token");
//   };

//   // Fetch all libraries for the user
// // Fetch all libraries for the user
// const fetchLibraries = async () => {
//   try {
//     console.log("fetchLibraries called");
//     setLoading((prev) => ({ ...prev, libraries: true }));
//     setError("");

//     const token = getAuthToken();
//     if (!token) {
//       console.error("No auth token found");
//       navigate("/login");
//       return;
//     }
//     console.log("Auth token found, fetching from:", `${API_BASE_URL}/api/libraries`);

//     const response = await fetch(`${API_BASE_URL}/api/libraries`, {
//       method: "GET",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     console.log("Response received, status:", response.status, "ok:", response.ok);

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error("Backend response error:", response.status, errorText);
//       throw new Error(`Failed to fetch libraries: ${response.status} ${response.statusText}`);
//     }

//     const data = await response.json();
//     console.log("JSON parsed successfully");
    
//     if (!data) {
//       console.error("Empty response from backend");
//       throw new Error("Empty response from backend");
//     }
    
//     console.log("Raw backend response:", JSON.stringify(data, null, 2));
//     console.log("my_libraries:", data.my_libraries);
//     console.log("shared_with_others:", data.shared_with_others);
//     console.log("shared_with_me:", data.shared_with_me);
    
//     // Process my_libraries (only personal, no collaborators)
//     // Backend returns: id, name, description, created_at, updated_at
//     const myLibs = (data.my_libraries || []).map((lib, idx) => {
//       try {
//         console.log(`Processing myLib ${idx}:`, JSON.stringify(lib));
//         if (!lib || !lib.id) {
//           console.warn(`Skipping myLib ${idx} - no id`);
//           return null;
//         }
//         return {
//           id: lib.id,
//           name: lib.name || "",
//           isDefault: false,
//           description: lib.description || "",
//           is_public: lib.is_public !== undefined ? lib.is_public : false,
//           paper_count: lib.paper_count !== undefined ? lib.paper_count : 0,
//           role: "creator",
//           created_at: lib.created_at,
//           updated_at: lib.updated_at,
//         };
//       } catch (e) {
//         console.error("Error processing my_library:", lib, e);
//         return null;
//       }
//     }).filter(lib => lib !== null);

//     // Process shared_with_others (created by me, with collaborators)
//     const sharedOthers = (data.shared_with_others || []).map((lib, idx) => {
//       try {
//         console.log(`Processing sharedOther ${idx}:`, JSON.stringify(lib));
//         if (!lib || !lib.id) {
//           console.warn(`Skipping sharedOther ${idx} - no id`);
//           return null;
//         }
//         return {
//           id: lib.id,
//           name: lib.name || "",
//           isDefault: false,
//           description: lib.description || "",
//           is_public: lib.is_public !== undefined ? lib.is_public : false,
//           paper_count: lib.paper_count !== undefined ? lib.paper_count : 0,
//           role: lib.role || "creator",
//           is_owner: lib.is_owner || true,
//           creator: lib.creator || { user_id: null, name: null },
//           shared_with: lib.shared_with || [],
//           created_at: lib.created_at,
//           updated_at: lib.updated_at,
//         };
//       } catch (e) {
//         console.error("Error processing shared_with_other:", lib, e);
//         return null;
//       }
//     }).filter(lib => lib !== null);

//     // Process shared_with_me (where I'm a collaborator)
//     const sharedMe = (data.shared_with_me || []).map((lib, idx) => {
//       try {
//         console.log(`Processing sharedMe ${idx}:`, JSON.stringify(lib));
//         if (!lib || !lib.id) {
//           console.warn(`Skipping sharedMe ${idx} - no id`);
//           return null;
//         }
//         return {
//           id: lib.id,
//           name: lib.name || "",
//           isDefault: false,
//           description: lib.description || "",
//           is_public: lib.is_public !== undefined ? lib.is_public : false,
//           paper_count: lib.paper_count !== undefined ? lib.paper_count : 0,
//           role: lib.role || "collaborator",
//           is_owner: lib.is_owner || false,
//           creator: lib.creator || { user_id: null, name: null },
//           invited_by: lib.invited_by || null,
//           joined_at: lib.joined_at,
//           collaborators: lib.collaborators || [],
//           created_at: lib.created_at,
//           updated_at: lib.updated_at,
//         };
//       } catch (e) {
//         console.error("Error processing shared_with_me:", lib, e);
//         return null;
//       }
//     }).filter(lib => lib !== null);
    
//     console.log("After mapping - myLibs count:", myLibs.length, "sharedOthers count:", sharedOthers.length, "sharedMe count:", sharedMe.length);

//     setMyLibraries(myLibs);
//     setSharedWithOthers(sharedOthers);
//     setSharedWithMe(sharedMe);
    
//     console.log("State updated successfully");
//   } catch (err) {
//     console.error("Error fetching libraries:", err);
//     console.error("Full error object:", err);
//     setError("Failed to load libraries. Please try again.");
//   } finally {
//     setLoading((prev) => ({ ...prev, libraries: false }));
//   }
// };

//   // Fetch papers for selected library
//   const fetchPapers = async (libraryId) => {
//     try {
//       setLoading((prev) => ({ ...prev, papers: true }));
//       setError("");

//       if (libraryId === "all") {
//         // For "All Papers", we need to fetch papers from all libraries
//         await fetchAllPapers();
//         return;
//       }

//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       const response = await fetch(
//         `${API_BASE_URL}/api/libraries/${libraryId}/papers`,
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         },
//       );

//       if (!response.ok) {
//         throw new Error(`Failed to fetch papers for library ${libraryId}`);
//       }

//       const data = await response.json();

//       // Transform backend data to frontend format
//       const transformedPapers =
//         data.papers?.map((paper) => ({
//           id: paper.library_paper_id,
//           dbPaperId: paper.id,
//           s2PaperId: paper.s2_paper_id,
//           title: paper.title,
//           authors: paper.authors || [],
//           venue: paper.venue || "Unknown Venue",
//           date: paper.year ? String(paper.year) : "",
//           citations: paper.citation_count || 0,
//           source: "Database",
//           abstract: paper.abstract || "",
//           libraryId: libraryId,
//           readingStatus: paper.reading_status || "unread",
//           notes: paper.user_note || "",
//           addedDate: new Date(paper.added_at || Date.now()),
//           field: paper.fields_of_study || "",
//           bibtex: paper.bibtex || "",
//         })) || [];

//       setPapers(transformedPapers);
//     } catch (err) {
//       console.error("Error fetching papers:", err);
//       setError("Failed to load papers. Please try again.");
//     } finally {
//       setLoading((prev) => ({ ...prev, papers: false }));
//     }
//   };

//   // Fetch all papers from all libraries
//   const fetchAllPapers = async () => {
//     try {
//       const token = getAuthToken();
//       if (!token) return;

//       // Fetch all unique papers across all libraries from backend
//       const response = await fetch(`${API_BASE_URL}/api/user/papers`, {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (!response.ok) {
//         throw new Error("Failed to fetch all papers");
//       }

//       const data = await response.json();

//       // Transform backend data to frontend format
//       const transformedPapers =
//         data.papers?.map((paper) => ({
//           id: paper.paper_id,
//           dbPaperId: paper.id,
//           s2PaperId: paper.s2_paper_id,
//           title: paper.title,
//           authors: paper.authors || [],
//           venue: paper.venue || "Unknown Venue",
//           date: paper.year ? String(paper.year) : "",
//           citations: paper.citation_count || 0,
//           source: "Database",
//           abstract: paper.abstract || "",
//           libraryId: paper.library_ids?.[0] || "all",
//           readingStatus: paper.reading_statuses?.[0] || "unread",
//           notes: paper.notes?.[0]?.user_note || "",
//           addedDate: new Date(paper.first_added_at || Date.now()),
//           field: paper.fields_of_study || "",
//           bibtex: paper.bibtex || "",
//         })) || [];

//       setPapers(transformedPapers);
//     } catch (err) {
//       console.error("Error fetching all papers:", err);
//     }
//   };

//   // Create new library
//   const handleCreateLibrary = async () => {
//     if (!newLibraryName.trim()) return;

//     try {
//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       const response = await fetch(`${API_BASE_URL}/api/libraries`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           name: newLibraryName.trim(),
//           description: newLibraryDescription.trim(),
//           is_public: false,
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to create library");
//       }

//       const data = await response.json();

//       // Add new library to myLibraries since newly created libraries have no collaborators
//       const newLib = {
//         id: data.library.id,
//         name: data.library.name,
//         isDefault: false,
//         description: data.library.description,
//         is_public: data.library.is_public,
//         paper_count: 0,
//         role: "creator",
//         created_at: data.library.created_at,
//         updated_at: data.library.updated_at,
//       };

//       setMyLibraries((prev) => [...prev, newLib]);

//       setNewLibraryName("");
//       setNewLibraryDescription("");
//       setShowNewLibraryModal(false);
//       setError("");
//     } catch (err) {
//       console.error("Error creating library:", err);
//       setError(err.message || "Failed to create library");
//     }
//   };

//   // Edit library
//   const handleEditLibrary = async () => {
//     if (!newLibraryName.trim() || !editingLibrary) return;

//     try {
//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       const response = await fetch(
//         `${API_BASE_URL}/api/libraries/${editingLibrary.id}`,
//         {
//           method: "PUT",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             name: newLibraryName.trim(),
//             description: newLibraryDescription.trim(),
//             is_public: editingLibrary.is_public || false,
//           }),
//         },
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to update library");
//       }

//       const data = await response.json();

//       // Update library in appropriate array based on role and shared_with status
//       const updatedLib = {
//         ...editingLibrary,
//         name: data.library.name,
//         description: data.library.description,
//       };

//       if (editingLibrary.role === "creator") {
//         // Could be in myLibraries or sharedWithOthers
//         setMyLibraries((prev) =>
//           prev.map((lib) =>
//             lib.id === editingLibrary.id ? updatedLib : lib,
//           ),
//         );
//         setSharedWithOthers((prev) =>
//           prev.map((lib) =>
//             lib.id === editingLibrary.id ? updatedLib : lib,
//           ),
//         );
//       } else {
//         // In sharedWithMe
//         setSharedWithMe((prev) =>
//           prev.map((lib) =>
//             lib.id === editingLibrary.id ? updatedLib : lib,
//           ),
//         );
//       }

//       setNewLibraryName("");
//       setNewLibraryDescription("");
//       setEditingLibrary(null);
//       setShowEditSidebar(false);
//       setError("");
//     } catch (err) {
//       console.error("Error updating library:", err);
//       setError(err.message || "Failed to update library");
//     }
//   };

//   // Delete library
//   const handleDeleteLibrary = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this library?")) {
//       return;
//     }

//     try {
//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       const response = await fetch(`${API_BASE_URL}/api/libraries/${id}`, {
//         method: "DELETE",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to delete library");
//       }

//       // Remove library from all arrays
//       setMyLibraries((prev) => prev.filter((lib) => lib.id !== id));
//       setSharedWithOthers((prev) => prev.filter((lib) => lib.id !== id));
//       setSharedWithMe((prev) => prev.filter((lib) => lib.id !== id));

//       if (selectedLibrary === id) {
//         setSelectedLibrary("all");
//       }

//       setError("");
//     } catch (err) {
//       console.error("Error deleting library:", err);
//       setError(err.message || "Failed to delete library");
//     }
//   };

//   // Handle share button click
//   const handleShareClick = () => {
//     // Find the current library object
//     const currentLibrary =
//       myLibraries.find((l) => l.id === selectedLibrary) ||
//       sharedWithOthers.find((l) => l.id === selectedLibrary) ||
//       sharedWithMe.find((l) => l.id === selectedLibrary);

//     if (currentLibrary) {
//       setSharingLibrary(currentLibrary);
//       setShowShareModal(true);
//     }
//   };

//   // Handle share success
//   const handleShareSuccess = (sharedWithUsers) => {
//     // You can add any post-share logic here
//     console.log("Library shared with:", sharedWithUsers);
//   };

//   // Remove paper from library
//   const handleRemovePaper = async (paperId, dbPaperId) => {
//     if (
//       !window.confirm(
//         "Are you sure you want to remove this paper from the library?",
//       )
//     ) {
//       return;
//     }

//     try {
//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       const response = await fetch(
//         `${API_BASE_URL}/api/libraries/${selectedLibrary}/papers/${dbPaperId}`,
//         {
//           method: "DELETE",
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         },
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to remove paper");
//       }

//       // Remove paper from state
//       setPapers((prev) => prev.filter((p) => p.id !== paperId));
//       setError("");
//     } catch (err) {
//       console.error("Error removing paper:", err);
//       setError(err.message || "Failed to remove paper");
//     }
//   };

//   // Update reading status
//   const handleReadingStatusChange = async (paperId, dbPaperId, status) => {
//     try {
//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       // Find the paper to get its library ID
//       const paper = papers.find((p) => p.id === paperId);
//       if (!paper) {
//         console.error("Paper not found with id:", paperId);
//         console.log(
//           "Available paper ids:",
//           papers.map((p) => p.id),
//         );
//         setError("Paper not found");
//         return;
//       }

//       console.log("Updating reading status for paper:", {
//         paperId,
//         dbPaperId,
//         libraryId: paper.libraryId,
//         status,
//         url: `${API_BASE_URL}/api/libraries/${paper.libraryId}/papers/${dbPaperId}/status`,
//       });

//       // Revert back to using dbPaperId (paper_id from papers table)
//       const response = await fetch(
//         `${API_BASE_URL}/api/libraries/${paper.libraryId}/papers/${dbPaperId}/status`,
//         {
//           method: "PATCH",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ reading_status: status }),
//         },
//       );

//       console.log("Response status:", response.status);

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error("Backend error:", errorData);
//         throw new Error(
//           errorData.message ||
//             `HTTP ${response.status}: Failed to update reading status`,
//         );
//       }

//       const responseData = await response.json();
//       console.log("Success response:", responseData);

//       setPapers((prev) =>
//         prev.map((p) =>
//           p.id === paperId ? { ...p, readingStatus: status } : p,
//         ),
//       );
//       setError("");
//     } catch (err) {
//       console.error("Error updating reading status:", err);
//       setError(err.message || "Failed to update reading status");
//     }
//   };

//   // Save notes
//   const saveNotes = async () => {
//     try {
//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       if (!notesModal.notes.trim()) {
//         deleteNotes();
//         return;
//       }

//       const paper = papers.find((p) => p.id === notesModal.paperId);
//       if (!paper) return;

//       const response = await fetch(
//         `${API_BASE_URL}/api/libraries/${paper.libraryId}/papers/${paper.dbPaperId}/note`,
//         {
//           method: "PATCH",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ user_note: notesModal.notes }),
//         },
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to save note");
//       }

//       setPapers((prev) =>
//         prev.map((p) =>
//           p.id === notesModal.paperId ? { ...p, notes: notesModal.notes } : p,
//         ),
//       );
//       setNotesModal({ show: false, paperId: null, notes: "" });
//       setError("");
//     } catch (err) {
//       console.error("Error saving note:", err);
//       setError("Failed to save note");
//     }
//   };

//   const deleteNotes = async () => {
//     try {
//       const token = getAuthToken();
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       const paper = papers.find((p) => p.id === notesModal.paperId);
//       if (!paper) return;

//       const response = await fetch(
//         `${API_BASE_URL}/api/libraries/${paper.libraryId}/papers/${paper.dbPaperId}/note`,
//         {
//           method: "PATCH",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ user_note: "" }),
//         },
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to delete note");
//       }

//       setPapers((prev) =>
//         prev.map((p) =>
//           p.id === notesModal.paperId ? { ...p, notes: "" } : p,
//         ),
//       );
//       setNotesModal({ show: false, paperId: null, notes: "" });
//       setError("");
//     } catch (err) {
//       console.error("Error deleting note:", err);
//       setError("Failed to delete note");
//     }
//   };

//   // Load data on component mount
//   useEffect(() => {
//     fetchLibraries();
//   }, []);

//   // Fetch papers when selected library changes
//   useEffect(() => {
//     if (selectedLibrary) {
//       fetchPapers(selectedLibrary);
//     }
//   }, [selectedLibrary]);

//   // Filter and sort papers
//   const filteredPapers = papers.filter((p) => {
//     // First filter by library selection
//     const libraryMatch =
//       selectedLibrary === "all"
//         ? true
//         : selectedLibrary.startsWith("s")
//           ? p.libraryId === selectedLibrary
//           : !p.libraryId?.startsWith("s") && p.libraryId === selectedLibrary;

//     // Then filter by search term if it exists
//     if (!searchTerm.trim()) return libraryMatch;

//     const searchLower = searchTerm.toLowerCase();
//     return libraryMatch && p.title.toLowerCase().includes(searchLower);
//   });

//   const sortedPapers = [...filteredPapers].sort((a, b) => {
//     switch (sortBy) {
//       case "citations":
//         return b.citations - a.citations;
//       case "dateAdded":
//         return b.addedDate - a.addedDate;
//       case "datePublished":
//         return new Date(b.date) - new Date(a.date);
//       default:
//         return 0;
//     }
//   });

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "read":
//         return { backgroundColor: "#d1f4e0", color: "#166534" };
//       case "in_progress":
//         return { backgroundColor: "#fef3c7", color: "#854d0e" };
//       case "unread":
//         return { backgroundColor: "#f3f4f6", color: "#1f2937" };
//       default:
//         return { backgroundColor: "#f3f4f6", color: "#1f2937" };
//     }
//   };

//   const toggleAbstract = (paperId) => {
//     setExpandedAbstracts((prev) => ({
//       ...prev,
//       [paperId]: !prev[paperId],
//     }));
//   };

//   // Show loading state until librarie & papers are loaded
//   if (loading.libraries || (papers.length === 0 && loading.papers)) {
//     return (
//       <div
//         style={{
//           height: "100vh",
//           display: "flex",
//           flexDirection: "column",
//           backgroundColor: "#ffffff",
//         }}
//       >
//         <Navbar />
//         <div
//           style={{
//             flex: 1,
//             display: "flex",
//             flexDirection: "column",
//             justifyContent: "center",
//             alignItems: "center",
//             minHeight: "calc(100vh - 80px)",
//             marginTop: "80px",
//           }}
//         >
//           <div
//             className="spinner-border"
//             role="status"
//             style={{
//               width: "3rem",
//               height: "3rem",
//               color: "#2e7d32",
//             }}
//           >
//             <span className="visually-hidden">Loading...</span>
//           </div>
//           <p className="mt-3 text-muted">
//             {loading.libraries ? "Loading libraries..." : "Loading papers..."}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div
//       style={{
//         height: "100vh",
//         display: "flex",
//         flexDirection: "column",
//         backgroundColor: "#F5F5F0",
//       }}
//     >
//       <link
//         href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
//         rel="stylesheet"
//       />

//       {/* Navbar */}
//       <Navbar />

//       {/* Error Message */}
//       {error && (
//         <div
//           style={{
//             position: "fixed",
//             top: "80px",
//             left: "50%",
//             transform: "translateX(-50%)",
//             backgroundColor: "#fef2f2",
//             border: "1px solid #fecaca",
//             color: "#dc2626",
//             padding: "12px 24px",
//             borderRadius: "8px",
//             zIndex: 1000,
//             display: "flex",
//             alignItems: "center",
//             gap: "8px",
//           }}
//         >
//           <span>{error}</span>
//           <button
//             onClick={() => setError("")}
//             style={{
//               background: "none",
//               border: "none",
//               color: "#dc2626",
//               cursor: "pointer",
//             }}
//           >
//             <X size={16} />
//           </button>
//         </div>
//       )}

//       {/* Main Content */}
//       <div
//         style={{
//           display: "flex",
//           flex: 1,
//           overflow: "hidden",
//           marginTop: "64px",
//         }}
//       >
// {/* Sidebar */}
// <div
//   style={{
//     width: "256px",
//     backgroundColor: "white",
//     borderRight: "1px solid #e5e7eb",
//     display: "flex",
//     flexDirection: "column",
//   }}
// >
//   <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
//     <h2
//       style={{
//         fontSize: "1.0rem",
//         fontWeight: 600,
//         color: "#6b7280",
//         textTransform: "uppercase",
//         letterSpacing: "0.05em",
//         margin: "0",
//         textAlign: "left",
//       }}
//     >
//       Libraries
//     </h2>
//   </div>

//   <div style={{ flex: 1, overflowY: "auto" }}>
//     {/* All Papers */}
//     <div
//       key="all"
//       className="library-item"
//       style={{
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "space-between",
//         padding: "12px 16px",
//         cursor: "pointer",
//         backgroundColor: selectedLibrary === "all" ? "#E8EDE8" : "white",
//         borderLeft: selectedLibrary === "all" ? "4px solid #3E513E" : "none",
//       }}
//       onClick={() => setSelectedLibrary("all")}
//     >
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: "8px",
//           flex: 1,
//           minWidth: 0,
//         }}
//       >
//         <FolderOpen
//           size={18}
//           style={{
//             color: selectedLibrary === "all" ? "#3E513E" : "#9ca3af",
//           }}
//         />
//         <span
//           style={{
//             fontSize: "0.875rem",
//             color: selectedLibrary === "all" ? "#3E513E" : "#374151",
//             fontWeight: selectedLibrary === "all" ? 500 : 400,
//             overflow: "hidden",
//             textOverflow: "ellipsis",
//             whiteSpace: "nowrap",
//           }}
//         >
//           All Papers
//         </span>
//       </div>
//     </div>

//     {/* My Libraries Section */}
//     {myLibraries.length > 0 && (
//       <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "8px" }}>
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             padding: "12px 16px",
//             cursor: "pointer",
//             backgroundColor: "white",
//           }}
//           onClick={() => setIsMyLibrariesExpanded(!isMyLibrariesExpanded)}
//         >
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "8px",
//               flex: 1,
//             }}
//           >
//             {isMyLibrariesExpanded ? (
//               <ChevronDown size={16} />
//             ) : (
//               <ChevronRight size={16} />
//             )}
//             <span
//               style={{
//                 fontSize: "0.875rem",
//                 color: "#374151",
//                 fontWeight: 500,
//               }}
//             >
//               My Libraries ({myLibraries.length})
//             </span>
//           </div>
//         </div>

//         {isMyLibrariesExpanded &&
//           myLibraries.map((library) => (
//             <div
//               key={library.id}
//               className="library-item"
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 padding: "12px 16px 12px 40px",
//                 cursor: "pointer",
//                 backgroundColor:
//                   selectedLibrary === library.id ? "#E8EDE8" : "white",
//                 borderLeft:
//                   selectedLibrary === library.id
//                     ? "4px solid #3E513E"
//                     : "none",
//               }}
//               onMouseEnter={(e) => {
//                 const actions =
//                   e.currentTarget.querySelector(".library-actions");
//                 if (actions) actions.style.opacity = "1";
//               }}
//               onMouseLeave={(e) => {
//                 const actions =
//                   e.currentTarget.querySelector(".library-actions");
//                 if (actions) actions.style.opacity = "0";
//               }}
//               onClick={() => setSelectedLibrary(library.id)}
//             >
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "8px",
//                   flex: 1,
//                   minWidth: 0,
//                 }}
//               >
//                 <FolderOpen
//                   size={16}
//                   style={{
//                     color:
//                       selectedLibrary === library.id
//                         ? "#3E513E"
//                         : "#9ca3af",
//                   }}
//                 />
//                 <span
//                   style={{
//                     fontSize: "0.875rem",
//                     color:
//                       selectedLibrary === library.id
//                         ? "#3E513E"
//                         : "#374151",
//                     fontWeight:
//                       selectedLibrary === library.id ? 500 : 400,
//                     overflow: "hidden",
//                     textOverflow: "ellipsis",
//                     whiteSpace: "nowrap",
//                   }}
//                 >
//                   {library.name}
//                 </span>
//               </div>

//               <div
//                 className="library-actions"
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "4px",
//                   opacity: 0,
//                   transition: "opacity 0.2s",
//                 }}
//               >
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     setEditingLibrary(library);
//                     setNewLibraryName(library.name);
//                     setNewLibraryDescription(library.description || "");
//                     setShowEditSidebar(true);
//                   }}
//                   style={{
//                     padding: "4px",
//                     border: "none",
//                     background: "transparent",
//                     borderRadius: "4px",
//                     cursor: "pointer",
//                   }}
//                   onMouseOver={(e) =>
//                     (e.currentTarget.style.backgroundColor = "#e5e7eb")
//                   }
//                   onMouseOut={(e) =>
//                     (e.currentTarget.style.backgroundColor = "transparent")
//                   }
//                 >
//                   <Edit2 size={14} style={{ color: "#6b7280" }} />
//                 </button>
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     handleDeleteLibrary(library.id);
//                   }}
//                   style={{
//                     padding: "4px",
//                     border: "none",
//                     background: "transparent",
//                     borderRadius: "4px",
//                     cursor: "pointer",
//                   }}
//                   onMouseOver={(e) =>
//                     (e.currentTarget.style.backgroundColor = "#e5e7eb")
//                   }
//                   onMouseOut={(e) =>
//                     (e.currentTarget.style.backgroundColor = "transparent")
//                   }
//                 >
//                   <Trash2 size={14} style={{ color: "#6b7280" }} />
//                 </button>
//               </div>
//             </div>
//           ))}
//       </div>
//     )}

//     {/* Shared with Others Section */}
//     {sharedWithOthers.length > 0 && (
//       <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "8px" }}>
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             padding: "12px 16px",
//             cursor: "pointer",
//             backgroundColor: "white",
//           }}
//           onClick={() => setIsSharedWithOthersExpanded(!isSharedWithOthersExpanded)}
//         >
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "8px",
//               flex: 1,
//             }}
//           >
//             {isSharedWithOthersExpanded ? (
//               <ChevronDown size={16} />
//             ) : (
//               <ChevronRight size={16} />
//             )}
//             <span
//               style={{
//                 fontSize: "0.875rem",
//                 color: "#374151",
//                 fontWeight: 500,
//               }}
//             >
//               Shared with Others ({sharedWithOthers.length})
//             </span>
//           </div>
//         </div>

// {isSharedWithOthersExpanded &&
//   sharedWithOthers.map((library) => (
//     <div
//       key={library.id}
//       className="library-item"
//       style={{
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "space-between",
//         padding: "12px 16px 12px 40px",
//         cursor: "pointer",
//         backgroundColor:
//           selectedLibrary === library.id ? "#E8EDE8" : "white",
//         borderLeft:
//           selectedLibrary === library.id
//             ? "4px solid #3E513E"
//             : "none",
//       }}
//       onMouseEnter={(e) => {
//         const actions =
//           e.currentTarget.querySelector(".library-actions");
//         if (actions) actions.style.opacity = "1";
//       }}
//       onMouseLeave={(e) => {
//         const actions =
//           e.currentTarget.querySelector(".library-actions");
//         if (actions) actions.style.opacity = "0";
//       }}
//       onClick={() => setSelectedLibrary(library.id)}
//     >
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: "8px",
//           flex: 1,
//           minWidth: 0,
//         }}
//       >
//         <FolderOpen
//           size={16}
//           style={{
//             color:
//               selectedLibrary === library.id
//                 ? "#3E513E"
//                 : "#9ca3af",
//           }}
//         />
//         <div
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             flex: 1,
//             minWidth: 0,
//           }}
//         >
//           <span
//             style={{
//               fontSize: "0.875rem",
//               color:
//                 selectedLibrary === library.id
//                   ? "#3E513E"
//                   : "#374151",
//               fontWeight:
//                 selectedLibrary === library.id ? 500 : 400,
//               overflow: "hidden",
//               textOverflow: "ellipsis",
//               whiteSpace: "nowrap",
//             }}
//           >
//             {library.name}
//           </span>
//           {library.shared_with && library.shared_with.length > 0 && (
//             <span
//               style={{
//                 fontSize: "0.75rem",
//                 color: "#9ca3af",
//               }}
//             >
//               {library.shared_with.length}{" "}
//               {library.shared_with.length === 1
//                 ? "collaborator"
//                 : "collaborators"}
//             </span>
//           )}
//         </div>
//       </div>

//       <div
//         className="library-actions"
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: "4px",
//           opacity: 0,
//           transition: "opacity 0.2s",
//         }}
//       >
//         <button
//           onClick={(e) => {
//             e.stopPropagation();
//             setEditingLibrary(library);
//             setNewLibraryName(library.name);
//             setNewLibraryDescription(library.description || "");
//             setShowEditSidebar(true);
//           }}
//           style={{
//             padding: "4px",
//             border: "none",
//             background: "transparent",
//             borderRadius: "4px",
//             cursor: "pointer",
//           }}
//           onMouseOver={(e) =>
//             (e.currentTarget.style.backgroundColor = "#e5e7eb")
//           }
//           onMouseOut={(e) =>
//             (e.currentTarget.style.backgroundColor = "transparent")
//           }
//         >
//           <Edit2 size={14} style={{ color: "#6b7280" }} />
//         </button>
//         <button
//           onClick={(e) => {
//             e.stopPropagation();
//             handleDeleteLibrary(library.id);
//           }}
//           style={{
//             padding: "4px",
//             border: "none",
//             background: "transparent",
//             borderRadius: "4px",
//             cursor: "pointer",
//           }}
//           onMouseOver={(e) =>
//             (e.currentTarget.style.backgroundColor = "#e5e7eb")
//           }
//           onMouseOut={(e) =>
//             (e.currentTarget.style.backgroundColor = "transparent")
//           }
//         >
//           <Trash2 size={14} style={{ color: "#6b7280" }} />
//         </button>
//       </div>
//     </div>
//   ))}
//       </div>
//     )}

//     {/* Shared with Me Section */}
//     {sharedWithMe.length > 0 && (
//       <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "8px" }}>
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             padding: "12px 16px",
//             cursor: "pointer",
//             backgroundColor: "white",
//           }}
//           onClick={() => setIsSharedWithMeExpanded(!isSharedWithMeExpanded)}
//         >
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "8px",
//               flex: 1,
//             }}
//           >
//             {isSharedWithMeExpanded ? (
//               <ChevronDown size={16} />
//             ) : (
//               <ChevronRight size={16} />
//             )}
//             <span
//               style={{
//                 fontSize: "0.875rem",
//                 color: "#374151",
//                 fontWeight: 500,
//               }}
//             >
//               Shared with Me ({sharedWithMe.length})
//             </span>
//           </div>
//         </div>

// {isSharedWithMeExpanded &&
//   sharedWithMe.map((library) => (
//     <div
//       key={library.id}
//       className="library-item"
//       style={{
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "space-between",
//         padding: "12px 16px 12px 40px",
//         cursor: "pointer",
//         backgroundColor:
//           selectedLibrary === library.id ? "#E8EDE8" : "white",
//         borderLeft:
//           selectedLibrary === library.id
//             ? "4px solid #3E513E"
//             : "none",
//       }}
//       onMouseEnter={(e) => {
//         const actions =
//           e.currentTarget.querySelector(".library-actions");
//         if (actions) actions.style.opacity = "1";
//       }}
//       onMouseLeave={(e) => {
//         const actions =
//           e.currentTarget.querySelector(".library-actions");
//         if (actions) actions.style.opacity = "0";
//       }}
//       onClick={() => setSelectedLibrary(library.id)}
//     >
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: "8px",
//           flex: 1,
//           minWidth: 0,
//         }}
//       >
//         <FolderOpen
//           size={16}
//           style={{
//             color:
//               selectedLibrary === library.id
//                 ? "#3E513E"
//                 : "#9ca3af",
//           }}
//         />
//         <div
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             flex: 1,
//             minWidth: 0,
//           }}
//         >
//           <span
//             style={{
//               fontSize: "0.875rem",
//               color:
//                 selectedLibrary === library.id
//                   ? "#3E513E"
//                   : "#374151",
//               fontWeight:
//                 selectedLibrary === library.id ? 500 : 400,
//               overflow: "hidden",
//               textOverflow: "ellipsis",
//               whiteSpace: "nowrap",
//             }}
//           >
//             {library.name}
//           </span>
//           {library.creator && (
//             <span
//               style={{
//                 fontSize: "0.75rem",
//                 color: "#9ca3af",
//               }}
//             >
//               by {library.creator.name || "Unknown"}
//             </span>
//           )}
//         </div>
//       </div>

//       <div
//         className="library-actions"
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: "4px",
//           opacity: 0,
//           transition: "opacity 0.2s",
//         }}
//       >
//         <button
//           onClick={(e) => {
//             e.stopPropagation();
//             setEditingLibrary(library);
//             setNewLibraryName(library.name);
//             setNewLibraryDescription(library.description || "");
//             setShowEditSidebar(true);
//           }}
//           style={{
//             padding: "4px",
//             border: "none",
//             background: "transparent",
//             borderRadius: "4px",
//             cursor: "pointer",
//           }}
//           onMouseOver={(e) =>
//             (e.currentTarget.style.backgroundColor = "#e5e7eb")
//           }
//           onMouseOut={(e) =>
//             (e.currentTarget.style.backgroundColor = "transparent")
//           }
//         >
//           <Edit2 size={14} style={{ color: "#6b7280" }} />
//         </button>
//         <button
//           onClick={(e) => {
//             e.stopPropagation();
//             handleDeleteLibrary(library.id);
//           }}
//           disabled={library.role === "collaborator"}
//           style={{
//             padding: "4px",
//             border: "none",
//             background: "transparent",
//             borderRadius: "4px",
//             cursor:
//               library.role === "collaborator"
//                 ? "not-allowed"
//                 : "pointer",
//             opacity: library.role === "collaborator" ? 0.5 : 1,
//           }}
//           onMouseOver={(e) => {
//             if (library.role !== "collaborator") {
//               e.currentTarget.style.backgroundColor = "#e5e7eb";
//             }
//           }}
//           onMouseOut={(e) =>
//             (e.currentTarget.style.backgroundColor = "transparent")
//           }
//         >
//           <Trash2 size={14} style={{ color: "#6b7280" }} />
//         </button>
//       </div>
//     </div>
//   ))}
//       </div>
//     )}
//   </div>

//   <div style={{ padding: "16px", borderTop: "1px solid #e5e7eb" }}>
//     <button
//       onClick={() => setShowNewLibraryModal(true)}
//       style={{
//         width: "100%",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         gap: "8px",
//         padding: "8px 16px",
//         color: "white",
//         backgroundColor: "#3E513E",
//         border: "none",
//         borderRadius: "8px",
//         fontSize: "0.875rem",
//         fontWeight: 500,
//         cursor: "pointer",
//       }}
//       onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
//       onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
//     >
//       <Plus size={18} />
//       New Library
//     </button>
//   </div>
// </div>

//         {/* Papers List */}
//         <div
//           style={{
//             flex: 1,
//             display: "flex",
//             flexDirection: "column",
//             overflow: "hidden",
//             backgroundColor: "white",
//           }}
//         >
//           {/* Header */}
//           <div
//             style={{ borderBottom: "1px solid #e5e7eb", padding: "16px 24px" }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 marginBottom: "16px",
//               }}
//             >
//               <div
//                 style={{ display: "flex", alignItems: "center", gap: "12px" }}
//               >
//                 <FolderOpen size={24} style={{ color: "#3E513E" }} />
//                 <h2
//                   style={{
//                     fontSize: "1.25rem",
//                     fontWeight: 600,
//                     color: "#111827",
//                     margin: 0,
//                   }}
//                 >
//                   {selectedLibrary === "all"
//                     ? "All Papers"
//                     : myLibraries.find((l) => l.id === selectedLibrary)?.name ||
//                       sharedWithOthers.find((l) => l.id === selectedLibrary)?.name ||
//                       sharedWithMe.find((l) => l.id === selectedLibrary)?.name ||
//                       "Library"}
//                 </h2>
//               </div>
//               <div
//                 style={{ display: "flex", alignItems: "center", gap: "12px" }}
//               >
//                 {selectedLibrary !== "all" && (
//                   <button
//                     onClick={handleShareClick}
//                     style={{
//                       padding: "8px 16px",
//                       borderRadius: "8px",
//                       fontSize: "0.875rem",
//                       fontWeight: 500,
//                       color: "white",
//                       backgroundColor: "#3E513E",
//                       border: "none",
//                       cursor: "pointer",
//                       display: "flex",
//                       alignItems: "center",
//                       gap: "8px",
//                     }}
//                     onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
//                     onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
//                   >
//                     <Share2 size={16} />
//                     Share
//                   </button>
//                 )}
//                 <button
//                   onClick={() =>
//                     navigate("/bibtex", {
//                       state: {
//                         selectedLibrary,
//                         myLibraries,
//                         sharedWithOthers,
//                         sharedWithMe,
//                         papers,
//                       },
//                     })
//                   }
//                   style={{
//                     padding: "8px 16px",
//                     color: "#6b7280",
//                     backgroundColor: "transparent",
//                     border: "none",
//                     borderRadius: "8px",
//                     fontSize: "0.875rem",
//                     fontWeight: 500,
//                     cursor: "pointer",
//                   }}
//                   onMouseOver={(e) =>
//                     (e.currentTarget.style.backgroundColor = "#f3f4f6")
//                   }
//                   onMouseOut={(e) =>
//                     (e.currentTarget.style.backgroundColor = "transparent")
//                   }
//                 >
//                   BibTeX
//                 </button>
//               </div>
//             </div>

//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//               }}
//             >
//               <div style={{ flex: 1, maxWidth: "448px" }}>
//                 <input
//                   type="text"
//                   placeholder="Search Papers"
//                   className="form-control"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   style={{
//                     padding: "8px 16px",
//                     border: "1px solid #d1d5db",
//                     borderRadius: "8px",
//                   }}
//                 />
//               </div>
//               <select
//                 value={sortBy}
//                 onChange={(e) => setSortBy(e.target.value)}
//                 className="form-select"
//                 style={{
//                   width: "auto",
//                   padding: "8px 16px",
//                   border: "1px solid #d1d5db",
//                   borderRadius: "8px",
//                   fontSize: "0.875rem",
//                 }}
//               >
//                 <option value="dateAdded">Sort by Date Added</option>
//                 <option value="citations">Sort by Citations</option>
//                 <option value="datePublished">Sort by Publication Date</option>
//               </select>
//             </div>
//           </div>

//           {/* Papers */}
//           <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
//             {loading.papers ? (
//               <div
//                 style={{
//                   display: "flex",
//                   flexDirection: "column",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   height: "100%",
//                   color: "#9ca3af",
//                 }}
//               >
//                 <div
//                   className="spinner-border"
//                   role="status"
//                   style={{
//                     width: "3rem",
//                     height: "3rem",
//                     color: "#2e7d32",
//                     marginBottom: "16px",
//                   }}
//                 >
//                   <span className="visually-hidden">Loading...</span>
//                 </div>
//                 <p className="text-muted">Loading papers...</p>
//               </div>
//             ) : sortedPapers.length === 0 ? (
//               <div
//                 style={{
//                   display: "flex",
//                   flexDirection: "column",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   height: "100%",
//                   color: "#9ca3af",
//                 }}
//               >
//                 <FileText size={64} style={{ marginBottom: "16px" }} />
//                 <p style={{ fontSize: "1.125rem" }}>
//                   No papers in this library
//                 </p>
//                 {selectedLibrary !== "all" && (
//                   <p style={{ fontSize: "0.875rem", marginTop: "8px" }}>
//                     Add papers to this library to see them here
//                   </p>
//                 )}
//               </div>
//             ) : (
//               <div
//                 style={{
//                   display: "flex",
//                   flexDirection: "column",
//                   gap: "24px",
//                 }}
//               >
//                 {sortedPapers.map((paper) => (
//                   <div
//                     key={paper.id}
//                     style={{
//                       borderBottom: "1px solid #eee",
//                       paddingBottom: "24px",
//                       padding: "18px 0",
//                     }}
//                   >
//                     {/* Title with Note Icon */}
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "flex-start",
//                         gap: "8px",
//                         marginBottom: "8px",
//                       }}
//                     >
//                       <button
//                         onClick={() =>
//                           navigate(`/paper/${paper.s2PaperId}`, {
//                             state: {
//                               libraryId: selectedLibrary,
//                               libraryName:
//                                 selectedLibrary === "all"
//                                   ? "All Papers"
//                                   : myLibraries.find(
//                                       (l) => l.id === selectedLibrary,
//                                     )?.name ||
//                                     sharedWithOthers.find(
//                                       (l) => l.id === selectedLibrary,
//                                     )?.name ||
//                                     sharedWithMe.find(
//                                       (l) => l.id === selectedLibrary,
//                                     )?.name,
//                             },
//                           })
//                         }
//                         style={{
//                           fontSize: "20px",
//                           fontWeight: 600,
//                           color: "#3E513E",
//                           cursor: "pointer",
//                           flex: 1,
//                           margin: 0,
//                           textAlign: "left",
//                           background: "transparent",
//                           border: "none",
//                           padding: 0,
//                         }}
//                         onMouseOver={(e) =>
//                           (e.currentTarget.style.opacity = "0.8")
//                         }
//                         onMouseOut={(e) =>
//                           (e.currentTarget.style.opacity = "1")
//                         }
//                       >
//                         {paper.title}
//                       </button>
//                       {selectedLibrary !== "all" && (
//                         <button
//                           onClick={() =>
//                             setNotesModal({
//                               show: true,
//                               paperId: paper.id,
//                               notes: paper.notes || "",
//                             })
//                           }
//                           title="Add/Edit Notes"
//                           style={{
//                             padding: "4px",
//                             border: "none",
//                             background: "transparent",
//                             borderRadius: "4px",
//                             cursor: "pointer",
//                             flexShrink: 0,
//                           }}
//                           onMouseOver={(e) =>
//                             (e.currentTarget.style.backgroundColor = "#f3f4f6")
//                           }
//                           onMouseOut={(e) =>
//                             (e.currentTarget.style.backgroundColor =
//                               "transparent")
//                           }
//                         >
//                           <StickyNote
//                             size={18}
//                             style={{
//                               color: paper.notes ? "#ca8a04" : "#9ca3af",
//                             }}
//                             fill={paper.notes ? "#fef3c7" : "none"}
//                           />
//                         </button>
//                       )}
//                     </div>

//                     {/* Authors */}

//                     <div
//                       style={{
//                         marginTop: "8px",
//                         display: "flex",
//                         gap: "8px",
//                         flexWrap: "wrap",
//                         alignItems: "center",
//                         marginBottom: "8px",
//                       }}
//                     >
//                       {Array.isArray(paper.authors) && paper.authors.length > 0
//                         ? paper.authors.map((a, idx) => (
//                             <span
//                               key={idx}
//                               style={{
//                                 background: "#f2f2f2",
//                                 padding: "4px 8px",
//                                 borderRadius: "4px",
//                                 fontSize: "12px",
//                               }}
//                             >
//                               {typeof a === "object" ? a.name || "" : a || ""}
//                             </span>
//                           ))
//                         : ""}

//                       {/* Field of Study*/}

//                       {paper.field && (
//                         <>
//                           {(Array.isArray(paper.field) ? paper.field : []).map(
//                             (f, idx) => (
//                               <span
//                                 key={idx}
//                                 style={{
//                                   background: "#e8f4f8",
//                                   padding: "4px 8px",
//                                   borderRadius: "4px",
//                                   fontSize: "11px",
//                                   color: "#1a73e8",
//                                   fontWeight: 400,
//                                 }}
//                               >
//                                 {typeof f === "object" ? f.name || "" : f || ""}
//                               </span>
//                             ),
//                           )}
//                         </>
//                       )}
//                     </div>

//                     {/* Venue and Date */}
//                     <div
//                       style={{
//                         fontSize: "13px",
//                         color: "#888",
//                         marginBottom: "10px",
//                       }}
//                     >
//                       {paper.venue} · {paper.date}
//                     </div>

//                     {/* Abstract */}

//                     <p
//                       style={{
//                         fontSize: "0.875rem",
//                         color: "#444",
//                         marginBottom: "12px",
//                         lineHeight: "1.5",
//                       }}
//                     >
//                       {paper.abstract ? (
//                         expandedAbstracts[paper.id] ? (
//                           paper.abstract
//                         ) : (
//                           <>
//                             {paper.abstract.length > 300
//                               ? `${paper.abstract.substring(0, 300)}... `
//                               : paper.abstract}
//                             {paper.abstract.length > 300 && (
//                               <a
//                                 href="#"
//                                 onClick={(e) => {
//                                   e.preventDefault();
//                                   toggleAbstract(paper.id);
//                                 }}
//                                 style={{
//                                   color: "#3E513E",
//                                   textDecoration: "none",
//                                   cursor: "pointer",
//                                 }}
//                                 onMouseOver={(e) =>
//                                   (e.currentTarget.style.textDecoration =
//                                     "underline")
//                                 }
//                                 onMouseOut={(e) =>
//                                   (e.currentTarget.style.textDecoration =
//                                     "none")
//                                 }
//                               >
//                                 Expand
//                               </a>
//                             )}
//                           </>
//                         )
//                       ) : (
//                         "No abstract available"
//                       )}
//                       {expandedAbstracts[paper.id] &&
//                         paper.abstract &&
//                         paper.abstract.length > 300 && (
//                           <a
//                             href="#"
//                             onClick={(e) => {
//                               e.preventDefault();
//                               toggleAbstract(paper.id);
//                             }}
//                             style={{
//                               color: "#3E513E",
//                               textDecoration: "none",
//                               cursor: "pointer",
//                               marginLeft: "8px",
//                             }}
//                             onMouseOver={(e) =>
//                               (e.currentTarget.style.textDecoration =
//                                 "underline")
//                             }
//                             onMouseOut={(e) =>
//                               (e.currentTarget.style.textDecoration = "none")
//                             }
//                           >
//                             Show less
//                           </a>
//                         )}
//                     </p>

//                     {/* Bottom Actions */}

//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "space-between",
//                         marginTop: "12px",
//                       }}
//                     >
//                       {/* Left side: Citations, Cite, Remove buttons */}
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           gap: "12px",
//                         }}
//                       >
//                         {/* Citations Count */}

//                         <span
//                           style={{
//                             display: "inline-flex",
//                             alignItems: "center",
//                             gap: "6px",
//                             padding: "6px 10px",
//                             background: "#f5f5f5",
//                             border: "1px solid #e0e0e0",
//                             borderRadius: "4px",
//                             fontSize: "12px",
//                             color: "#333",
//                             fontWeight: 500,
//                           }}
//                         >
//                           <img
//                             src={invertedCommasIcon}
//                             alt="Citations"
//                             style={{
//                               width: "12px",
//                               height: "12px",
//                               opacity: 0.8,
//                             }}
//                           />
//                           {paper.citations}
//                         </span>

//                         {/* Cite Button */}
//                         <button
//                           onClick={() =>
//                             setCitationModal({
//                               isOpen: true,
//                               paper,
//                             })
//                           }
//                           style={{
//                             display: "inline-flex",
//                             alignItems: "center",
//                             gap: "6px",
//                             padding: "6px 10px",
//                             background: "#fff",
//                             border: "1px solid #e0e0e0",
//                             borderRadius: "4px",
//                             fontSize: "12px",
//                             color: "#333",
//                             cursor: "pointer",
//                             fontWeight: 500,
//                             whiteSpace: "nowrap",
//                           }}
//                           onMouseOver={(e) =>
//                             (e.currentTarget.style.opacity = "0.8")
//                           }
//                           onMouseOut={(e) =>
//                             (e.currentTarget.style.opacity = "1")
//                           }
//                         >
//                           <img
//                             src={invertedCommasIcon}
//                             alt="Cite"
//                             style={{ width: "12px", height: "12px" }}
//                           />
//                           Cite
//                         </button>

//                         {/* Remove button */}
//                         <button
//                           onClick={() =>
//                             handleRemovePaper(paper.id, paper.dbPaperId)
//                           }
//                           style={{
//                             color: "#dc2626",
//                             background: "none",
//                             border: "none",
//                             cursor: "pointer",
//                             padding: 0,
//                             display:
//                               selectedLibrary === "all" ? "none" : "block",
//                             fontSize: "0.875rem",
//                           }}
//                           onMouseOver={(e) =>
//                             (e.currentTarget.style.color = "#991b1b")
//                           }
//                           onMouseOut={(e) =>
//                             (e.currentTarget.style.color = "#dc2626")
//                           }
//                         >
//                           Remove
//                         </button>
//                       </div>

//                       {/* Right side: Reading Status */}
//                       {selectedLibrary !== "all" && (
//                         <select
//                           value={paper.readingStatus}
//                           onChange={(e) =>
//                             handleReadingStatusChange(
//                               paper.id,
//                               paper.dbPaperId,
//                               e.target.value,
//                             )
//                           }
//                           style={{
//                             padding: "4px 12px",
//                             borderRadius: "9999px",
//                             fontSize: "0.75rem",
//                             fontWeight: 500,
//                             border: "none",
//                             cursor: "pointer",
//                             ...getStatusColor(paper.readingStatus),
//                           }}
//                         >
//                           <option value="unread">Unread</option>
//                           <option value="in_progress">In Progress</option>
//                           <option value="read">Read</option>
//                         </select>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Notes Modal */}
//       {notesModal.show && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             backgroundColor: "rgba(0, 0, 0, 0.6)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 1050,
//             padding: "24px",
//           }}
//         >
//           <div
//             style={{
//               backgroundColor: "white",
//               borderRadius: "16px",
//               boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
//               width: "100%",
//               maxWidth: "896px",
//               height: "85vh",
//               display: "flex",
//               flexDirection: "column",
//             }}
//           >
//             {/* Header */}
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 padding: "20px 32px",
//                 borderBottom: "1px solid #e5e7eb",
//               }}
//             >
//               <div
//                 style={{ display: "flex", alignItems: "center", gap: "12px" }}
//               >
//                 <div
//                   style={{
//                     width: "40px",
//                     height: "40px",
//                     borderRadius: "50%",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     backgroundColor: "#E8EDE8",
//                   }}
//                 >
//                   <StickyNote size={20} style={{ color: "#3E513E" }} />
//                 </div>
//                 <h3
//                   style={{
//                     fontSize: "1.5rem",
//                     fontWeight: 600,
//                     color: "#111827",
//                     margin: 0,
//                   }}
//                 >
//                   Notes for Paper
//                 </h3>
//               </div>
//               <button
//                 onClick={() =>
//                   setNotesModal({ show: false, paperId: null, notes: "" })
//                 }
//                 style={{
//                   padding: "8px",
//                   border: "none",
//                   background: "transparent",
//                   borderRadius: "4px",
//                   cursor: "pointer",
//                 }}
//                 onMouseOver={(e) =>
//                   (e.currentTarget.style.backgroundColor = "#f3f4f6")
//                 }
//                 onMouseOut={(e) =>
//                   (e.currentTarget.style.backgroundColor = "transparent")
//                 }
//               >
//                 <X size={20} style={{ color: "#6b7280" }} />
//               </button>
//             </div>

//             {/* Content */}
//             <div style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}>
//               <div
//                 style={{
//                   backgroundColor: "#f8fafc",
//                   borderRadius: "8px",
//                   padding: "16px",
//                   marginBottom: "16px",
//                 }}
//               >
//                 <p
//                   style={{
//                     fontSize: "0.875rem",
//                     color: "#64748b",
//                     marginBottom: "4px",
//                   }}
//                 >
//                   Paper Title
//                 </p>
//                 <p
//                   style={{
//                     fontSize: "1rem",
//                     color: "#1e293b",
//                     fontWeight: 500,
//                   }}
//                 >
//                   {papers.find((p) => p.id === notesModal.paperId)?.title}
//                 </p>
//               </div>

//               <div style={{ marginBottom: "24px" }}>
//                 <label
//                   style={{
//                     display: "block",
//                     fontSize: "0.875rem",
//                     color: "#374151",
//                     fontWeight: 500,
//                     marginBottom: "8px",
//                   }}
//                 >
//                   Your Notes
//                 </label>
//                 <textarea
//                   value={notesModal.notes}
//                   onChange={(e) =>
//                     setNotesModal({ ...notesModal, notes: e.target.value })
//                   }
//                   placeholder="Add your notes here..."
//                   style={{
//                     width: "100%",
//                     minHeight: "200px",
//                     padding: "16px",
//                     border: "1px solid #d1d5db",
//                     borderRadius: "8px",
//                     fontSize: "0.875rem",
//                     lineHeight: "1.5",
//                     resize: "vertical",
//                     outline: "none",
//                   }}
//                 />
//               </div>
//             </div>

//             {/* Footer */}
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 padding: "20px 32px",
//                 borderTop: "1px solid #e5e7eb",
//                 backgroundColor: "#f9fafb",
//               }}
//             >
//               <button
//                 onClick={deleteNotes}
//                 disabled={!notesModal.notes.trim()}
//                 style={{
//                   padding: "10px 20px",
//                   color: !notesModal.notes.trim() ? "#9ca3af" : "#dc2626",
//                   backgroundColor: "transparent",
//                   border: `1px solid ${!notesModal.notes.trim() ? "#9ca3af" : "#dc2626"}`,
//                   borderRadius: "8px",
//                   fontSize: "0.875rem",
//                   fontWeight: 500,
//                   cursor: !notesModal.notes.trim() ? "not-allowed" : "pointer",
//                 }}
//                 onMouseOver={(e) =>
//                   !notesModal.notes.trim()
//                     ? null
//                     : (e.currentTarget.style.backgroundColor = "#fef2f2")
//                 }
//                 onMouseOut={(e) =>
//                   !notesModal.notes.trim()
//                     ? null
//                     : (e.currentTarget.style.backgroundColor = "transparent")
//                 }
//               >
//                 Delete Notes
//               </button>
//               <div
//                 style={{ display: "flex", alignItems: "center", gap: "12px" }}
//               >
//                 <button
//                   onClick={() =>
//                     setNotesModal({ show: false, paperId: null, notes: "" })
//                   }
//                   style={{
//                     padding: "10px 20px",
//                     color: "#6b7280",
//                     backgroundColor: "transparent",
//                     border: "1px solid #d1d5db",
//                     borderRadius: "8px",
//                     fontSize: "0.875rem",
//                     fontWeight: 500,
//                     cursor: "pointer",
//                   }}
//                   onMouseOver={(e) =>
//                     (e.currentTarget.style.backgroundColor = "#f3f4f6")
//                   }
//                   onMouseOut={(e) =>
//                     (e.currentTarget.style.backgroundColor = "transparent")
//                   }
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={saveNotes}
//                   style={{
//                     padding: "10px 20px",
//                     color: "white",
//                     backgroundColor: "#3E513E",
//                     border: "none",
//                     borderRadius: "8px",
//                     fontSize: "0.875rem",
//                     fontWeight: 500,
//                     cursor: "pointer",
//                   }}
//                   onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
//                   onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
//                 >
//                   Save Notes
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* New Library Modal */}
//       {showNewLibraryModal && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             backgroundColor: "rgba(0, 0, 0, 0.5)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 1050,
//           }}
//         >
//           <div
//             style={{
//               backgroundColor: "white",
//               borderRadius: "8px",
//               padding: "20px",
//               width: "90%",
//               maxWidth: "500px",
//               boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 marginBottom: "20px",
//               }}
//             >
//               <h3
//                 style={{
//                   fontSize: "18px",
//                   fontWeight: 600,
//                   color: "#111827",
//                   margin: 0,
//                 }}
//               >
//                 Create New Library
//               </h3>
//               <button
//                 onClick={() => setShowNewLibraryModal(false)}
//                 style={{
//                   padding: "8px",
//                   border: "none",
//                   background: "transparent",
//                   borderRadius: "4px",
//                   cursor: "pointer",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//               >
//                 <X size={20} style={{ color: "#6b7280" }} />
//               </button>
//             </div>
//             <input
//               type="text"
//               value={newLibraryName}
//               onChange={(e) => setNewLibraryName(e.target.value)}
//               placeholder="Enter library name"
//               style={{
//                 width: "100%",
//                 padding: "10px 12px",
//                 border: "1px solid #d1d5db",
//                 borderRadius: "6px",
//                 fontSize: "14px",
//                 marginBottom: "12px",
//                 outline: "none",
//               }}
//               onKeyPress={(e) => e.key === "Enter" && handleCreateLibrary()}
//             />
//             <textarea
//               value={newLibraryDescription}
//               onChange={(e) => setNewLibraryDescription(e.target.value)}
//               placeholder="Enter optional description"
//               style={{
//                 width: "100%",
//                 padding: "10px 12px",
//                 border: "1px solid #d1d5db",
//                 borderRadius: "6px",
//                 fontSize: "14px",
//                 marginBottom: "20px",
//                 outline: "none",
//                 resize: "vertical",
//                 minHeight: "80px",
//               }}
//             />
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "flex-end",
//                 gap: "12px",
//               }}
//             >
//               <button
//                 onClick={() => {
//                   setShowNewLibraryModal(false);
//                   setNewLibraryName("");
//                   setNewLibraryDescription("");
//                 }}
//                 style={{
//                   padding: "10px 16px",
//                   color: "#6b7280",
//                   backgroundColor: "#f3f4f6",
//                   border: "1px solid #d1d5db",
//                   borderRadius: "6px",
//                   fontSize: "14px",
//                   fontWeight: 500,
//                   cursor: "pointer",
//                 }}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleCreateLibrary}
//                 disabled={!newLibraryName.trim()}
//                 style={{
//                   padding: "10px 16px",
//                   color: "white",
//                   backgroundColor: newLibraryName.trim()
//                     ? "#3E513E"
//                     : "#9ca3af",
//                   border: "none",
//                   borderRadius: "6px",
//                   fontSize: "14px",
//                   fontWeight: 500,
//                   cursor: newLibraryName.trim() ? "pointer" : "not-allowed",
//                 }}
//               >
//                 Create
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit Library Sidebar */}
//       <div
//         style={{
//           position: "fixed",
//           inset: 0,
//           backgroundColor: showEditSidebar ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0)",
//           transition: "background-color 0.3s ease",
//           zIndex: showEditSidebar ? 1049 : -1,
//           pointerEvents: showEditSidebar ? "auto" : "none",
//         }}
//         onClick={() => {
//           setShowEditSidebar(false);
//           setEditingLibrary(null);
//           setNewLibraryName("");
//           setNewLibraryDescription("");
//         }}
//       />

//       <div
//         style={{
//           position: "fixed",
//           top: 0,
//           right: 0,
//           height: "100vh",
//           width: "420px",
//           backgroundColor: "white",
//           boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.15)",
//           transition: "transform 0.3s ease",
//           transform: showEditSidebar ? "translateX(0)" : "translateX(100%)",
//           zIndex: 1050,
//           overflow: "auto",
//           display: "flex",
//           flexDirection: "column",
//         }}
//       >
//         {showEditSidebar && editingLibrary && (
//           <>
//             {/* Header */}
//             <div
//               style={{
//                 padding: "20px",
//                 borderBottom: "1px solid #e5e7eb",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//               }}
//             >
//               <h2
//                 style={{
//                   fontSize: "1.25rem",
//                   fontWeight: 600,
//                   color: "#111827",
//                   margin: 0,
//                 }}
//               >
//                 Edit Library
//               </h2>
//               <button
//                 onClick={() => {
//                   setShowEditSidebar(false);
//                   setEditingLibrary(null);
//                   setNewLibraryName("");
//                   setNewLibraryDescription("");
//                 }}
//                 style={{
//                   padding: "8px",
//                   border: "none",
//                   background: "transparent",
//                   borderRadius: "4px",
//                   cursor: "pointer",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//                 onMouseOver={(e) =>
//                   (e.currentTarget.style.backgroundColor = "#f3f4f6")
//                 }
//                 onMouseOut={(e) =>
//                   (e.currentTarget.style.backgroundColor = "transparent")
//                 }
//               >
//                 <X size={24} style={{ color: "#6b7280" }} />
//               </button>
//             </div>

//             {/* Content */}
//             <div
//               style={{
//                 flex: 1,
//                 padding: "24px",
//                 overflow: "auto",
//               }}
//             >
//               {/* Library Info Card */}
//               <div
//                 style={{
//                   backgroundColor: "#f9fafb",
//                   borderRadius: "8px",
//                   padding: "16px",
//                   marginBottom: "24px",
//                 }}
//               >
//                 <p
//                   style={{
//                     fontSize: "0.75rem",
//                     color: "#64748b",
//                     marginBottom: "4px",
//                     textTransform: "uppercase",
//                     letterSpacing: "0.05em",
//                   }}
//                 >
//                   Library Info
//                 </p>
//                 <div style={{ marginBottom: "12px" }}>
//                   <p
//                     style={{
//                       fontSize: "0.875rem",
//                       color: "#6b7280",
//                       marginBottom: "4px",
//                     }}
//                   >
//                     Role
//                   </p>
//                   <p
//                     style={{
//                       fontSize: "1rem",
//                       color: "#111827",
//                       fontWeight: 500,
//                       margin: 0,
//                       textTransform: "capitalize",
//                     }}
//                   >
//                     {editingLibrary.role === "creator"
//                       ? "Owner"
//                       : "Collaborator"}
//                   </p>
//                 </div>

//                 {editingLibrary.role === "collaborator" && (
//                   <>
//                     {editingLibrary.creator && (
//                       <div style={{ marginBottom: "12px" }}>
//                         <p
//                           style={{
//                             fontSize: "0.875rem",
//                             color: "#6b7280",
//                             marginBottom: "4px",
//                           }}
//                         >
//                           Created by
//                         </p>
//                         <p
//                           style={{
//                             fontSize: "1rem",
//                             color: "#111827",
//                             fontWeight: 500,
//                             margin: 0,
//                           }}
//                         >
//                           {editingLibrary.creator.name || "Unknown"}
//                         </p>
//                       </div>
//                     )}
//                     {editingLibrary.joined_at && (
//                       <div>
//                         <p
//                           style={{
//                             fontSize: "0.875rem",
//                             color: "#6b7280",
//                             marginBottom: "4px",
//                           }}
//                         >
//                           Joined
//                         </p>
//                         <p
//                           style={{
//                             fontSize: "1rem",
//                             color: "#111827",
//                             fontWeight: 500,
//                             margin: 0,
//                           }}
//                         >
//                           {new Date(editingLibrary.joined_at).toLocaleDateString()}
//                         </p>
//                       </div>
//                     )}
//                   </>
//                 )}

//                 {editingLibrary.role === "creator" && editingLibrary.shared_with && editingLibrary.shared_with.length > 0 && (
//                   <div>
//                     <p
//                       style={{
//                         fontSize: "0.875rem",
//                         color: "#6b7280",
//                         marginBottom: "8px",
//                       }}
//                     >
//                       Shared with
//                     </p>
//                     <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
//                       {editingLibrary.shared_with.map((collab) => (
//                         <span
//                           key={collab.user_id}
//                           style={{
//                             fontSize: "0.875rem",
//                             backgroundColor: "#e0e7ff",
//                             color: "#4f46e5",
//                             padding: "4px 8px",
//                             borderRadius: "4px",
//                           }}
//                         >
//                           {collab.name || "Unknown"}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {editingLibrary.role === "collaborator" && editingLibrary.collaborators && editingLibrary.collaborators.length > 0 && (
//                   <div>
//                     <p
//                       style={{
//                         fontSize: "0.875rem",
//                         color: "#6b7280",
//                         marginBottom: "8px",
//                       }}
//                     >
//                       Collaborators
//                     </p>
//                     <div style={{ fontSize: "0.875rem", color: "#374151" }}>
//                       {editingLibrary.collaborators.map((collab) => (
//                         <div key={collab.user_id} style={{ marginBottom: "4px" }}>
//                           {collab.name || "Unknown"}{" "}
//                           {collab.role === "creator" && (
//                             <span
//                               style={{
//                                 fontSize: "0.75rem",
//                                 backgroundColor: "#f0fdf4",
//                                 color: "#16a34a",
//                                 padding: "2px 6px",
//                                 borderRadius: "2px",
//                                 marginLeft: "4px",
//                               }}
//                             >
//                               Owner
//                             </span>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Edit Fields */}
//               <div>
//                 <label
//                   style={{
//                     display: "block",
//                     fontSize: "0.875rem",
//                     fontWeight: 500,
//                     color: "#374151",
//                     marginBottom: "8px",
//                   }}
//                 >
//                   Library Name <span style={{ color: "#ef4444" }}>*</span>
//                 </label>
//                 <input
//                   type="text"
//                   value={newLibraryName}
//                   onChange={(e) => setNewLibraryName(e.target.value)}
//                   placeholder="Enter library name"
//                   style={{
//                     width: "100%",
//                     padding: "10px 12px",
//                     border: "1px solid #d1d5db",
//                     borderRadius: "6px",
//                     fontSize: "0.875rem",
//                     marginBottom: "16px",
//                     outline: "none",
//                     boxSizing: "border-box",
//                   }}
//                   onKeyPress={(e) => e.key === "Enter" && handleEditLibrary()}
//                 />

//                 <label
//                   style={{
//                     display: "block",
//                     fontSize: "0.875rem",
//                     fontWeight: 500,
//                     color: "#374151",
//                     marginBottom: "8px",
//                   }}
//                 >
//                   Description
//                 </label>
//                 <textarea
//                   value={newLibraryDescription}
//                   onChange={(e) => setNewLibraryDescription(e.target.value)}
//                   placeholder="Enter optional description"
//                   style={{
//                     width: "100%",
//                     padding: "10px 12px",
//                     border: "1px solid #d1d5db",
//                     borderRadius: "6px",
//                     fontSize: "0.875rem",
//                     marginBottom: "20px",
//                     outline: "none",
//                     resize: "vertical",
//                     minHeight: "80px",
//                     boxSizing: "border-box",
//                   }}
//                 />
//               </div>
//             </div>

//             {/* Footer Buttons */}
//             <div
//               style={{
//                 padding: "20px",
//                 borderTop: "1px solid #e5e7eb",
//                 display: "flex",
//                 gap: "12px",
//               }}
//             >
//               <button
//                 onClick={() => {
//                   setShowEditSidebar(false);
//                   setEditingLibrary(null);
//                   setNewLibraryName("");
//                   setNewLibraryDescription("");
//                 }}
//                 style={{
//                   flex: 1,
//                   padding: "10px 16px",
//                   color: "#6b7280",
//                   backgroundColor: "#f3f4f6",
//                   border: "1px solid #d1d5db",
//                   borderRadius: "6px",
//                   fontSize: "0.875rem",
//                   fontWeight: 500,
//                   cursor: "pointer",
//                 }}
//                 onMouseOver={(e) =>
//                   (e.currentTarget.style.backgroundColor = "#e5e7eb")
//                 }
//                 onMouseOut={(e) =>
//                   (e.currentTarget.style.backgroundColor = "#f3f4f6")
//                 }
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleEditLibrary}
//                 disabled={!newLibraryName.trim()}
//                 style={{
//                   flex: 1,
//                   padding: "10px 16px",
//                   color: "white",
//                   backgroundColor: newLibraryName.trim()
//                     ? "#3E513E"
//                     : "#9ca3af",
//                   border: "none",
//                   borderRadius: "6px",
//                   fontSize: "0.875rem",
//                   fontWeight: 500,
//                   cursor: newLibraryName.trim() ? "pointer" : "not-allowed",
//                 }}
//                 onMouseOver={(e) => {
//                   if (newLibraryName.trim()) {
//                     e.currentTarget.style.opacity = "0.9";
//                   }
//                 }}
//                 onMouseOut={(e) =>
//                   (e.currentTarget.style.opacity = "1")
//                 }
//               >
//                 Save Changes
//               </button>
//             </div>
//           </>
//         )}
//       </div>

//       {/* Share Library Modal */}
//       <ShareLibraryModal
//         isOpen={showShareModal}
//         onClose={() => {
//           setShowShareModal(false);
//           setSharingLibrary(null);
//         }}
//         library={sharingLibrary}
//         onShare={handleShareSuccess}
//         API_BASE_URL={API_BASE_URL}
//       />

//       {/* Citation Modal */}
//       <CitationModal
//         isOpen={citationModal.isOpen}
//         onClose={() =>
//           setCitationModal({
//             isOpen: false,
//             paper: null,
//           })
//         }
//         paper={citationModal.paper}
//         API_BASE_URL={API_BASE_URL}
//       />
//     </div>
//   );
// };

// export default ResearchLibrary;