import React, { useMemo, useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_ENDPOINTS } from "../config/api";

// Import the icons
import bookmarkIcon from "../images/bookmark.png";
import invertedCommasIcon from "../images/inverted-commas.png";

// Global cache for citation data (same as ResultsPage)
const citationCache = new Map();

// Load cache from localStorage on initial load
const loadCitationCacheFromStorage = () => {
  try {
    const stored = localStorage.getItem('citationCache');
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.entries(parsed).forEach(([key, value]) => {
        citationCache.set(key, value);
      });
    }
  } catch (error) {
    console.warn('Failed to load citation cache from storage:', error);
  }
};

// Save cache to localStorage
const saveCitationCacheToStorage = () => {
  try {
    const cacheObj = Object.fromEntries(citationCache);
    localStorage.setItem('citationCache', JSON.stringify(cacheObj));
  } catch (error) {
    console.warn('Failed to save citation cache to storage:', error);
  }
};

// Helper function to fetch citations with caching (same as ResultsPage)
const fetchPaperCitationsWithCache = async (paperId) => {
  // Return from cache if available
  if (citationCache.has(paperId)) {
    console.log(`Using cached citations for paper: ${paperId}`);
    return citationCache.get(paperId);
  }

  try {
    console.log(`Fetching citations for paper: ${paperId}`);
    const response = await fetch(`http://localhost:5000/api/citations/${paperId}`);
    
    if (response.ok) {
      const data = await response.json();
      const citations = data.data || [];
      citationCache.set(paperId, citations);
      saveCitationCacheToStorage(); // Save to localStorage
      return citations;
    }
  } catch (error) {
    console.warn("Could not fetch citations:", error);
  }
  
  return [];
};

// Helper function to fetch BibTeX with caching
const fetchPaperBibtexWithCache = async (paperId) => {
  const citations = await fetchPaperCitationsWithCache(paperId);
  const bibtexFormat = citations.find(f => f.id === 'bibtex');
  return bibtexFormat ? bibtexFormat.value : '';
};

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
  
  // Save modal state - UPDATED to match ResultsPage
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveItem, setSaveItem] = useState(null);
  const [selectedLibraries, setSelectedLibraries] = useState([]);
  const [userLibraries, setUserLibraries] = useState([]);
  const [librariesLoading, setLibrariesLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNewLibraryModal, setShowNewLibraryModal] = useState(false);
  const [newLibraryName, setNewLibraryName] = useState('');
  const [creatingLibrary, setCreatingLibrary] = useState(false);
  // NEW: Track which libraries the paper is already saved in (from ResultsPage)
  const [paperInLibraries, setPaperInLibraries] = useState([]);
  const [checkingPaperInLibraries, setCheckingPaperInLibraries] = useState(false);
  
  // Citation modal state - OPTIMIZED with caching
  const [citeOpen, setCiteOpen] = useState(false);
  const [citeItem, setCiteItem] = useState(null);
  const [citeFormats, setCiteFormats] = useState([]);
  const [citeFormat, setCiteFormat] = useState('bibtex');
  const [copied, setCopied] = useState(false);
  const [citeLoading, setCiteLoading] = useState(false);
  
  // NEW: Track expanded abstracts for each paper
  const [expandedAbstracts, setExpandedAbstracts] = useState({});

  // NEW: Cache for paper-in-library checks (from ResultsPage)
  const paperInLibraryCache = useRef(new Map());

  const containerRef = useRef(null);

  // Load citation cache from localStorage on mount
  useEffect(() => {
    loadCitationCacheFromStorage();
  }, []);

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
            console.log("Citations raw data:", data);
            
            // Handle different response formats
            let citationsArray = [];
            if (data.data && Array.isArray(data.data)) {
              citationsArray = data.data;
            } else if (Array.isArray(data)) {
              citationsArray = data;
            } else if (data.citations) {
              citationsArray = data.citations;
            }
            
            // Process the citations to ensure consistent ID format - FIXED WITH PROPER AUTHORS PROCESSING
            const processedCitations = citationsArray.map(citation => {
              // Extract authors - handle both string and object formats (LIKE REFERENCES PAGE)
              let authorsArray = [];
              if (Array.isArray(citation.authors)) {
                authorsArray = citation.authors.map(author => {
                  if (typeof author === 'object') {
                    // Return the full author object for the save modal
                    return {
                      name: author.name || author.authorName || author.fullName || '',
                      affiliation: author.affiliation || ''
                    };
                  }
                  // If it's just a string, return as object with name field
                  return { name: author || '', affiliation: '' };
                }).filter(author => author.name); // Remove empty authors
              } else if (typeof citation.authors === 'string') {
                authorsArray = [{ name: citation.authors, affiliation: '' }];
              } else if (citation.author) {
                authorsArray = [{ name: citation.author, affiliation: '' }];
              }
              
              return {
                ...citation,
                // Ensure paperId is the main ID (matching ResultsPage format)
                paperId: citation.paperId || citation.id || citation.paper_id,
                // Ensure fieldsOfStudy is an array
                fieldsOfStudy: Array.isArray(citation.fieldsOfStudy) ? citation.fieldsOfStudy : 
                              citation.fields ? (Array.isArray(citation.fields) ? citation.fields : []) : [],
                // Processed authors array
                authors: authorsArray
              };
            });
            
            console.log("Processed citations with authors:", processedCitations);
            setCitations(processedCitations);
            setTotalResults(processedCitations.length);
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

  // Pre-fetch citations for first few citation papers
  useEffect(() => {
    const preFetchCitations = async () => {
      if (!citations || citations.length === 0 || citationsLoading) return;
      
      // Pre-fetch citations for the first few papers
      const papersToPrefetch = citations.slice(0, 5);
      papersToPrefetch.forEach(async (paper) => {
        const paperId = paper.paperId;
        if (paperId && !citationCache.has(paperId)) {
          try {
            const response = await fetch(`http://localhost:5000/api/citations/${paperId}`);
            if (response.ok) {
              const data = await response.json();
              const citations = data.data || [];
              citationCache.set(paperId, citations);
              saveCitationCacheToStorage();
            }
          } catch (error) {
            console.warn(`Pre-fetch failed for paper ${paperId}:`, error);
          }
        }
      });
    };

    if (!citationsLoading && citations.length > 0) {
      preFetchCitations();
    }
  }, [citations, citationsLoading]);

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

  // NEW: Toggle abstract expansion for a specific paper
  const toggleAbstract = (paperId) => {
    setExpandedAbstracts(prev => ({
      ...prev,
      [paperId]: !prev[paperId]
    }));
  };

  // OPTIMIZED: Citation modal functions - Using cached citations like ResultsPage
  const openCite = async (item) => {
    if (!item || !item.paperId) return;
    
    setCiteLoading(true);
    setCiteFormats([]);
    setCiteOpen(true);
    setCopied(false);
    setCiteItem(item);
    
    try {
      // Use cached citations (same as ResultsPage)
      const citations = await fetchPaperCitationsWithCache(item.paperId);
      console.log("Citations (cached/fetched):", citations);
      setCiteFormats(citations);
      
      // Set default format to first available or bibtex
      if (citations && citations.length > 0) {
        setCiteFormat(citations[0].id || 'bibtex');
      } else {
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
    
    // Try to get citation from cached format (same as ResultsPage)
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
      const authors = (citeItem.authors || []).map(a => typeof a === 'object' ? a.name || a : a || '').join(' and ');
      const year = citeItem.year || 'n.d.';

      if (citeFormat === 'BibTeX' || citeFormat === 'bibtex') {
        const authorName = citeItem.authors && citeItem.authors[0] ? 
          (typeof citeItem.authors[0] === 'object' ? citeItem.authors[0].name : citeItem.authors[0]) : 
          'author';
        const key = `${authorName.replace(/\s+/g,'')}${year}`;
        txt = `@inproceedings{${key},\n  title={${citeItem.title}},\n  author={${authors}},\n  booktitle=${citeItem.venue || 'Unknown'},\n  year={${year}},\n}`;
      }

      if (citeFormat === 'MLA') {
        txt = `${authors}. "${citeItem.title}." ${citeItem.venue || 'Unknown'}, ${year}.`;
      }

      if (citeFormat === 'APA') {
        txt = `${authors} (${year}). ${citeItem.title}. ${citeItem.venue || 'Unknown'}.`;
      }

      if (citeFormat === 'IEEE') {
        txt = `[1] ${authors}, "${citeItem.title}", ${citeItem.venue || 'Unknown'}, ${year}.`;
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
    
    // Try to get BibTeX from cached format (same as ResultsPage)
    if (citeFormats && citeFormats.length > 0) {
      const bibTexFormat = citeFormats.find(f => f.id === 'bibtex');
      if (bibTexFormat) {
        content = bibTexFormat.value || '';
      }
    }
    
    // Fallback to local generation if not available
    if (!content && citeItem) {
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
        if (!r.fieldsOfStudy) return false;
        return Array.isArray(r.fieldsOfStudy) && r.fieldsOfStudy.some(f => selectedFields.includes(f));
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
      }
    });
    return Array.from(fields).sort().slice(0, 10);
  }, [citations]);

  // Use real user libraries or empty array
  const availableLibraries = isAuthenticated && userLibraries.length > 0 
    ? userLibraries 
    : [];

  // FIXED: Check if paper is already saved in libraries - FROM RESULTS PAGE
  const checkIfPaperInLibraries = async (s2PaperId) => {
    if (!isAuthenticated || !s2PaperId) return { libraries: [], internalPaperId: null };
    
    // Check cache first
    const cacheKey = `${s2PaperId}_${userLibraries.length}`;
    if (paperInLibraryCache.current.has(cacheKey)) {
      console.log('Using cached paper-in-library result');
      return paperInLibraryCache.current.get(cacheKey);
    }
    
    try {
      setCheckingPaperInLibraries(true);
      const token = localStorage.getItem('access_token');
      
      console.log('Checking if paper is in libraries for s2PaperId:', s2PaperId);
      
      // OPTION 1: Use the getAllUserPapers endpoint from your backend
      try {
        const response = await fetch(`${API_ENDPOINTS.ALL_USER_PAPERS}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const papers = data.papers || [];
          
          // Find the specific paper by s2_paper_id
          const foundPaper = papers.find(p => p.s2_paper_id === s2PaperId);
          
          if (foundPaper && foundPaper.library_ids && foundPaper.library_ids.length > 0) {
            // Map library_ids to actual library objects
            const foundLibraries = availableLibraries.filter(lib => 
              foundPaper.library_ids.includes(lib.id)
            );
            
            console.log('Paper is in libraries (from getAllUserPapers):', foundLibraries);
            paperInLibraryCache.current.set(cacheKey, {
              libraries: foundLibraries,
              internalPaperId: foundPaper.paper_id || foundPaper.id // Store the internal ID
            });
            return {
              libraries: foundLibraries,
              internalPaperId: foundPaper.paper_id || foundPaper.id
            };
          }
        }
      } catch (endpointError) {
        console.log('getAllUserPapers endpoint not available, using library-by-library check');
      }
      
      // OPTION 2: Fallback - check each library individually using getLibraryPapers
      const librariesWithPaper = [];
      let internalPaperId = null;
      
      // Use Promise.all to check libraries in parallel
      const libraryChecks = availableLibraries.map(async (library) => {
        try {
          // Use the getLibraryPapers endpoint to check if paper exists in this library
          const response = await fetch(`${API_ENDPOINTS.LIBRARIES}/${library.id}/papers`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const papers = data.papers || [];
            
            // Check if paper exists in this library's papers by s2_paper_id
            const foundPaper = papers.find(p => p.s2_paper_id === s2PaperId);
            
            if (foundPaper) {
              // Store the internal paper ID from the first found paper
              if (!internalPaperId) {
                internalPaperId = foundPaper.id; // This is the internal paper_id
              }
              return library;
            }
          }
          
          return null;
        } catch (error) {
          console.error(`Error checking library ${library.name}:`, error);
          return null;
        }
      });
      
      // Wait for all checks to complete
      const results = await Promise.all(libraryChecks);
      const foundLibraries = results.filter(lib => lib !== null);
      
      console.log('Paper found in libraries (fallback):', foundLibraries);
      const result = {
        libraries: foundLibraries,
        internalPaperId: internalPaperId
      };
      paperInLibraryCache.current.set(cacheKey, result);
      return result;
      
    } catch (error) {
      console.error('Error checking if paper is in libraries:', error);
      return { libraries: [], internalPaperId: null };
    } finally {
      setCheckingPaperInLibraries(false);
    }
  };

  // UPDATED Save modal functions to match ResultsPage
  const openSave = async (item) => {
    if (!isAuthenticated) {
      alert('Please log in to save papers to libraries');
      navigate('/login');
      return;
    }
    
    setSaveItem(item);
    setSelectedLibraries([]);
    setPaperInLibraries([]);
    setSaveOpen(true);
    
    // Check which libraries this paper is already in
    const paperId = item.paperId; // Use paperId field (should be consistent now)
    if (paperId) {
      console.log('Opening save modal for paper:', item);
      console.log('Paper ID (s2_paper_id):', paperId);
      console.log('Paper authors:', item.authors);
      
      // Show modal immediately, then check libraries in background
      setCheckingPaperInLibraries(true);
      
      const result = await checkIfPaperInLibraries(paperId);
      console.log('Paper check result:', result);
      setPaperInLibraries(result.libraries);
      
      // Store the internal paper ID in saveItem for later use
      const enhancedSaveItem = {
        ...item,
        internalPaperId: result.internalPaperId // Add internal ID to saveItem
      };
      setSaveItem(enhancedSaveItem);
      
      // Pre-select libraries where paper is already saved
      const alreadySavedLibraries = availableLibraries.filter(lib => 
        result.libraries.some(savedLib => savedLib.id === lib.id)
      );
      console.log('Pre-selecting libraries:', alreadySavedLibraries);
      setSelectedLibraries(alreadySavedLibraries);
      
      setCheckingPaperInLibraries(false);
    }
  };

  const closeSave = () => {
    setSaveOpen(false);
    setSaveItem(null);
    setSelectedLibraries([]);
    setPaperInLibraries([]);
    setCheckingPaperInLibraries(false);
  };

  // UPDATED SAVE PAPER TO LIBRARIES - FIXED DATA STRUCTURE
  const handleSaveToLibraries = async () => {
    // If no libraries selected and paper wasn't in any libraries, do nothing
    if (selectedLibraries.length === 0 && paperInLibraries.length === 0) {
      alert('Please select at least one library to save the paper to');
      return;
    }

    // If user has deselected all libraries (including previously saved ones)
    if (selectedLibraries.length === 0 && paperInLibraries.length > 0) {
      const confirmRemove = window.confirm(
        'You have deselected all libraries. This will remove the paper from all ' + 
        paperInLibraries.length + ' libraries it was saved in. Continue?'
      );
      if (!confirmRemove) return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Please log in to save papers');
        navigate('/login');
        return;
      }

      // Get BibTeX for the paper - USING CACHE
      const s2PaperId = saveItem.paperId; // This is the s2_paper_id
      const internalPaperId = saveItem.internalPaperId; // This is the internal DB paper_id
      let bibtexData = '';
      
      if (s2PaperId) {
        bibtexData = await fetchPaperBibtexWithCache(s2PaperId);
      }

      // Prepare paper data according to your backend's savePaperToLibrary endpoint
      // FIXED: Using the exact same structure as ResultsPage
      const paperData = {
        s2_paper_id: s2PaperId || '',
        title: saveItem.title || '',
        venue: Array.isArray(saveItem.venue) ? saveItem.venue[0] : saveItem.venue || '',
        published_year: saveItem.year || saveItem.date || new Date().getFullYear(),
        citation_count: saveItem.citationCount || 0,
        fields_of_study: saveItem.fieldsOfStudy || [],
        abstract: saveItem.abstract || '',
        bibtex: bibtexData || '',
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

      console.log("Updating paper in libraries");
      console.log("s2PaperId:", s2PaperId);
      console.log("internalPaperId:", internalPaperId);
      console.log("Paper data being sent:", paperData);

      // Determine which libraries to add to and which to remove from
      const librariesToAdd = selectedLibraries.filter(lib => 
        !paperInLibraries.some(savedLib => savedLib.id === lib.id)
      );
      
      const librariesToRemove = paperInLibraries.filter(savedLib => 
        !selectedLibraries.some(lib => lib.id === savedLib.id)
      );

      console.log('Libraries to add to:', librariesToAdd.map(l => l.name));
      console.log('Libraries to remove from:', librariesToRemove.map(l => l.name));

      let addedCount = 0;
      let removedCount = 0;
      let failedAdditions = [];
      let failedRemovals = [];

      // Process additions and removals in parallel
      const operations = [];

      // Add paper to new libraries using POST /api/libraries/:library_id/papers
      for (const library of librariesToAdd) {
        operations.push(
          (async () => {
            try {
              console.log(`Adding paper to library: ${library.name}`);
              console.log(`Paper data authors:`, paperData.authors);
              
              const response = await fetch(`${API_ENDPOINTS.LIBRARIES}/${library.id}/papers`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(paperData)
              });

              console.log(`Response status for ${library.name}:`, response.status);
              
              if (response.ok) {
                addedCount++;
                console.log(`✓ Paper added to library ${library.name}`);
              } else {
                let errorText = '';
                try {
                  errorText = await response.text();
                  console.error(`Response text for ${library.name}:`, errorText);
                } catch (e) {
                  console.error(`Could not read response text for ${library.name}:`, e);
                }
                
                let errorData = { message: 'Unknown error' };
                try {
                  if (errorText) {
                    errorData = JSON.parse(errorText);
                  }
                } catch (e) {
                  console.error('Response is not JSON:', errorText);
                  errorData = { message: errorText || `HTTP ${response.status}` };
                }
                
                console.error(`Failed to add to library ${library.name}:`, errorData, 'Status:', response.status);
                failedAdditions.push(`${library.name}: ${errorData.message || `HTTP ${response.status}`}`);
              }
            } catch (error) {
              console.error(`Error adding to library ${library.name}:`, error);
              failedAdditions.push(`${library.name}: ${error.message}`);
            }
          })()
        );
      }

      // Remove paper from deselected libraries using DELETE /api/libraries/:library_id/papers/:paper_id
      // IMPORTANT: Use internalPaperId for deletion, not s2PaperId
      for (const library of librariesToRemove) {
        operations.push(
          (async () => {
            try {
              // Use internalPaperId for the DELETE request
              const paperIdToDelete = internalPaperId || s2PaperId;
              console.log(`Removing paper from library ${library.name}, using paper ID: ${paperIdToDelete}`);
              
              const response = await fetch(`${API_ENDPOINTS.LIBRARIES}/${library.id}/papers/${paperIdToDelete}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });

              if (response.ok) {
                removedCount++;
                console.log(`✓ Paper removed from library ${library.name}`);
              } else if (response.status === 404) {
                // Paper not found in library (might have been removed already)
                console.log(`Paper not found in library ${library.name}, skipping removal`);
                
                // Try fallback: Maybe we need to use s2_paper_id instead?
                if (paperIdToDelete !== s2PaperId) {
                  console.log(`Trying fallback with s2_paper_id: ${s2PaperId}`);
                  const fallbackResponse = await fetch(`${API_ENDPOINTS.LIBRARIES}/${library.id}/papers/${s2PaperId}`, {
                    method: 'DELETE',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  
                  if (fallbackResponse.ok) {
                    removedCount++;
                    console.log(`✓ Paper removed from library ${library.name} (using s2_paper_id)`);
                  }
                }
              } else {
                let errorData = { message: 'Unknown error' };
                try {
                  errorData = await response.json();
                } catch (e) {
                  console.error('Response is not JSON:', e);
                }
                console.error(`Failed to remove from library ${library.name}:`, errorData, 'Status:', response.status);
                failedRemovals.push(`${library.name}: ${errorData.message || `HTTP ${response.status}`}`);
              }
            } catch (error) {
              console.error(`Error removing from library ${library.name}:`, error);
              failedRemovals.push(`${library.name}: ${error.message}`);
            }
          })()
        );
      }

      // Wait for all operations to complete
      await Promise.all(operations);

      // Clear cache since library state has changed
      paperInLibraryCache.current.clear();

      // Show success/error message
      let message = '';
      if (addedCount > 0 || removedCount > 0) {
        message = '✓ Library updates completed!\n';
        if (addedCount > 0) {
          message += `• Added to ${addedCount} librar${addedCount === 1 ? 'y' : 'ies'}\n`;
        }
        if (removedCount > 0) {
          message += `• Removed from ${removedCount} librar${removedCount === 1 ? 'y' : 'ies'}\n`;
        }
      } else {
        message = 'No changes were made.\n';
      }

      if (failedAdditions.length > 0 || failedRemovals.length > 0) {
        message += '\nSome operations failed:\n';
        if (failedAdditions.length > 0) {
          message += `Failed to add: ${failedAdditions.join(', ')}\n`;
        }
        if (failedRemovals.length > 0) {
          message += `Failed to remove: ${failedRemovals.join(', ')}\n`;
        }
      }

      alert(message.trim());
      closeSave();
      
    } catch (error) {
      console.error('Error saving paper:', error);
      alert('Error updating libraries: ' + error.message);
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
        const newLibrary = data.library;
        const newLibObj = { id: newLibrary.id, name: newLibrary.name, role: 'creator' };
        setUserLibraries([...userLibraries, newLibObj]);
        // Auto-select the newly created library
        setSelectedLibraries([...selectedLibraries, newLibObj]);
        setNewLibraryName('');
        setShowNewLibraryModal(false);
        
        // Clear cache since libraries changed
        paperInLibraryCache.current.clear();
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
                    onClick={() => navigate(`/paper/${r.paperId}`)}
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
                    {/* Authors - FIXED to handle object format */}
                    {(r.authors || []).map((a, idx) => {
                      const authorName = typeof a === 'object' ? a.name || '' : a || '';
                      if (!authorName) return null;
                      return (
                        <span key={idx} style={{ background: "#f2f6f8", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}>
                          {authorName}
                        </span>
                      );
                    })}
                    
                    {/* Field of Study */}
                    {r.fieldsOfStudy && r.fieldsOfStudy.length > 0 && (
                      <>
                        {r.fieldsOfStudy.slice(0, 3).map((field, idx) => (
                          <span 
                            key={idx} 
                            style={{ 
                              background: "#e8f4f8", 
                              padding: "4px 8px", 
                              borderRadius: 4, 
                              fontSize: 11,
                              color: "#2c5c6d",
                              fontWeight: 500
                            }}
                          >
                            {field}
                          </span>
                        ))}
                        {r.fieldsOfStudy.length > 3 && (
                          <span 
                            style={{ 
                              background: "#e8f4f8", 
                              padding: "4px 8px", 
                              borderRadius: 4, 
                              fontSize: 11,
                              color: "#2c5c6d",
                              fontWeight: 500
                            }}
                          >
                            +{r.fieldsOfStudy.length - 3} more
                          </span>
                        )}
                      </>
                    )}
                    
                    {/* Venue and Date */}
                    {r.venue && (
                      <span style={{ color: "#888", fontSize: 13 }}>
                        {Array.isArray(r.venue) ? r.venue.join(", ") : r.venue}
                      </span>
                    )}
                    
                    {(r.year || r.date) && (
                      <span style={{ color: "#888", fontSize: 13 }}>
                        {r.venue ? ' · ' : ''}{r.year || r.date || 'n.d.'}
                      </span>
                    )}
                  </div>

                  {/* ABSTRACT WITH EXPAND/COLLAPSE FUNCTIONALITY - ADDED */}
                  {r.abstract && (
                    <div style={{ marginTop: 10 }}>
                      <p style={{ 
                        margin: 0, 
                        color: "#444", 
                        lineHeight: 1.6,
                        fontSize: 14
                      }}>
                        {expandedAbstracts[r.paperId] ? r.abstract : (
                          r.abstract.length > 300 ? `${r.abstract.substring(0, 300)}...` : r.abstract
                        )}
                      </p>
                      {r.abstract.length > 300 && (
                        <button 
                          onClick={() => toggleAbstract(r.paperId)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#3E513E",
                            cursor: "pointer",
                            fontSize: 14,
                            padding: "4px 0 0 0",
                            margin: 0,
                            textDecoration: "underline",
                            fontWeight: 500
                          }}
                        >
                          {expandedAbstracts[r.paperId] ? 'Collapse' : 'Expand'}
                        </button>
                      )}
                    </div>
                  )}

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

      {/* UPDATED Save Modal - MATCHING RESULTS PAGE */}
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
                  {saveItem.venue ? (Array.isArray(saveItem.venue) ? saveItem.venue.join(", ") : saveItem.venue) : ''}
                  {saveItem.year || saveItem.date ? ' • ' + (saveItem.year || saveItem.date || 'n.d.') : ''}
                </p>
                {/* Add fields of study to save modal display */}
                {saveItem.fieldsOfStudy && saveItem.fieldsOfStudy.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {saveItem.fieldsOfStudy.slice(0, 3).map((field, idx) => (
                      <span 
                        key={idx}
                        style={{ 
                          background: "#e8f4f8", 
                          padding: "2px 6px", 
                          borderRadius: 3, 
                          fontSize: 10,
                          color: "#2c5c6d"
                        }}
                      >
                        {field}
                      </span>
                    ))}
                    {saveItem.fieldsOfStudy.length > 3 && (
                      <span 
                        style={{ 
                          background: "#e8f4f8", 
                          padding: "2px 6px", 
                          borderRadius: 3, 
                          fontSize: 10,
                          color: "#2c5c6d"
                        }}
                      >
                        +{saveItem.fieldsOfStudy.length - 3} more
                      </span>
                    )}
                  </div>
                )}
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
                    {paperInLibraries.length > 0 && (
                      <span style={{ 
                        fontSize: 12, 
                        color: '#3E513E',
                        fontWeight: 500,
                        marginLeft: 8
                      }}>
                        ({paperInLibraries.length} already saved)
                      </span>
                    )}
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
                
                {checkingPaperInLibraries ? (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#666',
                    background: '#f9f9f9',
                    borderRadius: 4,
                    border: '1px solid #e0e0e0'
                  }}>
                    <p style={{ margin: 0, fontSize: 13 }}>
                      Please Wait...
                    </p>
                  </div>
                ) : availableLibraries.length === 0 ? (
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
                  {availableLibraries.map((library, index) => {
                    const isAlreadySaved = paperInLibraries.some(l => l.id === library.id);
                    const isSelected = selectedLibraries.some(l => l.id === library.id);
                    
                    return (
                      <label
                        key={library.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderBottom: index < availableLibraries.length - 1 ? '1px solid #f0f0f0' : 'none',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#f0f7f0' : 'transparent',
                          transition: 'background-color 0.2s',
                          position: 'relative'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleLibrarySelection(library)}
                          style={{ marginRight: 10 }}
                        />
                        <span style={{ 
                          fontSize: 13, 
                          color: isAlreadySaved ? '#3E513E' : '#333',
                          fontWeight: isAlreadySaved ? 600 : 400
                        }}>
                          {library.name}
                          {isAlreadySaved && (
                            <span style={{ 
                              fontSize: 11, 
                              color: '#666',
                              fontWeight: 400,
                              marginLeft: 8,
                              fontStyle: 'italic'
                            }}>
                              (already saved)
                            </span>
                          )}
                        </span>
                        {isAlreadySaved && !isSelected && (
                          <span style={{
                            position: 'absolute',
                            right: '14px',
                            fontSize: 11,
                            color: '#d32f2f',
                            fontWeight: 500,
                            backgroundColor: '#ffebee',
                            padding: '2px 6px',
                            borderRadius: 3
                          }}>
                            Will be removed
                          </span>
                        )}
                      </label>
                    );
                  })}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#e0e0e0', marginBottom: 16 }} />

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Selected count */}
                <div style={{ fontSize: 12, color: '#666' }}>
                  {selectedLibraries.length} of {availableLibraries.length} {selectedLibraries.length === 1 ? 'library' : 'libraries'} selected
                </div>

                {/* Save button */}
                <button
                  onClick={handleSaveToLibraries}
                  disabled={selectedLibraries.length === 0 && paperInLibraries.length === 0}
                  style={{
                    padding: '8px 20px',
                    background: (selectedLibraries.length === 0 && paperInLibraries.length === 0) ? '#cccccc' : '#3E513E',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: (selectedLibraries.length === 0 && paperInLibraries.length === 0) ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    transition: 'background-color 0.2s',
                  }}
                >
                  {selectedLibraries.length === 0 && paperInLibraries.length > 0 ? 'Save Changes' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Citation Modal - OPTIMIZED with caching */}
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
                        {fmt.label || fmt.id}
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