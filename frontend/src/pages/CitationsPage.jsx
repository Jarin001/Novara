import React, { useMemo, useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_ENDPOINTS } from "../config/api";

// Import the icons
import bookmarkIcon from "../images/bookmark.png";
import invertedCommasIcon from "../images/inverted-commas.png";

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

// Helper function to fetch BibTeX for a paper
const fetchPaperBibtex = async (paperId) => {
  try {
    console.log(`Fetching BibTeX for paper: ${paperId}`);
    const response = await fetch(`http://localhost:5000/api/citations/${paperId}`);
    
    if (response.ok) {
      const data = await response.json();
      const bibtexFormat = data.data?.find(f => f.id === 'bibtex');
      if (bibtexFormat && bibtexFormat.value) {
        console.log("BibTeX fetched successfully");
        return bibtexFormat.value;
      }
    }
  } catch (error) {
    console.warn("Could not fetch BibTeX:", error);
  }
  return '';
};

const CitationsPage = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  
  const [citations, setCitations] = useState([]);
  const [citationsLoading, setCitationsLoading] = useState(true);
  const [citationsError, setCitationsError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [citationCount, setCitationCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(10);
  
  const [selectedFields, setSelectedFields] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [dateRange, setDateRange] = useState([2010, 2026]);
  const [openFields, setOpenFields] = useState(false);
  const [openDate, setOpenDate] = useState(false);
  
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
  
  // Citation modal state - UPDATED TO MATCH PAPERDETAILS
  const [citeOpen, setCiteOpen] = useState(false);
  const [citeItem, setCiteItem] = useState(null);
  const [citeFormats, setCiteFormats] = useState([]);
  const [citeFormat, setCiteFormat] = useState('bibtex');
  const [copied, setCopied] = useState(false);
  const [citeLoading, setCiteLoading] = useState(false);
  
  const containerRef = useRef(null);

  // First fetch paper details to get citationCount, then fetch citations
  useEffect(() => {
    if (!paperId) {
      setCitationsError('No paper ID provided');
      setCitationsLoading(false);
      return;
    }

    const fetchPaperDetailsAndCitations = async () => {
      try {
        setCitationsLoading(true);
        setCitationsError(null);
        console.log(`Fetching paper details for: ${paperId}`);
        
        // First, get the paper details to know the citation count
        const paperResponse = await fetch(`http://localhost:5000/api/papers/${paperId}`);
        if (!paperResponse.ok) {
          throw new Error(`Failed to fetch paper details: ${paperResponse.status}`);
        }
        
        const paperData = await paperResponse.json();
        const citationCount = paperData.citationCount || 0;
        setCitationCount(citationCount);
        
        console.log(`Paper has ${citationCount} citations, now fetching citations...`);
        
        // Then fetch citations using the paper-citations controller
        if (citationCount > 0) {
          const response = await fetch(
            `http://localhost:5000/api/papers/${paperId}/citations?citationCount=${citationCount}&limit=100`
          );
          
          console.log(`Citations response status: ${response.status}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log("Citations loaded:", data);
            
            // Handle different response formats
            if (data.data && Array.isArray(data.data)) {
              setCitations(data.data);
              setTotalResults(data.data.length);
            } else if (Array.isArray(data)) {
              setCitations(data);
              setTotalResults(data.length);
            } else if (data.citations) {
              setCitations(data.citations);
              setTotalResults(data.citations.length);
            } else {
              setCitations([]);
              setTotalResults(0);
            }
          } else {
            const errorText = await response.text();
            console.error(`Error (${response.status}):`, errorText);
            setCitationsError(`Failed to load citations (${response.status})`);
            setCitations([]);
            setTotalResults(0);
          }
        } else {
          // Paper has no citations
          setCitations([]);
          setTotalResults(0);
        }
      } catch (error) {
        console.error("Citations fetch error:", error);
        setCitationsError(`Error loading citations: ${error.message}`);
        setCitations([]);
        setTotalResults(0);
      } finally {
        setCitationsLoading(false);
      }
    };

    fetchPaperDetailsAndCitations();
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

  // UPDATED: Citation modal functions - MATCHING PAPERDETAILS.JSX
  const openCite = async (item) => {
    if (!item || !item.paperId) return;
    
    setCiteLoading(true);
    setCiteFormats([]);
    setCiteOpen(true);
    setCopied(false);
    setCiteItem(item);
    
    try {
      console.log(`Fetching citations for paper: ${item.paperId}`);
      const response = await fetch(`http://localhost:5000/api/citations/${item.paperId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Citations fetched:", data);
        setCiteFormats(data.data || []);
        
        // Set default format to first available or bibtex
        if (data.data && data.data.length > 0) {
          setCiteFormat(data.data[0].id || 'bibtex');
        } else {
          setCiteFormat('bibtex');
        }
      } else {
        console.error("Failed to fetch citations");
        setCiteFormats([]);
        setCiteFormat('bibtex');
      }
    } catch (error) {
      console.error("Citation fetch error:", error);
      setCiteFormats([]);
      setCiteFormat('bibtex');
    } finally {
      setCiteLoading(false);
    }
  };

  const closeCite = () => {
    setCiteOpen(false);
    setCiteItem(null);
    setCiteFormats([]);
    setCopied(false);
  };

  const copyCitation = async () => {
    let txt = '';
    
    // Try to get citation from backend format
    if (citeFormats && citeFormats.length > 0) {
      const selectedFormat = citeFormats.find(f => f.id === citeFormat);
      if (selectedFormat) {
        // For BibTeX, use plain text. For HTML formats, extract text content
        if (selectedFormat.id === 'bibtex') {
          txt = selectedFormat.value || '';
        } else {
          // Create a temporary div to extract text from HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = selectedFormat.value || '';
          txt = tempDiv.textContent || tempDiv.innerText || '';
        }
      }
    }
    
    // Fallback to local generation if not available
    if (!txt && citeItem) {
      // Fallback citation generation (same as PaperDetails)
      const authors = (citeItem.authors || []).map(a => typeof a === 'object' ? a.name || a : a || '').join(' and ');
      const year = citeItem.year || 'n.d.';

      if (citeFormat === 'BibTeX' || citeFormat === 'bibtex') {
        const authorName = citeItem.authors && citeItem.authors[0] ? 
          (typeof citeItem.authors[0] === 'object' ? citeItem.authors[0].name : citeItem.authors[0]) : 
          'author';
        const key = `${authorName.replace(/\s+/g,'')}${year}`;
        return `@inproceedings{${key},\n  title={${citeItem.title}},\n  author={${authors}},\n  booktitle=${citeItem.venue || 'Unknown'},\n  year={${year}},\n}`;
      }

      if (citeFormat === 'MLA') {
        return `${authors}. "${citeItem.title}." ${citeItem.venue || 'Unknown'}, ${year}.`;
      }

      if (citeFormat === 'APA') {
        return `${authors} (${year}). ${citeItem.title}. ${citeItem.venue || 'Unknown'}.`;
      }

      if (citeFormat === 'IEEE') {
        return `[1] ${authors}, "${citeItem.title}", ${citeItem.venue || 'Unknown'}, ${year}.`;
      }
    }
    
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      const el = document.getElementById(citeFormat === 'bibtex' ? 'cite-textarea' : 'cite-html');
      if (el) {
        // For textarea, use select(). For div, create range
        if (citeFormat === 'bibtex') {
          el.select();
        } else {
          const range = document.createRange();
          range.selectNodeContents(el);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
        try { document.execCommand('copy'); setCopied(true); setTimeout(()=>setCopied(false),1600); } catch(_){}
      }
    }
  };

  const downloadBibTeX = () => {
    let content = '';
    
    // Try to get BibTeX from backend format
    if (citeFormats && citeFormats.length > 0) {
      const bibTexFormat = citeFormats.find(f => f.id === 'bibtex');
      if (bibTexFormat) {
        content = bibTexFormat.value || '';
      }
    }
    
    // Fallback to local generation if not available
    if (!content && citeItem) {
      // Fallback BibTeX generation
      const authors = (citeItem.authors || []).map(a => typeof a === 'object' ? a.name || a : a || '').join(' and ');
      const year = citeItem.year || 'n.d.';
      const authorName = citeItem.authors && citeItem.authors[0] ? 
        (typeof citeItem.authors[0] === 'object' ? citeItem.authors[0].name : citeItem.authors[0]) : 
        'author';
      const key = `${authorName.replace(/\s+/g,'')}${year}`;
      content = `@inproceedings{${key},\n  title={${citeItem.title}},\n  author={${authors}},\n  booktitle=${citeItem.venue || 'Unknown'},\n  year={${year}},\n}`;
    }
    
    const name = sanitizeFilename((citeItem && citeItem.title) || 'paper') + '.bib';
    downloadFile(name, content, 'application/x-bibtex');
  };

  // Filter and sort citations
  const visible = useMemo(() => {
    let list = citations.slice();

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
      // Default relevance sorting (by date in descending order)
      list.sort((a, b) => {
        const yearA = a.year || a.date || 0;
        const yearB = b.year || b.date || 0;
        return yearB - yearA;
      });
    }

    return list.slice(0, visibleCount);
  }, [citations, selectedFields, dateRange, sortBy, visibleCount]);

  // Extract available fields from citations
  const availableFields = useMemo(() => {
    const fields = new Set();
    citations.forEach(r => {
      if (r.fieldsOfStudy && Array.isArray(r.fieldsOfStudy)) {
        r.fieldsOfStudy.forEach(f => fields.add(f));
      } else if (r.fields && Array.isArray(r.fields)) {
        r.fields.forEach(f => fields.add(f));
      }
    });
    return Array.from(fields).sort().slice(0, 10);
  }, [citations]);

  // Use real user libraries or empty array
  const availableLibraries = isAuthenticated && userLibraries.length > 0 
    ? userLibraries 
    : [];

  // Save modal functions
  const openSave = async (item) => {
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

  // FIXED: Save paper to libraries with BibTeX
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

      // Get BibTeX for the paper
      const paperIdToFetch = saveItem.paperId || saveItem.id;
      let bibtexData = '';
      
      if (paperIdToFetch) {
        bibtexData = await fetchPaperBibtex(paperIdToFetch);
      }

      // Prepare paper data with BibTeX
      const paperData = {
        s2_paper_id: paperIdToFetch || '',
        title: saveItem.title || '',
        venue: Array.isArray(saveItem.venue) ? saveItem.venue[0] : saveItem.venue || '',
        published_year: saveItem.year || saveItem.date || new Date().getFullYear(),
        citation_count: saveItem.citationCount || 0,
        fields_of_study: saveItem.fieldsOfStudy || saveItem.fields || [],
        abstract: saveItem.abstract || '',
        bibtex: bibtexData || '', // Include BibTeX here
        authors: (saveItem.authors || []).map(a => { 
          if (typeof a === 'object') {
            return { 
              name: a.name || '',
              affiliation: a.affiliation || ''
            };
          }
          return { name: a || '', affiliation: '' };
        }),
        reading_status: 'unread',
        user_note: ''
      };

      console.log("Saving citation paper with data:", {
        ...paperData,
        bibtex_length: (bibtexData || '').length,
        has_bibtex: !!(bibtexData && bibtexData.trim())
      });

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
            const result = await response.json();
            console.log(`Paper saved to library ${library.name}:`, result);
          } else {
            const errorData = await response.json();
            console.error(`Failed to save to library ${library.name}:`, errorData);
            failedLibraries.push(`${library.name}: ${errorData.message || 'Unknown error'}`);
            failedCount++;
          }
        } catch (error) {
          console.error(`Error saving to library ${library.name}:`, error);
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

  // Handle load more
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  return (
    <>
      <Navbar />

      <div style={{ 
        paddingTop: 100, 
        paddingLeft: 40, 
        paddingRight: 40,
        minHeight: 'calc(100vh - 100px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Loading State */}
        {citationsLoading && (
          <div style={{ 
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px'
          }}>
            <div style={{ fontSize: 18, color: '#666' }}>Loading citations...</div>
          </div>
        )}

        {/* Error State */}
        {citationsError && (
          <div style={{ 
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: 18, color: '#d32f2f' }}>Error: {citationsError}</div>
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
          </div>
        )}

        {/* Main Content - Only show if there are citations */}
        {!citationsLoading && !citationsError && citations.length > 0 && (
          <>
            {/* Header showing which paper's citations we're viewing */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#333', marginBottom: 8 }}>
                Papers Citing This Work
              </h2>
              <p style={{ color: '#666', fontSize: 14 }}>
                Showing {visible.length} of {citationCount} papers that cite this work
              </p>
            </div>

            <h3 style={{ marginTop: 8, marginBottom: 12, fontSize: 16, fontWeight: 500, color: '#333' }}>
              About {citationCount.toLocaleString()} results
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
                    {/* Authors */}
                    {(r.authors || []).map((a, idx) => {
                      const authorName = typeof a === 'object' ? a.name || '' : a || '';
                      return (
                        <span key={idx} style={{ background: "#f2f6f8", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}>
                          {authorName}
                        </span>
                      );
                    })}
                    
                    {/* Field of Study */}
                    {r.fieldsOfStudy && r.fieldsOfStudy.length > 0 && (
                      <span style={{ 
                        background: "#e8f4f8", 
                        padding: "4px 8px", 
                        borderRadius: 4, 
                        fontSize: 12,
                        color: "#2c5282",
                        fontWeight: 500
                      }}>
                        {r.fieldsOfStudy[0]}
                        {r.fieldsOfStudy.length > 1 && ` +${r.fieldsOfStudy.length - 1}`}
                      </span>
                    )}
                    
                    {/* Venue and Date */}
                    <span style={{ color: "#888", fontSize: 13 }}>
                      {r.venue || ''} · {r.year || r.date || 'n.d.'} 
                    </span>
                  </div>

                  <p style={{ marginTop: 10, color: "#444" }}>
                    {r.abstract ? 
                      (r.abstract.length > 200 ? r.abstract.substring(0, 200) + '...' : r.abstract) : 
                      ''}
                  </p>

                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
                    {/* Citations Count with inverted commas icon */}
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
                      <img 
                        src={invertedCommasIcon} 
                        alt="Citations" 
                        style={{ width: 12, height: 12, opacity: 0.8 }}
                      />
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

                    {/* Save Button with bookmark icon */}
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
                      <img 
                        src={bookmarkIcon} 
                        alt="Save" 
                        style={{ width: 12, height: 12 }}
                      />
                      Save
                    </button>

                    {/* Cite Button with inverted commas icon */}
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
                      <img 
                        src={invertedCommasIcon} 
                        alt="Cite" 
                        style={{ width: 12, height: 12 }}
                      />
                      Cite
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {visible.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                No citations found matching your filters
              </div>
            )}

            {/* Load More Button */}
            {visible.length < citations.length && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button
                  onClick={handleLoadMore}
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
                  Load More Citations
                </button>
              </div>
            )}
          </>
        )}

        {/* No Citations Found State - Show in the middle of the page */}
        {!citationsLoading && !citationsError && citations.length === 0 && (
          <div style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '40px 20px'
          }}>
            <div style={{ fontSize: 18, marginBottom: 12, color: '#666' }}>No citations found for this paper</div>
            <div style={{ fontSize: 14, color: '#999' }}>
              This paper hasn't been cited by other works yet.
            </div>
          </div>
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
                  {saveItem.fieldsOfStudy && saveItem.fieldsOfStudy.length > 0 ? saveItem.fieldsOfStudy[0] : 'N/A'} • 
                  {saveItem.venue || 'Unknown'} • {saveItem.year || saveItem.date || 'n.d.'}
                </p>
              </div>

              {/* Libraries list */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10
                }}>
                  <div style={{ 
                    fontSize: 13,
                    fontWeight: 600, 
                    color: '#444'
                  }}>
                    Select libraries to save to:
                  </div>
                  <button
                    onClick={() => setShowNewLibraryModal(true)}
                    style={{
                      fontSize: 12,
                      padding: '4px 8px',
                      background: '#f0f0f0',
                      color: '#333',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    + New
                  </button>
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
                      onClick={() => setShowNewLibraryModal(true)}
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

      {/* UPDATED: Citation Modal - EXACTLY LIKE PAPERDETAILS.JSX */}
      {citeOpen && (
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
              {citeLoading && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                  Loading citation formats...
                </div>
              )}
              
              {!citeLoading && citeFormats.length > 0 && (
                <>
                  {/* Format tabs */}
                  <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e0e0e0', marginBottom: 20, overflowX: 'auto' }}>
                    {citeFormats.map(fmt => (
                      <button
                        key={fmt.id}
                        onClick={() => setCiteFormat(fmt.id)}
                        style={{
                          padding: '12px 16px',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: citeFormat === fmt.id ? '3px solid #3E513E' : '3px solid transparent',
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: citeFormat === fmt.id ? 600 : 500,
                          color: citeFormat === fmt.id ? '#3E513E' : '#666',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>

                  {/* Citation display area */}
                  <div style={{ marginBottom: 20 }}>
                    {citeFormat === 'bibtex' ? (
                      <textarea
                        id="cite-textarea"
                        readOnly
                        value={(() => {
                          const selected = citeFormats.find(f => f.id === citeFormat);
                          return selected ? selected.value : '';
                        })()}
                        style={{
                          width: '100%',
                          height: 200,
                          padding: 12,
                          fontFamily: 'monospace',
                          fontSize: 12,
                          border: '1px solid #d0d0d0',
                          borderRadius: 4,
                          resize: 'none',
                          background: '#fafafa'
                        }}
                      />
                    ) : (
                      <div
                        id="cite-html"
                        style={{
                          width: '100%',
                          height: 200,
                          padding: 12,
                          fontSize: 12,
                          border: '1px solid #d0d0d0',
                          borderRadius: 4,
                          background: '#fafafa',
                          overflowY: 'auto'
                        }}
                        dangerouslySetInnerHTML={{
                          __html: (() => {
                            const selected = citeFormats.find(f => f.id === citeFormat);
                            return selected ? selected.value : '';
                          })()
                        }}
                      />
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: '#e0e0e0', marginBottom: 20 }} />

                  {/* Copy and Export */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Export / BibTeX on the left */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 8 }}></div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={downloadBibTeX}
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
                          BibTeX
                        </button>
                      </div>
                    </div>

                    {/* Copy button on the right */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                      {copied && <span style={{ color: '#0b8043', fontWeight: 600, fontSize: 13 }}>Copied!</span>}
                    </div>
                  </div>
                </>
              )}
              
              {!citeLoading && citeFormats.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                  No citation formats available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CitationsPage;