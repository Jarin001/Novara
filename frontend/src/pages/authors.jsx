import React, { useState, useRef, useEffect } from 'react';
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

// Sample author data
const authorsData = [
  {
    id: 1,
    name: "Humaira Humaira",
    verified: true,
    institution: "Sebelas Maret University",
    department: "Fakultas Keguruan dan Ilmu Pendidikan",
    skills: ["Language Teaching"],
    avatar: "https://via.placeholder.com/80/3E513E/ffffff?text=HH",
    publicationCount: 45,
    citationCount: 328
  },
  {
    id: 2,
    name: "Humaira Humaira",
    verified: false,
    institution: "University of Malakand",
    department: "Department of Mathematics",
    skills: ["Pure Mathematics", "Real and Complex Analysis", "Real Analysis"],
    avatar: "https://via.placeholder.com/80/888888/ffffff?text=HH",
    publicationCount: 23,
    citationCount: 156
  },
  {
    id: 3,
    name: "T. Mok",
    verified: true,
    institution: "Memorial Sloan Kettering Cancer Center",
    department: "Department of Medicine",
    skills: ["Oncology", "Clinical Research", "Lung Cancer"],
    avatar: "https://via.placeholder.com/80/3E513E/ffffff?text=TM",
    publicationCount: 187,
    citationCount: 5432
  },
  {
    id: 4,
    name: "D. Camidge",
    verified: true,
    institution: "University of Colorado",
    department: "School of Medicine",
    skills: ["Medical Oncology", "Thoracic Oncology"],
    avatar: "https://via.placeholder.com/80/3E513E/ffffff?text=DC",
    publicationCount: 142,
    citationCount: 3876
  },
  {
    id: 5,
    name: "S. Gadgeel",
    verified: true,
    institution: "University of Michigan",
    department: "Department of Internal Medicine",
    skills: ["Hematology", "Oncology"],
    avatar: "https://via.placeholder.com/80/3E513E/ffffff?text=SG",
    publicationCount: 98,
    citationCount: 2145
  },
  {
    id: 6,
    name: "R. Rosell",
    verified: true,
    institution: "Catalan Institute of Oncology",
    department: "Medical Oncology",
    skills: ["Lung Cancer", "Molecular Biology", "Clinical Trials"],
    avatar: "https://via.placeholder.com/80/3E513E/ffffff?text=RR",
    publicationCount: 256,
    citationCount: 7821
  },
  {
    id: 7,
    name: "J. Ahn",
    verified: true,
    institution: "Samsung Medical Center",
    department: "Division of Hematology-Oncology",
    skills: ["Lung Cancer", "Targeted Therapy"],
    avatar: "https://via.placeholder.com/80/3E513E/ffffff?text=JA",
    publicationCount: 67,
    citationCount: 1234
  }
];

const Authors = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAuthors, setFilteredAuthors] = useState(authorsData);
  const [sortBy, setSortBy] = useState("relevance");
  const searchFormRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const authorsPerPage = 7;

  const handleSearch = (e) => {
    e && e.preventDefault && e.preventDefault();
    
    if (searchQuery.trim() === '') {
      setFilteredAuthors(authorsData);
    } else {
      const filtered = authorsData.filter(author =>
        author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        author.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
        author.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        author.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredAuthors(filtered);
    }
    setCurrentPage(1); // Reset to first page on new search
  };

  // Apply sorting
  const sortedAuthors = [...filteredAuthors].sort((a, b) => {
    if (sortBy === "publications") {
      return b.publicationCount - a.publicationCount;
    } else if (sortBy === "citations") {
      return b.citationCount - a.citationCount;
    }
    return 0; // relevance (default order)
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedAuthors.length / authorsPerPage);
  const startIndex = (currentPage - 1) * authorsPerPage;
  const endIndex = startIndex + authorsPerPage;
  const currentAuthors = sortedAuthors.slice(startIndex, endIndex);

  // Pagination functions
  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  // Generate page numbers for pagination display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisiblePages; i++) {
          pageNumbers.push(i);
        }
        if (totalPages > maxVisiblePages) {
          pageNumbers.push('...');
          pageNumbers.push(totalPages);
        }
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <>
      <Navbar />

      <div style={{ paddingTop: 100, paddingLeft: 40, paddingRight: 40 }}>
        {/* Search Bar */}
        <div ref={searchFormRef} style={{ position: "relative", maxWidth: 920, marginBottom: 18 }}>
          <form onSubmit={handleSearch} style={{ display: "flex" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for authors..."
              style={{ 
                flex: 1, 
                padding: "10px 12px", 
                border: "1px solid #ddd", 
                borderRadius: "4px 0 0 4px" 
              }}
            />
            <button 
              type="submit"
              style={{ 
                marginLeft: 0, 
                padding: "8px 14px", 
                background: "#3E513E", 
                color: "#fff", 
                border: "1px solid #3E513E", 
                cursor: "pointer", 
                borderRadius: "0 4px 4px 0" 
              }}
            >
              Search
            </button>
          </form>
        </div>

        {/* Results Count */}
        <h3 style={{ marginTop: 8, marginBottom: 12, fontSize: 16, fontWeight: 500, color: '#333' }}>
          {searchQuery ? 
            `About ${filteredAuthors.length.toLocaleString()} results for "${searchQuery}"` : 
            `About ${authorsData.length.toLocaleString()} results`}
        </h3>

        {/* Sort Options */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#333', margin: 0 }}>
            Search results in People
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: '#444', fontSize: 13 }}>Sort by</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)} 
              style={{ padding: '6px 8px' }}
            >
              <option value="relevance">Relevance</option>
              <option value="publications">Publications</option>
              <option value="citations">Citations</option>
            </select>
          </div>
        </div>

        {/* Author Cards */}
        <div>
          {currentAuthors.length > 0 ? (
            currentAuthors.map((author) => (
              <div key={author.id} style={{ padding: "18px 0", borderBottom: "1px solid #eee" }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                  {/* Author Info */}
                  <div style={{ flex: 1 }}>
                    {/* Name with Verification Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <button 
                        onClick={() => navigate(`/author/${author.id}`)}
                        style={{ 
                          color: "#3E513E", 
                          fontSize: 20, 
                          fontWeight: 600, 
                          textDecoration: "none",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          textAlign: "left"
                        }}
                      >
                        {author.name}
                      </button>
                      {author.verified && (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 20 20"
                          fill="#3E513E"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Institution */}
                    <p style={{ color: '#444', fontSize: 14, marginBottom: 10 }}>
                      {author.institution} · {author.department}
                    </p>

                    {/* Skills */}
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>
                        Skills and Expertise
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {author.skills.map((skill, index) => (
                          <span
                            key={index}
                            style={{ fontSize: 13, color: '#666' }}
                          >
                            {skill}
                            {index < author.skills.length - 1 && ' · '}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13, color: '#666' }}>
                      <span>{author.publicationCount} publications</span>
                      <span>{author.citationCount.toLocaleString()} citations</span>
                    </div>

                    {/* Follow Button */}
                    <button 
                      style={{ 
                        marginTop: 12,
                        padding: "6px 12px",
                        background: "#fff",
                        color: "#3E513E",
                        border: "1px solid #3E513E",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 500
                      }}
                    >
                      Follow
                    </button>
                  </div>

                  {/* Avatar */}
                  <div style={{ marginLeft: 24 }}>
                    <img
                      src={author.avatar}
                      alt={author.name}
                      style={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        border: '2px solid #e0e0e0'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ 
              padding: "40px 20px", 
              textAlign: "center", 
              background: "#f9f9f9",
              border: "1px solid #e0e0e0",
              borderRadius: 4
            }}>
              <p style={{ color: "#666", fontSize: 16 }}>No authors found matching your search.</p>
            </div>
          )}
        </div>

        {/* Pagination - only show if we have more than authorsPerPage results */}
        {sortedAuthors.length > authorsPerPage && (
          <div style={{ marginTop: 40, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
            {/* Previous button */}
            <button 
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              style={{ 
                padding: "8px 12px", 
                fontSize: 14,
                background: currentPage === 1 ? "#f5f5f5" : "#3E513E", 
                color: currentPage === 1 ? "#999" : "#fff", 
                border: "none",
                borderRadius: 4,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontWeight: 500
              }}
            >
              ← Previous
            </button>

            {/* Page numbers */}
            {getPageNumbers().map((pageNum, index) => (
              pageNum === '...' ? (
                <span key={`ellipsis-${index}`} style={{ padding: "8px", color: "#666" }}>
                  ...
                </span>
              ) : (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  style={{
                    padding: "8px 12px",
                    fontSize: 14,
                    background: currentPage === pageNum ? "#3E513E" : "#f5f5f5",
                    color: currentPage === pageNum ? "#fff" : "#333",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: currentPage === pageNum ? 600 : 500,
                    minWidth: "40px"
                  }}
                >
                  {pageNum}
                </button>
              )
            ))}

            {/* Next button */}
            <button 
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              style={{ 
                padding: "8px 12px", 
                fontSize: 14,
                background: currentPage === totalPages ? "#f5f5f5" : "#3E513E", 
                color: currentPage === totalPages ? "#999" : "#fff", 
                border: "none",
                borderRadius: 4,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontWeight: 500
              }}
            >
              Next →
            </button>
          </div>
        )}

        {/* Show page info */}
        {sortedAuthors.length > 0 && (
          <div style={{ marginTop: 20, marginBottom: 40, textAlign: "center", color: "#666", fontSize: 14 }}>
            Showing authors {startIndex + 1} to {Math.min(endIndex, sortedAuthors.length)} of {sortedAuthors.length} results
          </div>
        )}
      </div>
    </>
  );
};

export default Authors;