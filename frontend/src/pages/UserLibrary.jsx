import React, { useState } from "react";
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
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const ResearchLibrary = () => {
  const [libraries, setLibraries] = useState([
    { id: "all", name: "All Papers", isDefault: true },
    { id: "1", name: "Influential Papers", isDefault: false },
    { id: "2", name: "Machine Learning", isDefault: false },
  ]);

  const [sharedLibraries, setSharedLibraries] = useState([
    // {
    //   id: "s1",
    //   name: "Shared Research 2024",
    //   sharedBy: "John Doe",
    //   isShared: true,
    // },
    // { id: "s2", name: "Team Project Papers", sharedBy: "You", isShared: true },
    // // {
    // //   id: "s3",
    // //   name: "AI Ethics Papers",
    // //   sharedBy: "Jane Smith",
    // //   isShared: true,
    // // },
    // { id: "s4", name: "NLP Research", sharedBy: "You", isShared: true },
  ]);

  const [isSharedExpanded, setIsSharedExpanded] = useState(true);

  const [papers, setPapers] = useState([
    {
      id: "p1",
      title:
        "LLMs instead of Human Judges? A Large Scale Empirical Study across 20 NLP Evaluation Tasks",
      authors: [
        "A. Bavaresco",
        "Raffaella Bernardi",
        "+17 authors",
        "A. Testoni",
      ],
      venue: "Annual Meeting of the Association for...",
      date: "26 June 2024",
      citations: 169,
      source: "arXiv",
      abstract:
        "There is an increasing trend towards evaluating NLP models with LLMs instead of human judgments, raising questions about the validity of these evaluations, as well as their reproducibility in the...",
      libraryId: "1",
      readingStatus: "unread",
      notes: "",
      addedDate: new Date("2024-06-26"),
      field: "Computer Science, Linguistics",
      bibtex: `@article{bavaresco2024llms,
  title={LLMs instead of Human Judges? A Large Scale Empirical Study across 20 NLP Evaluation Tasks},
  author={Bavaresco, A. and Bernardi, Raffaella and others},
  journal={Annual Meeting of the Association for Computational Linguistics},
  year={2024}
}`,
    },
    {
      id: "p2",
      title:
        "LLM-Assisted Content Analysis: Using Large Language Models to Support Deductive Coding",
      authors: [
        "Robert F. Chew",
        "John Bollenbacher",
        "Michael Wenger",
        "Jessica Speer",
        "Annice Kim",
      ],
      venue: "Computer Science",
      date: "23 June 2023",
      citations: 114,
      source: "arXiv",
      abstract:
        "Deductive coding is a widely used qualitative research method for determining the prevalence of themes across documents. While useful, deductive coding is often burdensome and time consuming since it...",
      libraryId: "1",
      readingStatus: "in-progress",
      notes: "Interesting methodology for qualitative analysis",
      addedDate: new Date("2023-06-23"),
      field: "Computer Science",
      bibtex: `@article{chew2023llm,
  title={LLM-Assisted Content Analysis: Using Large Language Models to Support Deductive Coding},
  author={Chew, Robert F. and Bollenbacher, John and Wenger, Michael and Speer, Jessica and Kim, Annice},
  journal={arXiv preprint},
  year={2023}
}`,
    },
    {
      id: "p3",
      title: "Attention Is All You Need",
      authors: [
        "Ashish Vaswani",
        "Noam Shazeer",
        "Niki Parmar",
        "Jakob Uszkoreit",
        "Llion Jones",
        "Aidan N. Gomez",
        "Lukasz Kaiser",
        "Illia Polosukhin",
      ],
      venue: "Neural Information Processing Systems",
      date: "12 June 2017",
      citations: 115000,
      source: "arXiv",
      abstract:
        "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism...",
      libraryId: "s1",
      readingStatus: "read",
      notes: "Foundational transformer paper",
      addedDate: new Date("2024-01-15"),
      field: "Computer Science, Machine Learning",
      bibtex: `@article{vaswani2017attention,
  title={Attention is all you need},
  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob and Jones, Llion and Gomez, Aidan N and Kaiser, {\L}ukasz and Polosukhin, Illia},
  journal={Advances in neural information processing systems},
  volume={30},
  year={2017}
}`,
    },
    {
      id: "p4",
      title:
        "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
      authors: [
        "Jacob Devlin",
        "Ming-Wei Chang",
        "Kenton Lee",
        "Kristina Toutanova",
      ],
      venue:
        "North American Chapter of the Association for Computational Linguistics",
      date: "11 October 2018",
      citations: 78000,
      source: "arXiv",
      abstract:
        "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers...",
      libraryId: "s4",
      readingStatus: "read",
      notes: "Important for NLP tasks",
      addedDate: new Date("2024-02-20"),
      field: "Computer Science, Natural Language Processing",
      bibtex: `@article{devlin2018bert,
  title={Bert: Pre-training of deep bidirectional transformers for language understanding},
  author={Devlin, Jacob and Chang, Ming-Wei and Lee, Kenton and Toutanova, Kristina},
  journal={arXiv preprint arXiv:1810.04805},
  year={2018}
}`,
    },
  ]);

  const [selectedLibrary, setSelectedLibrary] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dateAdded");
  const [showNewLibraryModal, setShowNewLibraryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState(null);
  const [newLibraryName, setNewLibraryName] = useState("");
  const [notesModal, setNotesModal] = useState({
    show: false,
    paperId: null,
    notes: "",
  });
  const navigate = useNavigate();

  const filteredPapers = papers.filter((p) => {
    // First filter by library selection
    const libraryMatch =
      selectedLibrary === "all"
        ? true
        : selectedLibrary.startsWith("s")
          ? p.libraryId === selectedLibrary
          : !p.libraryId.startsWith("s") && p.libraryId === selectedLibrary;

    // Then filter by search term if it exists
    if (!searchTerm.trim()) return libraryMatch;

    const searchLower = searchTerm.toLowerCase();
    return (
      libraryMatch &&
      (p.title.toLowerCase().includes(searchLower) ||
        p.authors.some((author) =>
          author.toLowerCase().includes(searchLower),
        ) ||
        p.abstract.toLowerCase().includes(searchLower) ||
        p.field.toLowerCase().includes(searchLower) ||
        p.venue.toLowerCase().includes(searchLower))
    );
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

  const handleCreateLibrary = () => {
    if (newLibraryName.trim()) {
      setLibraries([
        ...libraries,
        {
          id: Date.now().toString(),
          name: newLibraryName,
          isDefault: false,
        },
      ]);
      setNewLibraryName("");
      setShowNewLibraryModal(false);
    }
  };

  const handleEditLibrary = () => {
    if (newLibraryName.trim() && editingLibrary) {
      setLibraries(
        libraries.map((lib) =>
          lib.id === editingLibrary.id ? { ...lib, name: newLibraryName } : lib,
        ),
      );
      setNewLibraryName("");
      setEditingLibrary(null);
      setShowEditModal(false);
    }
  };

  const handleDeleteLibrary = (id) => {
    if (window.confirm("Are you sure you want to delete this library?")) {
      setLibraries(libraries.filter((lib) => lib.id !== id));
      if (selectedLibrary === id) setSelectedLibrary("all");
    }
  };

  const handleRemovePaper = (paperId) => {
    setPapers(papers.filter((p) => p.id !== paperId));
  };

  const handleReadingStatusChange = (paperId, status) => {
    setPapers(
      papers.map((p) =>
        p.id === paperId ? { ...p, readingStatus: status } : p,
      ),
    );
  };

  const openNotesModal = (paperId) => {
    const paper = papers.find((p) => p.id === paperId);
    setNotesModal({ show: true, paperId, notes: paper?.notes || "" });
  };

  const saveNotes = () => {
    // Check if notes are just whitespace
    if (!notesModal.notes.trim()) {
      // If empty or just whitespace, delete the notes
      deleteNotes();
      return;
    }

    setPapers(
      papers.map((p) =>
        p.id === notesModal.paperId ? { ...p, notes: notesModal.notes } : p,
      ),
    );
    setNotesModal({ show: false, paperId: null, notes: "" });
  };

  const deleteNotes = () => {
    setPapers(
      papers.map((p) =>
        p.id === notesModal.paperId ? { ...p, notes: "" } : p,
      ),
    );
    setNotesModal({ show: false, paperId: null, notes: "" });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "read":
        return { backgroundColor: "#d1f4e0", color: "#166534" };
      case "in-progress":
        return { backgroundColor: "#fef3c7", color: "#854d0e" };
      case "unread":
        return { backgroundColor: "#f3f4f6", color: "#1f2937" };
      default:
        return { backgroundColor: "#f3f4f6", color: "#1f2937" };
    }
  };

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

      {/* Main Content - with top padding for fixed navbar */}
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
                  // Show edit/delete buttons on hover
                  const actions =
                    e.currentTarget.querySelector(".library-actions");
                  if (actions) actions.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  // Hide edit/delete buttons when mouse leaves
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
                    {library.name}
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
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
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
                        papers,
                        libraries,
                        sharedLibraries,
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
            {sortedPapers.length === 0 ? (
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
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "24px",
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
                      <h3
                        style={{
                          fontSize: "1.125rem",
                          fontWeight: 400,
                          color: "#3E513E",
                          cursor: "pointer",
                          flex: 1,
                          margin: 0,
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.textDecoration = "underline")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.textDecoration = "none")
                        }
                      >
                        {paper.title}
                      </h3>
                      <button
                        onClick={() => openNotesModal(paper.id)}
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
                          style={{ color: paper.notes ? "#ca8a04" : "#9ca3af" }}
                          fill={paper.notes ? "#fef3c7" : "none"}
                        />
                      </button>
                    </div>

                    {/* Authors */}
                    <div
                      style={{
                        fontSize: "0.875rem",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      {paper.authors.join(", ")}
                    </div>

                    {/* Field */}
                    <div
                      style={{
                        fontSize: "0.875rem",
                        color: "#6b7280",
                        marginBottom: "8px",
                      }}
                    >
                      {paper.field}
                    </div>

                    {/* Venue and Date */}
                    <div
                      style={{
                        fontSize: "0.875rem",
                        color: "#6b7280",
                        marginBottom: "12px",
                      }}
                    >
                      {paper.venue} · {paper.date}
                    </div>

                    {/* Abstract */}
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#374151",
                        marginBottom: "12px",
                      }}
                    >
                      {paper.abstract}{" "}
                      <span
                        style={{ color: "#3E513E", cursor: "pointer" }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.textDecoration = "underline")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.textDecoration = "none")
                        }
                      >
                        Expand
                      </span>
                    </p>

                    {/* Bottom Actions */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          fontSize: "0.875rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <TrendingUp size={16} style={{ color: "#6b7280" }} />
                          <span style={{ fontWeight: 600, color: "#374151" }}>
                            {paper.citations}
                          </span>
                        </div>
                        <button
                          style={{
                            color: "#6b7280",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.color = "#111827")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.color = "#6b7280")
                          }
                        >
                          Cite
                        </button>
                        <button
                          onClick={() => handleRemovePaper(paper.id)}
                          style={{
                            color: "#dc2626",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
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

                      <select
                        value={paper.readingStatus}
                        onChange={(e) =>
                          handleReadingStatusChange(paper.id, e.target.value)
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
                        <option value="in-progress">In Progress</option>
                        <option value="read">Read</option>
                      </select>
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
                marginBottom: "20px",
                outline: "none",
              }}
              onKeyPress={(e) => e.key === "Enter" && handleCreateLibrary()}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                onClick={() => setShowNewLibraryModal(false)}
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
                marginBottom: "20px",
                outline: "none",
              }}
              onKeyPress={(e) => e.key === "Enter" && handleEditLibrary()}
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
    </div>
  );
};

export default ResearchLibrary;
