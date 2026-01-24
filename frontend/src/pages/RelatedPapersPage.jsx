import React, { useMemo, useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_ENDPOINTS } from "../config/api";

const sanitizeFilename = (s = '') => {
  return s.replace(/[^a-z0-9\.\-\_]/gi, '-').slice(0, 120);
};

const downloadFile = (filename, content, mime = 'text/plain') => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const RelatedPapersPage = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  
  const [relatedPapers, setRelatedPapers] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [relatedError, setRelatedError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  
  const [selectedFields, setSelectedFields] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [dateRange, setDateRange] = useState([2010, 2026]);
  const [openFields, setOpenFields] = useState(false);
  const [openDate, setOpenDate] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  
  // Save modal state
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveItem, setSaveItem] = useState(null);
  const [selectedLibraries, setSelectedLibraries] = useState([]);
  const [userLibraries, setUserLibraries] = useState([]);
  const [librariesLoading, setLibrariesLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNewLibraryModal, setShowNewLibraryModal] = useState(false);
  const [newLibraryName, setNewLibraryName] = useState('');
  const [creatingLibrary, setCreatingLibrary] = useState(false);
  
  // Citation modal state
  const [citeOpen, setCiteOpen] = useState(false);
  const [citeItem, setCiteItem] = useState(null);
  const [citationFormats, setCitationFormats] = useState([]); // Store fetched citation formats
  const [selectedFormat, setSelectedFormat] = useState('bibtex'); // Default format
  const [citationLoading, setCitationLoading] = useState(false);
  const [citationError, setCitationError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const containerRef = useRef(null);

  // Fetch related papers from backend
  useEffect(() => {
    if (!paperId) {
      setRelatedError('No paper ID provided');
      setRelatedLoading(false);
      return;
    }

    const fetchRelatedPapers = async () => {
      try {
        setRelatedLoading(true);
        setRelatedError(null);
        console.log(`Fetching related papers for: ${paperId}`);
        
        const response = await fetch(`http://localhost:5000/api/papers/${paperId}/related?limit=100`);
        console.log(`Related papers response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Related papers loaded:", data);
          
          // Handle different response formats
          if (data.data && Array.isArray(data.data)) {
            setRelatedPapers(data.data);
            setTotalResults(data.data.length);
          } else if (Array.isArray(data)) {
            setRelatedPapers(data);
            setTotalResults(data.length);
          } else {
            setRelatedPapers([]);
            setTotalResults(0);
          }
        } else {
          const errorText = await response.text();
          console.error(`Error (${response.status}):`, errorText);
          setRelatedError(`Failed to load related papers (${response.status})`);
          setRelatedPapers([]);
          setTotalResults(0);
        }
      } catch (error) {
        console.error("Related papers fetch error:", error);
        setRelatedError(`Error loading related papers: ${error.message}`);
        setRelatedPapers([]);
        setTotalResults(0);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelatedPapers();
  }, [paperId]);

  // Check authentication and fetch user libraries
  useEffect(() => {
    const checkAuthAndFetchLibraries = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setIsAuthenticated(false);
          setUserLibraries([]);
          return;
        }

        setLibrariesLoading(true);
        const response = await fetch(API_ENDPOINTS.LIBRARIES, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('User libraries fetched:', data);
          setIsAuthenticated(true);
          // Extract library data from the response - handle both formats
          let libraries = [];
          if (data.my_libraries && Array.isArray(data.my_libraries)) {
            libraries = data.my_libraries.map(lib => ({ id: lib.id, name: lib.name, role: lib.role }));
          }
          if (data.shared_with_me && Array.isArray(data.shared_with_me)) {
            libraries = [...libraries, ...data.shared_with_me.map(lib => ({ id: lib.id, name: lib.name, role: lib.role }))];
          }
          setUserLibraries(libraries);
        } else if (response.status === 401) {
          setIsAuthenticated(false);
          setUserLibraries([]);
          localStorage.removeItem('access_token');
        } else {
          console.error('Failed to fetch libraries:', response.status);
          setUserLibraries([]);
        }
      } catch (error) {
        console.error('Error fetching libraries:', error);
        setUserLibraries([]);
      } finally {
        setLibrariesLoading(false);
      }
    };

    checkAuthAndFetchLibraries();
  }, []);

  // Handle outside clicks for dropdowns
  useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setOpenFields(false);
        setOpenDate(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const saveModal = document.querySelector('.save-modal');
      const citeModal = document.querySelector('.cite-modal');
      
      if (saveModal && !saveModal.contains(e.target) && saveOpen) {
        closeSave();
      }
      if (citeModal && !citeModal.contains(e.target) && citeOpen) {
        closeCite();
      }
    };

    if (saveOpen || citeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [saveOpen, citeOpen]);

  // Filter and sort related papers
  const visible = useMemo(() => {
    let list = relatedPapers.slice();

    // Filter by fields of study
    if (selectedFields.length > 0) {
      list = list.filter((r) => {
        if (!r.fieldsOfStudy && !r.fields) return false;
        const fields = r.fieldsOfStudy || r.fields || [];
        return Array.isArray(fields) && fields.some(f => selectedFields.includes(f));
      });
    }

    // Filter by date range
    if (dateRange && dateRange.length === 2) {
      const [minY, maxY] = dateRange;
      list = list.filter((r) => {
        const year = r.year || r.date || 0;
        return year >= minY && year <= maxY;
      });
    }

    // Sort by citations or relevance
    if (sortBy === 'citations') {
      list.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
    } else {
      // Default relevance sorting (by citation count in descending order)
      list.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
    }

    return list.slice(0, visibleCount);
  }, [relatedPapers, selectedFields, dateRange, sortBy, visibleCount]);

  // Extract available fields from related papers
  const availableFields = useMemo(() => {
    const fields = new Set();
    relatedPapers.forEach(r => {
      if (r.fieldsOfStudy && Array.isArray(r.fieldsOfStudy)) {
        r.fieldsOfStudy.forEach(f => fields.add(f));
      } else if (r.fields && Array.isArray(r.fields)) {
        r.fields.forEach(f => fields.add(f));
      }
    });
    return Array.from(fields).sort().slice(0, 10);
  }, [relatedPapers]);

  // Use real user libraries or empty array
  const availableLibraries = isAuthenticated && userLibraries.length > 0 
    ? userLibraries 
    : [];

  // Handle show more
  const handleShowMore = () => {
    setVisibleCount(prevCount => Math.min(prevCount + 10, relatedPapers.length));
  };

  // Save modal functions
  const openSave = (item) => {
    if (!isAuthenticated) {
      alert('Please log in to save papers to libraries');
      navigate('/login');
      return;
    }
    setSaveItem(item);
    setSelectedLibraries([]);
    setSaveOpen(true);
  };

  const closeSave = () => {
    setSaveOpen(false);
    setSaveItem(null);
    setSelectedLibraries([]);
  };

  const handleSaveToLibraries = async () => {
    if (selectedLibraries.length === 0) {
      alert('Please select at least one library');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Please log in to save papers');
        navigate('/login');
        return;
      }

      // Prepare paper data
      const paperData = {
        s2_paper_id: saveItem.paperId || saveItem.id || '',
        title: saveItem.title || '',
        venue: Array.isArray(saveItem.venue) ? saveItem.venue[0] : saveItem.venue || '',
        published_year: saveItem.year || new Date().getFullYear(),
        citation_count: saveItem.citationCount || 0,
        fields_of_study: saveItem.fieldsOfStudy || [],
        abstract: saveItem.abstract || '',
        bibtex: saveItem.bibtex || '',
        authors: (saveItem.authors || []).map(a => ({ 
          name: a.name || a,
          affiliation: a.affiliation || ''
        })),
        reading_status: 'unread',
        user_note: ''
      };

      // Save to each selected library
      let savedCount = 0;
      let failedCount = 0;
      const failedLibraries = [];

      for (const library of selectedLibraries) {
        try {
          const response = await fetch(`${API_ENDPOINTS.LIBRARIES}/${library.id}/papers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(paperData)
          });

          if (response.ok) {
            savedCount++;
          } else {
            const errorData = await response.json();
            failedLibraries.push(`${library.name}: ${errorData.message || 'Unknown error'}`);
            failedCount++;
          }
        } catch (error) {
          failedLibraries.push(`${library.name}: ${error.message}`);
          failedCount++;
        }
      }

      if (savedCount > 0) {
        alert(`Paper saved to ${savedCount} librar${savedCount === 1 ? 'y' : 'ies'}!${failedCount > 0 ? `\n\nFailed to save to ${failedCount} librar${failedCount === 1 ? 'y' : 'ies'}:\n${failedLibraries.join('\n')}` : ''}`);
        closeSave();
      } else {
        alert(`Failed to save paper:\n${failedLibraries.join('\n')}`);
      }
    } catch (error) {
      console.error('Error saving paper:', error);
      alert('Error saving paper: ' + error.message);
    }
  };

  const handleCreateLibrary = async () => {
    if (!newLibraryName.trim()) return;
    
    try {
      setCreatingLibrary(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Please log in to create a library');
        return;
      }
      
      const response = await fetch(`${API_ENDPOINTS.LIBRARIES}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newLibraryName.trim() })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Backend returns { message, library }
        const newLibrary = data.library;
        setUserLibraries([...userLibraries, { id: newLibrary.id, name: newLibrary.name, role: 'creator' }]);
        setNewLibraryName('');
        setShowNewLibraryModal(false);
      } else {
        let errorMsg = 'Failed to create library';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          // Response is not JSON, use status text
          errorMsg = `${response.status} ${response.statusText}`;
        }
        console.error('Error creating library:', errorMsg);
        alert('Failed to create library: ' + errorMsg);
      }
    } catch (error) {
      console.error('Error creating library:', error);
      alert('Error creating library: ' + error.message);
    } finally {
      setCreatingLibrary(false);
    }
  };

  const toggleLibrarySelection = (library) => {
    setSelectedLibraries(prev => {
      const libraryId = library.id;
      const isSelected = prev.some(l => l.id === libraryId);
      if (isSelected) {
        return prev.filter(l => l.id !== libraryId);
      } else {
        return [...prev, library];
      }
    });
  };

  // Citation modal functions - UPDATED to fetch from backend
  const openCite = async (item) => {
    try {
      setCitationLoading(true);
      setCitationError(null);
      setCiteItem(item);
      setCitationFormats([]);
      setSelectedFormat('bibtex');
      
      // Fetch citation formats from your backend for the clicked paper
      const clickedPaperId = item.paperId || item.id;
      if (!clickedPaperId) {
        throw new Error('Paper ID not found for citation');
      }
      
      const response = await fetch(`http://localhost:5000/api/citations/${clickedPaperId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch citation formats: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setCitationFormats(result.data);
        setCiteOpen(true);
      } else {
        throw new Error(result.message || 'No citation data received');
      }
    } catch (error) {
      console.error('Error fetching citation formats:', error);
      setCitationError(`Failed to load citation formats: ${error.message}`);
      // Fallback to manual generation if backend fails
      setCiteOpen(true);
    } finally {
      setCitationLoading(false);
    }
  };

  const closeCite = () => {
    setCiteOpen(false);
    setCiteItem(null);
    setCitationFormats([]);
    setCitationError(null);
    setCopied(false);
  };

  const copyCitation = async () => {
    try {
      const format = citationFormats.find(f => f.id === selectedFormat);
      if (!format) {
        throw new Error('No citation format found');
      }
      
      await navigator.clipboard.writeText(format.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error('Copy failed:', error);
      // Fallback method
      const textarea = document.getElementById('cite-textarea');
      if (textarea) {
        textarea.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch (err) {
          console.error('Fallback copy also failed:', err);
        }
      }
    }
  };

  const downloadCitation = () => {
    const format = citationFormats.find(f => f.id === selectedFormat);
    if (!format) return;
    
    const extension = format.id === 'bibtex' ? 'bib' : 'txt';
    const filename = sanitizeFilename(citeItem?.title || 'citation') + `.${extension}`;
    const mimeType = format.id === 'bibtex' ? 'application/x-bibtex' : 'text/plain';
    
    downloadFile(filename, format.value, mimeType);
  };

  // Fallback function if backend citation fetch fails
  const getFallbackCitationText = (item, format) => {
    if (!item) return '';
    const authors = item.authors ? 
      (Array.isArray(item.authors) ? 
        item.authors.map(a => typeof a === 'object' ? a.name || '' : a || '').join(' and ') : 
        (typeof item.authors === 'string' ? item.authors : '')) : 
      '';
    const year = item.year || item.date || 'n.d.';

    if (format === 'bibtex' || format === 'BibTeX') {
      const authorName = item.authors && item.authors[0] ? 
        (typeof item.authors[0] === 'object' ? item.authors[0].name : item.authors[0]) : 
        'author';
      const key = `${authorName.replace(/\s+/g,'')}${year}`;
      return `@inproceedings{${key},\n  title={${item.title}},\n  author={${authors}},\n  booktitle={${item.venue || 'Unknown'}},\n  year={${year}},\n}`;
    }

    if (format === 'mla' || format === 'MLA') {
      return `${authors}. "${item.title}." ${item.venue || 'Unknown'}, ${year}.`;
    }

    if (format === 'apa' || format === 'APA') {
      return `${authors} (${year}). ${item.title}. ${item.venue || 'Unknown'}.`;
    }

    if (format === 'ieee' || format === 'IEEE') {
      return `[1] ${authors}, "${item.title}," ${item.venue || 'Unknown'}, ${year}.`;
    }

    return '';
  };

  // Get current citation text (either from backend or fallback)
  const getCurrentCitationText = () => {
    if (citationFormats.length > 0) {
      const format = citationFormats.find(f => f.id === selectedFormat);
      return format ? format.value : '';
    }
    // Fallback to manual generation if backend failed
    return getFallbackCitationText(citeItem, selectedFormat);
  };

  // Get citation label for display
  const getCitationLabel = (id) => {
    const format = citationFormats.find(f => f.id === id);
    return format ? format.label : id.toUpperCase();
  };

  return (
    <>
      <Navbar />

      <div style={{ paddingTop: 100, paddingLeft: 40, paddingRight: 40 }}>
        {/* Loading State */}
        {relatedLoading && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 18, color: '#666' }}>Loading related papers...</div>
            {/* <div style={{ fontSize: 12, color: '#999', marginTop: 10 }}>Paper ID: {paperId}</div> */}
          </div>
        )}

        {/* Error State */}
        {relatedError && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 18, color: '#d32f2f' }}>Error: {relatedError}</div>
            <button 
              onClick={() => window.location.reload()}
              style={{ 
                marginTop: 20,
                padding: '8px 16px',
                background: '#3E513E',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content */}
        {!relatedLoading && !relatedError && (
          <>
            {/* Header showing which paper's related papers we're viewing */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#333', marginBottom: 8 }}>
                Papers Related To This Work
              </h2>
              <p style={{ color: '#666', fontSize: 14 }}>
                Showing {visible.length} of {totalResults} papers related to this work
              </p>
            </div>

            <h3 style={{ marginTop: 8, marginBottom: 12, fontSize: 16, fontWeight: 500, color: '#333' }}>
              About {totalResults.toLocaleString()} results
            </h3>

            {/* Filters row */}
            <div ref={containerRef} style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center", flexWrap: 'wrap' }}>
              {/* Fields of Study dropdown */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => { setOpenFields(o=>!o); setOpenDate(false); }} style={{ padding: "8px 12px", border: "1px solid #e2e6ea", background: "#fff" }}>Fields of Study ▾</button>
                {openFields && availableFields.length > 0 && (
                  <div style={{ position: 'absolute', top: 40, left: 0, background: '#fff', border: '1px solid #ddd', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 12, width: 260, zIndex: 60 }}>
                    <strong style={{display:'block', marginBottom:8}}>Fields of Study</strong>
                    {availableFields.map((f) => (
                      <label key={f} style={{ display: 'block', marginBottom: 6 }}>
                        <input 
                          type="checkbox" 
                          checked={selectedFields.includes(f)} 
                          onChange={() => {
                            setSelectedFields((prev) => prev.includes(f) ? prev.filter(x=>x!==f) : [...prev, f]);
                          }} 
                        /> 
                        <span style={{marginLeft:8}}>{f}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Range dropdown */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => { setOpenDate(o=>!o); setOpenFields(false); }} style={{ padding: "8px 12px", border: "1px solid #e2e6ea", background: "#fff" }}>Date Range ▾</button>
                {openDate && (
                  <div style={{ position: 'absolute', top: 40, left: 0, background: '#fff', border: '1px solid #ddd', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 16, width: 360, zIndex:50, overflow: 'hidden', boxSizing: 'border-box' }}>
                    <div style={{ position: 'relative', padding: '6px 0' }}>
                      <input
                        type="range"
                        min={2010}
                        max={2026}
                        value={dateRange[0]}
                        onChange={(e)=>{
                          const val = Number(e.target.value);
                          setDateRange([Math.min(val, dateRange[1]), dateRange[1]]);
                        }}
                        style={{ width: 'calc(100% - 48px)', marginLeft: 24, marginRight: 24, display: 'block' }}
                      />
                      <input
                        type="range"
                        min={2010}
                        max={2026}
                        value={dateRange[1]}
                        onChange={(e)=>{
                          const val = Number(e.target.value);
                          setDateRange([dateRange[0], Math.max(val, dateRange[0])]);
                        }}
                        style={{ width: 'calc(100% - 48px)', marginLeft: 24, marginRight: 24, marginTop: -36, display: 'block' }}
                      />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                      <small>{dateRange[0]}</small>
                      <small>{dateRange[1]}</small>
                    </div>
                    <div style={{ display:'flex', gap:8, marginTop:12 }}>
                      <button onClick={()=>setDateRange([2026,2026])} style={{padding:'8px 12px', border:'1px solid #9b9b9b', background:'#f5f5f5'}}>This year</button>
                      <button onClick={()=>setDateRange([2021,2026])} style={{padding:'8px 12px', border:'1px solid #9b9b9b', background:'#f5f5f5'}}>Last 5 years</button>
                      <button onClick={()=>setDateRange([2016,2026])} style={{padding:'8px 12px', border:'1px solid #9b9b9b', background:'#f5f5f5'}}>Last 10 years</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sort dropdown */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap:8 }}>
                <label style={{ color:'#444', fontSize:13 }}>Sort by</label>
                <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} style={{ padding:'6px 8px' }}>
                  <option value="relevance">Relevance</option>
                  <option value="citations">Citation count</option>
                </select>
              </div>
            </div>

            <div>
              {visible.map((r, i) => (
                <div key={i} style={{ padding: "18px 0", borderBottom: "1px solid #eee" }}>
                  <button 
                    onClick={() => navigate(`/paper/${r.paperId || r.id}`)}
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
                    {r.title}
                  </button>

                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {(r.authors || []).map((a, idx) => {
                      const authorName = typeof a === 'object' ? a.name || '' : a || '';
                      return (
                        <span key={idx} style={{ background: "#f2f6f8", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}>
                          {authorName}
                        </span>
                      );
                    })}
                    <span style={{ color: "#888", fontSize: 13 }}>
                      {r.venue || 'Unknown'} · {r.year || r.date || 'n.d.'}
                    </span>
                  </div>

                  <p style={{ marginTop: 10, color: "#444" }}>
                    {r.abstract ? 
                      (r.abstract.length > 200 ? r.abstract.substring(0, 200) + '...' : r.abstract) : 
                      'No abstract available'}
                  </p>

                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
                    {/* Citations Count */}
                    <span style={{ 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: 6,
                      padding: "6px 10px",
                      background: "#f5f5f5",
                      border: "1px solid #e0e0e0",
                      borderRadius: 4,
                      fontSize: 12,
                      color: "#333",
                      fontWeight: 500
                    }}>
                      {r.citationCount ? r.citationCount.toLocaleString() : 0}
                    </span>

                    {/* PDF Button */}
                    {r.openAccessPdf && r.openAccessPdf.url ? (
                      <a 
                        href={r.openAccessPdf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 10px",
                          background: "#fff",
                          border: "1px solid #e0e0e0",
                          borderRadius: 4,
                          fontSize: 12,
                          color: "#333",
                          textDecoration: "none",
                          cursor: "pointer",
                          fontWeight: 500,
                          whiteSpace: "nowrap"
                        }}
                      >
                        [PDF]
                      </a>
                    ) : null}

                    {/* ArXiv Button - if available */}
                    {r.externalIds && r.externalIds.ArXiv ? (
                      <a 
                        href={`https://arxiv.org/abs/${r.externalIds.ArXiv}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 10px",
                          background: "#fff",
                          border: "1px solid #e0e0e0",
                          borderRadius: 4,
                          fontSize: 12,
                          color: "#333",
                          textDecoration: "none",
                          cursor: "pointer",
                          fontWeight: 500,
                          whiteSpace: "nowrap"
                        }}
                      >
                        arXiv
                      </a>
                    ) : null}

                    {/* Save Button */}
                    <button 
                      onClick={() => openSave(r)} 
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        background: "#fff",
                        border: "1px solid #e0e0e0",
                        borderRadius: 4,
                        fontSize: 12,
                        color: "#333",
                        cursor: "pointer",
                        fontWeight: 500,
                        whiteSpace: "nowrap"
                      }}
                    >
                      Save
                    </button>

                    {/* Cite Button */}
                    <button 
                      onClick={() => openCite(r)} 
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        background: "#fff",
                        border: "1px solid #e0e0e0",
                        borderRadius: 4,
                        fontSize: 12,
                        color: "#333",
                        cursor: "pointer",
                        fontWeight: 500,
                        whiteSpace: "nowrap"
                      }}
                    >
                      Cite
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {visible.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                No related papers found
              </div>
            )}

            {/* Load More Button */}
            {visible.length < relatedPapers.length && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button
                  onClick={handleShowMore}
                  style={{
                    padding: '8px 24px',
                    background: '#3E513E',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  Load More Related Papers
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Save Modal */}
      {saveOpen && saveItem && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 2000 
        }}>
          <div 
            className="save-modal"
            style={{ 
              width: '500px',
              maxWidth: '90vw', 
              background: '#fff', 
              borderRadius: 8,
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)', 
              overflow: 'hidden' 
            }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '20px 24px', 
              borderBottom: '1px solid #e0e0e0' 
            }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#333' }}>Save to Library</h2>
              <button 
                onClick={closeSave} 
                style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: 20, 
                  background: '#3E513E', 
                  color: '#fff', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: 20, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {/* Paper info - smaller */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: 15,
                  fontWeight: 600, 
                  color: '#333', 
                  marginBottom: 6,
                  lineHeight: 1.4 
                }}>
                  {saveItem.title}
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: 12,
                  color: '#666',
                  lineHeight: 1.4 
                }}>
                  {(saveItem.authors || []).slice(0, 2).map(a => typeof a === 'object' ? a.name : a).join(', ')} 
                  {(saveItem.authors || []).length > 2 ? '+ others' : ''} • 
                  {saveItem.venue || 'Unknown'} • {saveItem.year || saveItem.date || 'n.d.'}
                </p>
              </div>

              {/* Libraries list */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ 
                  fontSize: 13,
                  fontWeight: 600, 
                  color: '#444', 
                  marginBottom: 10 
                }}>
                  Select libraries to save to:
                </div>
                
                {availableLibraries.length === 0 ? (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#666',
                    background: '#f9f9f9',
                    borderRadius: 4,
                    border: '1px solid #e0e0e0'
                  }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: 13 }}>
                      You haven't created any libraries yet.
                    </p>
                    <button
                      onClick={() => {
                        closeSave();
                        navigate('/libraries');
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#3E513E',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 500
                      }}
                    >
                      Create Library
                    </button>
                  </div>
                ) : (
                  <div style={{ 
                    maxHeight: 200,
                    overflowY: 'auto', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 4 
                  }}>
                  {availableLibraries.map((library, index) => (
                    <label
                      key={library.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderBottom: index < availableLibraries.length - 1 ? '1px solid #f0f0f0' : 'none',
                        cursor: 'pointer',
                        backgroundColor: selectedLibraries.some(l => l.id === library.id) ? '#f0f7f0' : 'transparent',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLibraries.some(l => l.id === library.id)}
                        onChange={() => toggleLibrarySelection(library)}
                        style={{ marginRight: 10 }}
                      />
                      <span style={{ fontSize: 13, color: '#333' }}>{library.name}</span>
                    </label>
                  ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#e0e0e0', marginBottom: 16 }} />

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Selected count */}
                <div style={{ fontSize: 12, color: '#666' }}>
                  {selectedLibraries.length} {selectedLibraries.length === 1 ? 'library' : 'libraries'} selected
                </div>

                {/* Save button */}
                <button
                  onClick={handleSaveToLibraries}
                  disabled={selectedLibraries.length === 0}
                  style={{
                    padding: '8px 20px',
                    background: selectedLibraries.length === 0 ? '#cccccc' : '#3E513E',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: selectedLibraries.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    transition: 'background-color 0.2s',
                  }}
                >
                  Save to {selectedLibraries.length > 0 ? `${selectedLibraries.length} ` : ''}Library{selectedLibraries.length !== 1 ? 'ies' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Library Modal */}
      {showNewLibraryModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 3000 
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 8,
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#333' }}>
              Create New Library
            </h3>
            <input
              type="text"
              value={newLibraryName}
              onChange={(e) => setNewLibraryName(e.target.value)}
              placeholder="Library name"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleCreateLibrary()}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 14,
                marginBottom: '16px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowNewLibraryModal(false);
                  setNewLibraryName('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#f0f0f0',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLibrary}
                disabled={!newLibraryName.trim() || creatingLibrary}
                style={{
                  padding: '8px 16px',
                  background: newLibraryName.trim() && !creatingLibrary ? '#3E513E' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: newLibraryName.trim() && !creatingLibrary ? 'pointer' : 'not-allowed',
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                {creatingLibrary ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Citation Modal */}
      {citeOpen && citeItem && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 2000 
        }}>
          <div 
            className="cite-modal"
            style={{ 
              width: '580px', 
              maxWidth: '90vw', 
              background: '#fff', 
              borderRadius: 8, 
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)', 
              overflow: 'hidden' 
            }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '20px 24px', 
              borderBottom: '1px solid #e0e0e0' 
            }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#333' }}>Cite Paper</h2>
              <button 
                onClick={closeCite} 
                style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: 20, 
                  background: '#3E513E', 
                  color: '#fff', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: 20, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {citationLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: 16, color: '#666' }}>Loading citation formats...</div>
                </div>
              ) : citationError ? (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ color: '#d32f2f', fontSize: 14, marginBottom: 16 }}>
                    {citationError}
                  </div>
                  <div style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>
                    Using basic citation format instead...
                  </div>
                </div>
              ) : null}

              {/* Format tabs */}
              <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e0e0e0', marginBottom: 20 }}>
                {citationFormats.length > 0 ? (
                  citationFormats.map(format => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      style={{
                        padding: '12px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: selectedFormat === format.id ? '3px solid #3E513E' : '3px solid transparent',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: selectedFormat === format.id ? 600 : 500,
                        color: selectedFormat === format.id ? '#3E513E' : '#666'
                      }}
                    >
                      {format.label}
                    </button>
                  ))
                ) : (
                  // Fallback tabs if no citation formats loaded
                  ['bibtex', 'mla', 'apa', 'ieee'].map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setSelectedFormat(fmt)}
                      style={{
                        padding: '12px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: selectedFormat === fmt ? '3px solid #3E513E' : '3px solid transparent',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: selectedFormat === fmt ? 600 : 500,
                        color: selectedFormat === fmt ? '#3E513E' : '#666'
                      }}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))
                )}
              </div>

              {/* Citation text box */}
              <div style={{ marginBottom: 20 }}>
                <textarea
                  id="cite-textarea"
                  readOnly
                  value={getCurrentCitationText()}
                  style={{
                    width: '100%',
                    height: 200,
                    padding: 12,
                    fontFamily: selectedFormat === 'bibtex' ? 'monospace' : 'inherit',
                    fontSize: selectedFormat === 'bibtex' ? 12 : 14,
                    border: '1px solid #d0d0d0',
                    borderRadius: 4,
                    resize: 'none',
                    background: '#fafafa'
                  }}
                />
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#e0e0e0', marginBottom: 20 }} />

              {/* Copy and Export */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Export */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 8 }}>Export</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={downloadCitation}
                      style={{
                        padding: '8px 16px',
                        background: '#3E513E',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500
                      }}
                    >
                      Download {selectedFormat === 'bibtex' ? 'BibTeX' : 'Text'}
                    </button>
                  </div>
                </div>

                {/* Copy button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {copied && <span style={{ color: '#0b8043', fontWeight: 600, fontSize: 13 }}>Copied!</span>}
                  <button
                    onClick={copyCitation}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'transparent',
                      border: 'none',
                      color: '#3E513E',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 1H4a2 2 0 00-2 2v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="8" y="5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Library Modal */}
      {showNewLibraryModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 3000 
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 8,
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#333' }}>
              Create New Library
            </h3>
            <input
              type="text"
              value={newLibraryName}
              onChange={(e) => setNewLibraryName(e.target.value)}
              placeholder="Library name"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleCreateLibrary()}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 14,
                marginBottom: '16px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowNewLibraryModal(false);
                  setNewLibraryName('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#f0f0f0',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLibrary}
                disabled={!newLibraryName.trim() || creatingLibrary}
                style={{
                  padding: '8px 16px',
                  background: newLibraryName.trim() && !creatingLibrary ? '#3E513E' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: newLibraryName.trim() && !creatingLibrary ? 'pointer' : 'not-allowed',
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                {creatingLibrary ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RelatedPapersPage;