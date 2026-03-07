import React, { useMemo, useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useLocation, useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../config/api";

// Import the icons
import bookmarkIcon from "../images/bookmark.png";
import invertedCommasIcon from "../images/inverted-commas.png";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Global cache for citation data
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

// Helper function to fetch citations with caching
const fetchPaperCitationsWithCache = async (paperId) => {
  if (citationCache.has(paperId)) {
    console.log(`Using cached citations for paper: ${paperId}`);
    return citationCache.get(paperId);
  }

  try {
    console.log(`Fetching citations for paper: ${paperId}`);
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/citations/${paperId}`);
    
    if (response.ok) {
      const data = await response.json();
      const citations = data.data || [];
      citationCache.set(paperId, citations);
      saveCitationCacheToStorage();
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

const ResultsPage = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const q = query.get("q") || "";
  const type = query.get("type") || "publications";
  const [searchInput, setSearchInput] = useState(q);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedFields, setSelectedFields] = useState([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [dateRange, setDateRange] = useState([1931, 2026]);
  const [openFields, setOpenFields] = useState(false);
  const [openDate, setOpenDate] = useState(false);
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  
  // Pagination state – now using server‑side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const papersPerPage = 10; // changed from 7 to 10

  // Citation modal state
  const [citeOpen, setCiteOpen] = useState(false);
  const [citeItem, setCiteItem] = useState(null);
  const [citeFormats, setCiteFormats] = useState([]);
  const [citeFormat, setCiteFormat] = useState('bibtex');
  const [copied, setCopied] = useState(false);
  const [citeLoading, setCiteLoading] = useState(false);

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
  // Track which libraries the paper is already saved in
  const [paperInLibraries, setPaperInLibraries] = useState([]);
  const [checkingPaperInLibraries, setCheckingPaperInLibraries] = useState(false);

  // Cache for paper-in-library checks
  const paperInLibraryCache = useRef(new Map());

  // Track expanded abstracts for each paper
  const [expandedAbstracts, setExpandedAbstracts] = useState({});
  
  // Track if user has interacted with search input
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const containerRef = useRef(null);
  const searchFormRef = useRef(null);

  // Load citation cache from localStorage on mount
  useEffect(() => {
    loadCitationCacheFromStorage();
  }, []);

  // Sync searchInput with query param
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // Keep dropdown and filters closed when clicking outside
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

  // Reset to page 1 when any filter/search changes (so we fetch the first page of new results)
  useEffect(() => {
    setCurrentPage(1);
  }, [q, sortBy, dateRange, selectedFields]);

  // Main data fetching – now includes pagination parameters
  useEffect(() => {
    if (!q) {
      setResults([]);
      setTotalResults(0);
      setCurrentPage(1);
      setExpandedAbstracts({});
      return;
    }

    const fetchResults = async () => {
      try {
        setResultsLoading(true);
        setResultsError(null);
        console.log(`Fetching results for: "${q}" page ${currentPage}`);
        
        const params = new URLSearchParams();
        params.append('query', q);
        params.append('limit', papersPerPage);
        params.append('offset', (currentPage - 1) * papersPerPage);
        
        if (sortBy === 'citations') {
          params.append('sortByCitations', 'true');
        }
        
        if (dateRange && dateRange.length === 2 && (dateRange[0] > 1931 || dateRange[1] < 2026)) {
          params.append('yearFrom', dateRange[0]);
          params.append('yearTo', dateRange[1]);
        }
        
        if (selectedFields.length > 0) {
          params.append('fieldsOfStudy', selectedFields.join(','));
        }
        
        const response = await fetch(
          `${API_ENDPOINTS.PAPER_SEARCH}?${params.toString()}`
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log("Results loaded:", data);
          
          const processedResults = (data.data || []).map(paper => ({
            ...paper,
            fieldsOfStudy: Array.isArray(paper.fieldsOfStudy) ? paper.fieldsOfStudy : 
                          paper.fields ? (Array.isArray(paper.fields) ? paper.fields : []) : []
          }));
          
          setResults(processedResults);
          setTotalResults(data.total || processedResults.length || 0);
          setExpandedAbstracts({});
        } else {
          setResultsError("Failed to load results");
          setResults([]);
          setTotalResults(0);
          setExpandedAbstracts({});
        }
      } catch (error) {
        console.error("Results fetch error:", error);
        setResultsError("Error loading results");
        setResults([]);
        setTotalResults(0);
        setExpandedAbstracts({});
      } finally {
        setResultsLoading(false);
      }
    };

    fetchResults();
  }, [q, sortBy, dateRange, selectedFields, currentPage]); // added currentPage to dependencies

  // Pre-fetch citations for current page results (now only 10 papers)
  useEffect(() => {
    const preFetchCitations = async () => {
      if (!results || results.length === 0) return;
      
      // Pre-fetch citations for all papers on current page (max 10)
      results.forEach(async (paper) => {
        if (paper.paperId && !citationCache.has(paper.paperId)) {
          try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/citations/${paper.paperId}`);
            if (response.ok) {
              const data = await response.json();
              const citations = data.data || [];
              citationCache.set(paper.paperId, citations);
              saveCitationCacheToStorage();
            }
          } catch (error) {
            console.warn(`Pre-fetch failed for paper ${paper.paperId}:`, error);
          }
        }
      });
    };

    if (!resultsLoading && results.length > 0) {
      preFetchCitations();
    }
  }, [results, resultsLoading]);

  // Autocomplete handler with 1 second delay
  useEffect(() => {
    if (!hasUserInteracted || !searchInput || searchInput.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSuggestionsLoading(true);
        console.log(`Fetching autocomplete for: "${searchInput}"`);
        const response = await fetch(`${API_ENDPOINTS.AUTOCOMPLETE}?query=${encodeURIComponent(searchInput)}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Autocomplete response:", data);
          setSuggestions(data.matches || []);
          setShowSuggestions(true);
        } else {
          console.error("Autocomplete response not ok:", response.status);
        }
      } catch (error) {
        console.error("Autocomplete error:", error);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchInput, hasUserInteracted]);

  // Close dropdown when clicking outside search form
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchFormRef.current && !searchFormRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch user libraries (corrected to match backend response structure)
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
          let libraries = [];

          if (data.my_libraries && Array.isArray(data.my_libraries)) {
            libraries = data.my_libraries.map(lib => ({ 
              id: lib.id, 
              name: lib.name, 
              role: 'creator' 
            }));
          }

          if (data.shared_with_others && Array.isArray(data.shared_with_others)) {
            libraries = [...libraries, ...data.shared_with_others.map(lib => ({ 
              id: lib.id, 
              name: lib.name, 
              role: 'creator' 
            }))];
          }

          if (data.shared_with_me && Array.isArray(data.shared_with_me)) {
            libraries = [...libraries, ...data.shared_with_me.map(lib => ({ 
              id: lib.id, 
              name: lib.name, 
              role: lib.role 
            }))];
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

  // Extract available fields from current page results (only for filter UI – limited)
  const availableFields = useMemo(() => {
    const fields = new Set();
    results.forEach(r => {
      if (r.fieldsOfStudy && Array.isArray(r.fieldsOfStudy)) {
        r.fieldsOfStudy.forEach(f => fields.add(f));
      }
    });
    return Array.from(fields).sort().slice(0, 10);
  }, [results]);

  const availableLibraries = isAuthenticated && userLibraries.length > 0 
    ? userLibraries 
    : [];

  // Pagination calculations based on totalResults from API
  const totalPages = Math.ceil(totalResults / papersPerPage);
  const startIndex = (currentPage - 1) * papersPerPage;
  const endIndex = startIndex + results.length; // results.length may be less than papersPerPage on last page

  const onHeaderSearch = (e) => {
    e && e.preventDefault && e.preventDefault();
    setShowSuggestions(false);
    setHasUserInteracted(false);
    
    if (!searchInput.trim()) {
      return;
    }
    
    navigate(`/search?q=${encodeURIComponent(searchInput)}&type=${encodeURIComponent(type)}`);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchInput(suggestion.title);
    setShowSuggestions(false);
    setHasUserInteracted(false);
    
    if (suggestion.title.trim()) {
      navigate(`/search?q=${encodeURIComponent(suggestion.title)}&type=${encodeURIComponent(type)}`);
    }
  };

  const toggleAbstract = (paperId) => {
    setExpandedAbstracts(prev => ({
      ...prev,
      [paperId]: !prev[paperId]
    }));
  };

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

  // Citation modal functions with caching
  const openCite = async (item) => {
    if (!item || !item.paperId) return;
    
    setCiteLoading(true);
    setCiteFormats([]);
    setCiteOpen(true);
    setCopied(false);
    setCiteItem(item);
    
    try {
      const citations = await fetchPaperCitationsWithCache(item.paperId);
      console.log("Citations (cached/fetched):", citations);
      setCiteFormats(citations);
      
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
    
    if (citeFormats && citeFormats.length > 0) {
      const selectedFormat = citeFormats.find(f => f.id === citeFormat);
      if (selectedFormat) {
        if (selectedFormat.id === 'bibtex') {
          txt = selectedFormat.value || '';
        } else {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = selectedFormat.value || '';
          txt = tempDiv.textContent || tempDiv.innerText || '';
        }
      }
    }
    
    if (!txt && citeItem) {
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
    
    if (citeFormats && citeFormats.length > 0) {
      const bibTexFormat = citeFormats.find(f => f.id === 'bibtex');
      if (bibTexFormat) {
        content = bibTexFormat.value || '';
      }
    }
    
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

  // Check if paper is already saved in libraries
  const checkIfPaperInLibraries = async (s2PaperId) => {
    if (!isAuthenticated || !s2PaperId) return [];
    
    const cacheKey = `${s2PaperId}_${userLibraries.length}`;
    if (paperInLibraryCache.current.has(cacheKey)) {
      console.log('Using cached paper-in-library result');
      return paperInLibraryCache.current.get(cacheKey);
    }
    
    try {
      setCheckingPaperInLibraries(true);
      const token = localStorage.getItem('access_token');
      
      console.log('Checking if paper is in libraries for s2PaperId:', s2PaperId);
      
      // Try getAllUserPapers endpoint
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
          
          const foundPaper = papers.find(p => p.s2_paper_id === s2PaperId);
          
          if (foundPaper && foundPaper.library_ids && foundPaper.library_ids.length > 0) {
            const foundLibraries = availableLibraries.filter(lib => 
              foundPaper.library_ids.includes(lib.id)
            );
            
            console.log('Paper is in libraries (from getAllUserPapers):', foundLibraries);
            paperInLibraryCache.current.set(cacheKey, {
              libraries: foundLibraries,
              internalPaperId: foundPaper.paper_id || foundPaper.id
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
      
      // Fallback: check each library individually
      const librariesWithPaper = [];
      let internalPaperId = null;
      
      const libraryChecks = availableLibraries.map(async (library) => {
        try {
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
            
            const foundPaper = papers.find(p => p.s2_paper_id === s2PaperId);
            
            if (foundPaper) {
              if (!internalPaperId) {
                internalPaperId = foundPaper.id;
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

  // Save modal functions
  const openSave = async (item) => {
    if (!isAuthenticated) {
      alert('Please log in to save papers to libraries');
      navigate('/login');
      return;
    }
    
    const saveItemWithPdf = {
      ...item,
      pdf_url: item.pdf_url || item.pdfUrl || item.openAccessPdf?.url || ''
    };
    setSaveItem(saveItemWithPdf);
    setSelectedLibraries([]);
    setPaperInLibraries([]);
    setSaveOpen(true);
    
    const paperId = item.paperId || item.id;
    if (paperId) {
      console.log('Opening save modal for paper:', item.title);
      console.log('Paper ID (s2_paper_id):', paperId);
      
      setCheckingPaperInLibraries(true);
      
      const result = await checkIfPaperInLibraries(paperId);
      console.log('Paper check result:', result);
      setPaperInLibraries(result.libraries);
      
      const enhancedSaveItem = {
        ...saveItemWithPdf,
        internalPaperId: result.internalPaperId
      };
      setSaveItem(enhancedSaveItem);
      
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

  // ================== UPDATED handleSaveToLibraries with abstract fix ==================
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

      const s2PaperId = saveItem.paperId || saveItem.id;
      // Validate required ID
      if (!s2PaperId) {
        alert('Cannot save paper: missing paper ID');
        return;
      }

      const internalPaperId = saveItem.internalPaperId;
      let bibtexData = '';
      
      if (s2PaperId) {
        bibtexData = await fetchPaperBibtexWithCache(s2PaperId);
      }

      // Prepare paper data with proper type checking for abstract
      const paperData = {
        s2_paper_id: s2PaperId,
        title: saveItem.title || 'Untitled',
        venue: Array.isArray(saveItem.venue) ? saveItem.venue[0] : saveItem.venue || '',
        published_year: saveItem.year || new Date().getFullYear(),
        citation_count: saveItem.citationCount || 0,
        fields_of_study: saveItem.fieldsOfStudy || [],
        // Ensure abstract is a string, not an array
        abstract: (() => {
          if (typeof saveItem.abstract === 'string') return saveItem.abstract;
          if (Array.isArray(saveItem.abstract)) return saveItem.abstract[0] || '';
          return '';
        })(),
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
        user_note: '',
        pdf_url: saveItem.pdf_url || saveItem.pdfUrl || saveItem.openAccessPdf?.url || ''
      };

      console.log("Updating paper in libraries");
      console.log("s2PaperId:", s2PaperId);
      console.log("internalPaperId:", internalPaperId);

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

      const operations = [];

      // Add paper to new libraries
      for (const library of librariesToAdd) {
        operations.push(
          (async () => {
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
                addedCount++;
                console.log(`✓ Paper added to library ${library.name}`);
              } else {
                // Handle 409 Conflict as success (paper already exists)
                if (response.status === 409) {
                  console.log(`Paper already exists in library ${library.name}, counting as added.`);
                  addedCount++;
                } else {
                  // Try to parse error response safely
                  let errorMessage = 'Unknown error';
                  try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
                  } catch (parseError) {
                    // If response is not JSON, get text
                    try {
                      errorMessage = await response.text();
                    } catch (textError) {
                      errorMessage = `HTTP ${response.status}`;
                    }
                  }
                  console.error(`Failed to add to library ${library.name}:`, errorMessage);
                  failedAdditions.push(`${library.name}: ${errorMessage}`);
                }
              }
            } catch (error) {
              console.error(`Error adding to library ${library.name}:`, error);
              failedAdditions.push(`${library.name}: ${error.message}`);
            }
          })()
        );
      }

      // Remove paper from deselected libraries
      for (const library of librariesToRemove) {
        operations.push(
          (async () => {
            try {
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
                console.log(`Paper not found in library ${library.name}, skipping removal`);
                
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
                  } else {
                    // Fallback also failed – log but don't count as failure if already removed
                    console.log(`Fallback removal also failed, skipping.`);
                  }
                }
              } else {
                // Parse error message safely
                let errorMessage = 'Unknown error';
                try {
                  const errorData = await response.json();
                  errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
                } catch (parseError) {
                  try {
                    errorMessage = await response.text();
                  } catch (textError) {
                    errorMessage = `HTTP ${response.status}`;
                  }
                }
                console.error(`Failed to remove from library ${library.name}:`, errorMessage);
                failedRemovals.push(`${library.name}: ${errorMessage}`);
              }
            } catch (error) {
              console.error(`Error removing from library ${library.name}:`, error);
              failedRemovals.push(`${library.name}: ${error.message}`);
            }
          })()
        );
      }

      await Promise.all(operations);

      paperInLibraryCache.current.clear();

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
  // =====================================================================================

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
        setSelectedLibraries([...selectedLibraries, newLibObj]);
        setNewLibraryName('');
        setShowNewLibraryModal(false);
        
        paperInLibraryCache.current.clear();
      } else {
        let errorMsg = 'Failed to create library';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
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
        <div ref={searchFormRef} style={{ position: "relative", maxWidth: 920, marginBottom: 18 }}>
          <form onSubmit={onHeaderSearch} style={{ display: "flex" }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setHasUserInteracted(true);
              }}
              onFocus={() => {
                setHasUserInteracted(true);
                if (searchInput.trim().length >= 2) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="Search for articles..."
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

          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 72,
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                borderTop: "none",
                borderRadius: "0 0 4px 4px",
                maxHeight: "300px",
                overflowY: "auto",
                zIndex: 1000,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}
            >
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: "12px 12px",
                    cursor: "pointer",
                    borderBottom: idx < suggestions.length - 1 ? "1px solid #f0f0f0" : "none",
                    transition: "background-color 0.2s",
                    fontSize: 13,
                    color: "#333"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div style={{ fontWeight: 500 }}>{suggestion.title}</div>
                  {suggestion.authorsYear && (
                    <div style={{ fontSize: 11, color: "#888" }}>{suggestion.authorsYear}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {suggestionsLoading && searchInput.trim().length >= 2 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 72,
                padding: "12px 12px",
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                borderTop: "none",
                borderRadius: "0 0 4px 4px",
                fontSize: 13,
                color: "#666",
                zIndex: 1000
              }}
            >
              Loading suggestions...
            </div>
          )}
        </div>

        <h3 style={{ marginTop: 8, marginBottom: 12, fontSize: 16, fontWeight: 500, color: '#333' }}>
          {resultsLoading ? 'Loading results...' : 
           q ? 
             (totalResults > 0 ? 
               `About ${totalResults.toLocaleString()} results for "${q}"` : 
               `No results found for "${q}"`) : 
             'Enter a search query'}
        </h3>

        {resultsError && (
          <div style={{ color: '#d32f2f', marginBottom: 20 }}>
            {resultsError}
          </div>
        )}

        {!resultsLoading && totalResults > 0 && (
          <>
            <div ref={containerRef} style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center", flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => { setOpenFields(o=>!o); setOpenDate(false); }} style={{ padding: "8px 12px", border: "1px solid #e2e6ea", background: "#fff" }}>Fields of Study ▾</button>
                {openFields && (
                  <div style={{ position: 'absolute', top: 40, left: 0, background: '#fff', border: '1px solid #ddd', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 12, width: 260, zIndex: 60 }}>
                    <strong style={{display:'block', marginBottom:8}}>Fields of Study</strong>
                    {availableFields.map((f) => (
                      <label key={f} style={{ display: 'block', marginBottom: 6 }}>
                        <input type="checkbox" checked={selectedFields.includes(f)} onChange={() => {
                          setSelectedFields((prev) => prev.includes(f) ? prev.filter(x=>x!==f) : [...prev, f]);
                        }} /> <span style={{marginLeft:8}}>{f}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ position: 'relative' }}>
                <button onClick={() => { setOpenDate(o=>!o); setOpenFields(false); }} style={{ padding: "8px 12px", border: "1px solid #e2e6ea", background: "#fff" }}>Date Range ▾</button>
                {openDate && (
                  <div style={{ position: 'absolute', top: 40, left: 0, background: '#fff', border: '1px solid #ddd', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 16, width: 360, zIndex:50, overflow: 'hidden', boxSizing: 'border-box' }}>
                    <div style={{ position: 'relative', padding: '6px 0' }}>
                      <input
                        type="range"
                        min={1931}
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
                        min={1931}
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

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap:8 }}>
                <label style={{ color:'#444', fontSize:13 }}>Sort by</label>
                <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} style={{ padding:'6px 8px' }}>
                  <option value="relevance">Relevance</option>
                  <option value="citations">Citation count</option>
                </select>
              </div>
            </div>

            <div>
              {results.map((r, i) => (
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
                    {r.authors && r.authors.map((a, idx) => (
                      <span key={idx} style={{ background: "#f2f6f8", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}>
                        {typeof a === 'object' ? a.name || '' : a || ''}
                      </span>
                    ))}
                    
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

            {totalPages > 1 && (
              <div style={{ marginTop: 40, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
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

            {totalResults > 0 && (
              <div style={{ marginTop: 20, textAlign: "center", color: "#666", fontSize: 14 }}>
                Showing papers {startIndex + 1} to {endIndex} of {totalResults} results
              </div>
            )}
          </>
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

            <div style={{ padding: '24px' }}>
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

              <div style={{ height: '1px', background: '#e0e0e0', marginBottom: 16 }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {selectedLibraries.length} of {availableLibraries.length} {selectedLibraries.length === 1 ? 'library' : 'libraries'} selected
                </div>

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
                  {selectedLibraries.length === 0 && paperInLibraries.length > 0 ? 'Remove from All Libraries' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Citation Modal */}
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

            <div style={{ padding: '24px' }}>
              {citeLoading && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                  Loading citation formats...
                </div>
              )}
              
              {!citeLoading && citeFormats.length > 0 && (
                <>
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

                  <div style={{ height: '1px', background: '#e0e0e0', marginBottom: 20 }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

export default ResultsPage;