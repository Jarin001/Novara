import React, { useState, useRef, useEffect } from 'react';
import Navbar from "../components/Navbar";
import { useNavigate, useLocation } from "react-router-dom";

const Authors = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchQueryFromURL = queryParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(searchQueryFromURL);
  const [filteredAuthors, setFilteredAuthors] = useState([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchFormRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const authorsPerPage = 7;

  // Fetch authors from backend
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const url = searchQuery.trim() 
          ? `http://localhost:5000/api/users/search?query=${encodeURIComponent(searchQuery.trim())}`
          : 'http://localhost:5000/api/users/search?query=';
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Authors data from backend:", data);
          
          // Use the backend data directly - no need to transform
          setFilteredAuthors(data.authors || []);
        } else {
          setError('Failed to load authors from server');
          setFilteredAuthors([]);
        }
      } catch (error) {
        console.error('Error fetching authors:', error);
        setError('Network error. Please try again.');
        setFilteredAuthors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthors();
    setCurrentPage(1); // Reset to first page on new search
  }, [searchQuery]);

  const handleSearch = (e) => {
    e && e.preventDefault && e.preventDefault();
    
    // Update URL with search query
    navigate(`/authors?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleAuthorClick = (author) => {
    // Navigate to profile page using the user's ID
    navigate(`/profile/${author.id}`);
  };

  // Apply sorting
  const sortedAuthors = [...filteredAuthors].sort((a, b) => {
    if (sortBy === "relevance") {
      // Default order - as returned by backend
      return 0;
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0;
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

  // Get avatar URL or generate initials
  const getAvatarUrl = (author) => {
    if (author.profile_picture_url) {
      return author.profile_picture_url;
    }
    // Generate avatar with initials
    const initials = author.name ? author.name.charAt(0).toUpperCase() : '?';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || 'User')}&background=3E513E&color=fff&size=80`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 18, color: "#666" }}>Loading authors...</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#d32f2f" }}>
            <div>{error}</div>
          </div>
        )}

        {/* Results when not loading and no error */}
        {!loading && !error && (
          <>
            {/* Results Count - Only show if we have a search query */}
            {searchQuery.trim() && (
              <h3 style={{ marginTop: 8, marginBottom: 12, fontSize: 16, fontWeight: 500, color: '#333' }}>
                {filteredAuthors.length > 0 
                  ? `About ${filteredAuthors.length.toLocaleString()} results for "${searchQuery}"` 
                  : `No authors match your search result`}
              </h3>
            )}

            {/* Sort Options - Only show if we have results */}
            {filteredAuthors.length > 0 && (
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
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>
            )}

            {/* Author Cards */}
            <div>
              {currentAuthors.length > 0 ? (
                currentAuthors.map((author) => (
                  <div key={author.id} style={{ padding: "18px 0", borderBottom: "1px solid #eee" }}>
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                      {/* Author Info */}
                      <div style={{ flex: 1 }}>
                        {/* Name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <button 
                            onClick={() => handleAuthorClick(author)}
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
                            {author.name || 'Unknown Author'}
                          </button>
                        </div>

                        {/* Affiliation - from backend */}
                        {author.affiliation && (
                          <p style={{ color: '#444', fontSize: 14, marginBottom: 10 }}>
                            {author.affiliation}
                          </p>
                        )}

                        {/* Research Interests - from backend */}
                        {author.research_interests && author.research_interests.length > 0 && (
                          <div style={{ marginBottom: 10 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>
                              Research Interests
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {author.research_interests.map((interest, index) => (
                                <span
                                  key={index}
                                  style={{ fontSize: 13, color: '#666' }}
                                >
                                  {interest}
                                  {index < author.research_interests.length - 1 && ' · '}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Join Date - from backend */}
                        {author.created_at && (
                          <div style={{ fontSize: 13, color: '#666', marginTop: 10 }}>
                            Joined {formatDate(author.created_at)}
                          </div>
                        )}

                        {/* View Profile Button */}
                        <button 
                          onClick={() => handleAuthorClick(author)}
                          style={{ 
                            marginTop: 12,
                            padding: "6px 12px",
                            background: "#3E513E",
                            color: "#fff",
                            border: "1px solid #3E513E",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 500
                          }}
                        >
                          View Profile
                        </button>
                      </div>

                      {/* Avatar - from backend or generated */}
                      <div style={{ marginLeft: 24 }}>
                        <img
                          src={getAvatarUrl(author)}
                          alt={author.name || 'Author'}
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
                /* No results message */
                <div style={{ 
                  padding: "40px 20px", 
                  textAlign: "center", 
                  background: "#f9f9f9",
                  border: "1px solid #e0e0e0",
                  borderRadius: 4
                }}>
                  {searchQuery.trim() ? (
                    <p style={{ color: "#666", fontSize: 16 }}>
                      No authors match your search result
                    </p>
                  ) : (
                    <p style={{ color: "#666", fontSize: 16 }}>
                      Enter a search term above to find authors
                    </p>
                  )}
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
          </>
        )}
      </div>
    </>
  );
};

export default Authors;