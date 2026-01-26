// // import React, { useMemo, useState, useRef, useEffect } from "react";
// // import Navbar from "../components/Navbar";
// // import { useLocation, useNavigate } from "react-router-dom";
// // import { API_ENDPOINTS } from "../config/api";

// // // Import the icons
// // import bookmarkIcon from "../images/bookmark.png";
// // import invertedCommasIcon from "../images/inverted-commas.png";

// // function useQuery() {
// //   return new URLSearchParams(useLocation().search);
// // }

// // // Helper function to fetch BibTeX for a paper (SAME AS CITATIONSPAGE)
// // const fetchPaperBibtex = async (paperId) => {
// //   try {
// //     console.log(`Fetching BibTeX for paper: ${paperId}`);
// //     const response = await fetch(`http://localhost:5000/api/citations/${paperId}`);
    
// //     if (response.ok) {
// //       const data = await response.json();
// //       const bibtexFormat = data.data?.find(f => f.id === 'bibtex');
// //       if (bibtexFormat && bibtexFormat.value) {
// //         console.log("BibTeX fetched successfully");
// //         return bibtexFormat.value;
// //       }
// //     }
// //   } catch (error) {
// //     console.warn("Could not fetch BibTeX:", error);
// //   }
// //   return '';
// // };

// // const sanitizeFilename = (s = '') => {
// //   return s.replace(/[^a-z0-9\.\-\_]/gi, '-').slice(0, 120);
// // };

// // const downloadFile = (filename, content, mime = 'text/plain') => {
// //   const blob = new Blob([content], { type: mime });
// //   const url = URL.createObjectURL(blob);
// //   const a = document.createElement('a');
// //   a.href = url;
// //   a.download = filename;
// //   document.body.appendChild(a);
// //   a.click();
// //   a.remove();
// //   URL.revokeObjectURL(url);
// // };

// // const ResultsPage = () => {
// //   const query = useQuery();
// //   const navigate = useNavigate();
// //   const q = query.get("q") || "";
// //   const type = query.get("type") || "publications";
// //   const [searchInput, setSearchInput] = useState(q);
// //   const [suggestions, setSuggestions] = useState([]);
// //   const [showSuggestions, setShowSuggestions] = useState(false);
// //   const [suggestionsLoading, setSuggestionsLoading] = useState(false);
// //   const [selectedFields, setSelectedFields] = useState([]);
// //   const [sortBy, setSortBy] = useState("relevance");
// //   const [dateRange, setDateRange] = useState([1931, 2026]);
// //   const [openFields, setOpenFields] = useState(false);
// //   const [openDate, setOpenDate] = useState(false);
// //   const [results, setResults] = useState([]);
// //   const [resultsLoading, setResultsLoading] = useState(false);
// //   const [resultsError, setResultsError] = useState(null);
// //   const [totalResults, setTotalResults] = useState(0);
  
// //   // Pagination state
// //   const [currentPage, setCurrentPage] = useState(1);
// //   const papersPerPage = 7;

// //   // Citation modal state - UPDATED TO MATCH PAPERDETAILS
// //   const [citeOpen, setCiteOpen] = useState(false);
// //   const [citeItem, setCiteItem] = useState(null);
// //   const [citeFormats, setCiteFormats] = useState([]);
// //   const [citeFormat, setCiteFormat] = useState('bibtex');
// //   const [copied, setCopied] = useState(false);
// //   const [citeLoading, setCiteLoading] = useState(false);

// //   // Save modal state
// //   const [saveOpen, setSaveOpen] = useState(false);
// //   const [saveItem, setSaveItem] = useState(null);
// //   const [selectedLibraries, setSelectedLibraries] = useState([]);
// //   const [userLibraries, setUserLibraries] = useState([]);
// //   const [librariesLoading, setLibrariesLoading] = useState(false);
// //   const [isAuthenticated, setIsAuthenticated] = useState(false);
// //   const [showNewLibraryModal, setShowNewLibraryModal] = useState(false);
// //   const [newLibraryName, setNewLibraryName] = useState('');
// //   const [creatingLibrary, setCreatingLibrary] = useState(false);

// //   const containerRef = useRef(null);
// //   const searchFormRef = useRef(null);

// //   // Sync searchInput with query param
// //   useEffect(() => {
// //     setSearchInput(q);
// //   }, [q]);

// //   // Keep dropdown and filters closed when clicking outside
// //   useEffect(() => {
// //     const onDocClick = (e) => {
// //       if (!containerRef.current) return;
// //       if (!containerRef.current.contains(e.target)) {
// //         setOpenFields(false);
// //         setOpenDate(false);
// //       }
// //     };
// //     document.addEventListener('mousedown', onDocClick);
// //     return () => document.removeEventListener('mousedown', onDocClick);
// //   }, []);
  
// //   useEffect(() => {
// //     if (!q) {
// //       setResults([]);
// //       setTotalResults(0);
// //       setCurrentPage(1);
// //       return;
// //     }

// //     const fetchResults = async () => {
// //       try {
// //         setResultsLoading(true);
// //         setResultsError(null);
// //         console.log(`Fetching results for: "${q}"`);
        
// //         const params = new URLSearchParams();
// //         params.append('query', q);
// //         params.append('limit', 100);
// //         params.append('offset', 0);
        
// //         if (sortBy === 'citations') {
// //           params.append('sortByCitations', 'true');
// //         }
        
// //         if (dateRange && dateRange.length === 2 && (dateRange[0] > 1931 || dateRange[1] < 2026)) {
// //           params.append('yearFrom', dateRange[0]);
// //           params.append('yearTo', dateRange[1]);
// //         }
        
// //         if (selectedFields.length > 0) {
// //           params.append('fieldsOfStudy', selectedFields.join(','));
// //         }
        
// //         const response = await fetch(
// //           `${API_ENDPOINTS.PAPER_SEARCH}?${params.toString()}`
// //         );
        
// //         if (response.ok) {
// //           const data = await response.json();
// //           console.log("Results loaded:", data);
          
// //           // Process the results to include fields of study
// //           const processedResults = (data.data || []).map(paper => ({
// //             ...paper,
// //             // Ensure fieldsOfStudy is always an array
// //             fieldsOfStudy: Array.isArray(paper.fieldsOfStudy) ? paper.fieldsOfStudy : 
// //                           paper.fields ? (Array.isArray(paper.fields) ? paper.fields : []) : []
// //           }));
          
// //           setResults(processedResults);
// //           setTotalResults(data.total || processedResults.length || 0);
// //           setCurrentPage(1);
// //         } else {
// //           setResultsError("Failed to load results");
// //           setResults([]);
// //           setTotalResults(0);
// //         }
// //       } catch (error) {
// //         console.error("Results fetch error:", error);
// //         setResultsError("Error loading results");
// //         setResults([]);
// //         setTotalResults(0);
// //       } finally {
// //         setResultsLoading(false);
// //       }
// //     };

// //     fetchResults();
// //   }, [q, sortBy, dateRange, selectedFields]);

// //   // Autocomplete handler with 1 second delay
// //   useEffect(() => {
// //     if (searchInput.trim().length < 2) {
// //       setSuggestions([]);
// //       setShowSuggestions(false);
// //       return;
// //     }

// //     const timer = setTimeout(async () => {
// //       try {
// //         setSuggestionsLoading(true);
// //         console.log(`Fetching autocomplete for: "${searchInput}"`);
// //         const response = await fetch(`${API_ENDPOINTS.AUTOCOMPLETE}?query=${encodeURIComponent(searchInput)}`);
        
// //         if (response.ok) {
// //           const data = await response.json();
// //           console.log("Autocomplete response:", data);
// //           setSuggestions(data.matches || []);
// //           setShowSuggestions(true);
// //         } else {
// //           console.error("Autocomplete response not ok:", response.status);
// //         }
// //       } catch (error) {
// //         console.error("Autocomplete error:", error);
// //       } finally {
// //         setSuggestionsLoading(false);
// //       }
// //     }, 1000);

// //     return () => clearTimeout(timer);
// //   }, [searchInput]);

// //   // Close dropdown when clicking outside search form
// //   useEffect(() => {
// //     const handleClickOutside = (e) => {
// //       if (searchFormRef.current && !searchFormRef.current.contains(e.target)) {
// //         setShowSuggestions(false);
// //       }
// //     };

// //     document.addEventListener("mousedown", handleClickOutside);
// //     return () => document.removeEventListener("mousedown", handleClickOutside);
// //   }, []);

// //   // Check authentication and fetch user libraries
// //   useEffect(() => {
// //     const checkAuthAndFetchLibraries = async () => {
// //       try {
// //         const token = localStorage.getItem('access_token');
// //         if (!token) {
// //           setIsAuthenticated(false);
// //           setUserLibraries([]);
// //           return;
// //         }

// //         setLibrariesLoading(true);
// //         const response = await fetch(API_ENDPOINTS.LIBRARIES, {
// //           method: 'GET',
// //           headers: {
// //             'Content-Type': 'application/json',
// //             'Authorization': `Bearer ${token}`
// //           }
// //         });

// //         if (response.ok) {
// //           const data = await response.json();
// //           console.log('User libraries fetched:', data);
// //           setIsAuthenticated(true);
// //           let libraries = [];
// //           if (data.my_libraries && Array.isArray(data.my_libraries)) {
// //             libraries = data.my_libraries.map(lib => ({ id: lib.id, name: lib.name, role: lib.role }));
// //           }
// //           if (data.shared_with_me && Array.isArray(data.shared_with_me)) {
// //             libraries = [...libraries, ...data.shared_with_me.map(lib => ({ id: lib.id, name: lib.name, role: lib.role }))];
// //           }
// //           setUserLibraries(libraries);
// //         } else if (response.status === 401) {
// //           setIsAuthenticated(false);
// //           setUserLibraries([]);
// //           localStorage.removeItem('access_token');
// //         } else {
// //           console.error('Failed to fetch libraries:', response.status);
// //           setUserLibraries([]);
// //         }
// //       } catch (error) {
// //         console.error('Error fetching libraries:', error);
// //         setUserLibraries([]);
// //       } finally {
// //         setLibrariesLoading(false);
// //       }
// //     };

// //     checkAuthAndFetchLibraries();
// //   }, []);

// //   const visible = useMemo(() => {
// //     let list = results.slice();
// //     if (sortBy === 'citations') {
// //       list.sort((a,b)=> (b.citationCount || 0) - (a.citationCount || 0));
// //     }
// //     return list;
// //   }, [results, sortBy]);

// //   // Extract available fields from results
// //   const availableFields = useMemo(() => {
// //     const fields = new Set();
// //     results.forEach(r => {
// //       if (r.fieldsOfStudy && Array.isArray(r.fieldsOfStudy)) {
// //         r.fieldsOfStudy.forEach(f => fields.add(f));
// //       }
// //     });
// //     return Array.from(fields).sort().slice(0, 10);
// //   }, [results]);

// //   const availableLibraries = isAuthenticated && userLibraries.length > 0 
// //     ? userLibraries 
// //     : [];

// //   // Pagination calculations
// //   const totalPages = Math.ceil(visible.length / papersPerPage);
// //   const startIndex = (currentPage - 1) * papersPerPage;
// //   const endIndex = startIndex + papersPerPage;
// //   const currentPapers = visible.slice(startIndex, endIndex);

// //   const onHeaderSearch = (e) => {
// //     e && e.preventDefault && e.preventDefault();
// //     setShowSuggestions(false);
    
// //     if (!searchInput.trim()) {
// //       return;
// //     }
    
// //     navigate(`/search?q=${encodeURIComponent(searchInput)}&type=${encodeURIComponent(type)}`);
// //   };

// //   const handleSuggestionClick = (suggestion) => {
// //     setSearchInput(suggestion.title);
// //     setShowSuggestions(false);
// //     if (suggestion.title.trim()) {
// //       navigate(`/search?q=${encodeURIComponent(suggestion.title)}&type=${encodeURIComponent(type)}`);
// //     }
// //   };

// //   // Pagination functions
// //   const goToPage = (page) => {
// //     setCurrentPage(page);
// //     window.scrollTo({ top: 200, behavior: 'smooth' });
// //   };

// //   const goToNextPage = () => {
// //     if (currentPage < totalPages) {
// //       goToPage(currentPage + 1);
// //     }
// //   };

// //   const goToPrevPage = () => {
// //     if (currentPage > 1) {
// //       goToPage(currentPage - 1);
// //     }
// //   };

// //   // UPDATED: Citation modal functions - MATCHING PAPERDETAILS.JSX
// //   const openCite = async (item) => {
// //     if (!item || !item.paperId) return;
    
// //     setCiteLoading(true);
// //     setCiteFormats([]);
// //     setCiteOpen(true);
// //     setCopied(false);
// //     setCiteItem(item);
    
// //     try {
// //       console.log(`Fetching citations for paper: ${item.paperId}`);
// //       const response = await fetch(`http://localhost:5000/api/citations/${item.paperId}`);
      
// //       if (response.ok) {
// //         const data = await response.json();
// //         console.log("Citations fetched:", data);
// //         setCiteFormats(data.data || []);
        
// //         // Set default format to first available or bibtex
// //         if (data.data && data.data.length > 0) {
// //           setCiteFormat(data.data[0].id || 'bibtex');
// //         } else {
// //           setCiteFormat('bibtex');
// //         }
// //       } else {
// //         console.error("Failed to fetch citations");
// //         setCiteFormats([]);
// //         setCiteFormat('bibtex');
// //       }
// //     } catch (error) {
// //       console.error("Citation fetch error:", error);
// //       setCiteFormats([]);
// //       setCiteFormat('bibtex');
// //     } finally {
// //       setCiteLoading(false);
// //     }
// //   };

// //   const closeCite = () => {
// //     setCiteOpen(false);
// //     setCiteItem(null);
// //     setCiteFormats([]);
// //     setCopied(false);
// //   };

// //   const copyCitation = async () => {
// //     let txt = '';
    
// //     // Try to get citation from backend format
// //     if (citeFormats && citeFormats.length > 0) {
// //       const selectedFormat = citeFormats.find(f => f.id === citeFormat);
// //       if (selectedFormat) {
// //         // For BibTeX, use plain text. For HTML formats, extract text content
// //         if (selectedFormat.id === 'bibtex') {
// //           txt = selectedFormat.value || '';
// //         } else {
// //           // Create a temporary div to extract text from HTML
// //           const tempDiv = document.createElement('div');
// //           tempDiv.innerHTML = selectedFormat.value || '';
// //           txt = tempDiv.textContent || tempDiv.innerText || '';
// //         }
// //       }
// //     }
    
// //     // Fallback to local generation if not available
// //     if (!txt && citeItem) {
// //       // Fallback citation generation (same as PaperDetails)
// //       const authors = (citeItem.authors || []).map(a => typeof a === 'object' ? a.name || a : a || '').join(' and ');
// //       const year = citeItem.year || 'n.d.';

// //       if (citeFormat === 'BibTeX' || citeFormat === 'bibtex') {
// //         const authorName = citeItem.authors && citeItem.authors[0] ? 
// //           (typeof citeItem.authors[0] === 'object' ? citeItem.authors[0].name : citeItem.authors[0]) : 
// //           'author';
// //         const key = `${authorName.replace(/\s+/g,'')}${year}`;
// //         return `@inproceedings{${key},\n  title={${citeItem.title}},\n  author={${authors}},\n  booktitle=${citeItem.venue || 'Unknown'},\n  year={${year}},\n}`;
// //       }

// //       if (citeFormat === 'MLA') {
// //         return `${authors}. "${citeItem.title}." ${citeItem.venue || 'Unknown'}, ${year}.`;
// //       }

// //       if (citeFormat === 'APA') {
// //         return `${authors} (${year}). ${citeItem.title}. ${citeItem.venue || 'Unknown'}.`;
// //       }

// //       if (citeFormat === 'IEEE') {
// //         return `[1] ${authors}, "${citeItem.title}", ${citeItem.venue || 'Unknown'}, ${year}.`;
// //       }
// //     }
    
// //     try {
// //       await navigator.clipboard.writeText(txt);
// //       setCopied(true);
// //       setTimeout(() => setCopied(false), 1600);
// //     } catch (e) {
// //       const el = document.getElementById(citeFormat === 'bibtex' ? 'cite-textarea' : 'cite-html');
// //       if (el) {
// //         // For textarea, use select(). For div, create range
// //         if (citeFormat === 'bibtex') {
// //           el.select();
// //         } else {
// //           const range = document.createRange();
// //           range.selectNodeContents(el);
// //           const selection = window.getSelection();
// //           selection.removeAllRanges();
// //           selection.addRange(range);
// //         }
// //         try { document.execCommand('copy'); setCopied(true); setTimeout(()=>setCopied(false),1600); } catch(_){}
// //       }
// //     }
// //   };

// //   const downloadBibTeX = () => {
// //     let content = '';
    
// //     // Try to get BibTeX from backend format
// //     if (citeFormats && citeFormats.length > 0) {
// //       const bibTexFormat = citeFormats.find(f => f.id === 'bibtex');
// //       if (bibTexFormat) {
// //         content = bibTexFormat.value || '';
// //       }
// //     }
    
// //     // Fallback to local generation if not available
// //     if (!content && citeItem) {
// //       // Fallback BibTeX generation
// //       const authors = (citeItem.authors || []).map(a => typeof a === 'object' ? a.name || a : a || '').join(' and ');
// //       const year = citeItem.year || 'n.d.';
// //       const authorName = citeItem.authors && citeItem.authors[0] ? 
// //         (typeof citeItem.authors[0] === 'object' ? citeItem.authors[0].name : citeItem.authors[0]) : 
// //         'author';
// //       const key = `${authorName.replace(/\s+/g,'')}${year}`;
// //       content = `@inproceedings{${key},\n  title={${citeItem.title}},\n  author={${authors}},\n  booktitle=${citeItem.venue || 'Unknown'},\n  year={${year}},\n}`;
// //     }
    
// //     const name = sanitizeFilename((citeItem && citeItem.title) || 'paper') + '.bib';
// //     downloadFile(name, content, 'application/x-bibtex');
// //   };

// //   // Save modal functions - USING CITATIONSPAGE APPROACH
// //   const openSave = (item) => {
// //     if (!isAuthenticated) {
// //       alert('Please log in to save papers to libraries');
// //       navigate('/login');
// //       return;
// //     }
// //     setSaveItem(item);
// //     setSelectedLibraries([]);
// //     setSaveOpen(true);
// //   };

// //   const closeSave = () => {
// //     setSaveOpen(false);
// //     setSaveItem(null);
// //     setSelectedLibraries([]);
// //   };

// //   // SAVE PAPER TO LIBRARIES - USING CITATIONSPAGE APPROACH
// //   const handleSaveToLibraries = async () => {
// //     if (selectedLibraries.length === 0) {
// //       alert('Please select at least one library');
// //       return;
// //     }

// //     try {
// //       const token = localStorage.getItem('access_token');
// //       if (!token) {
// //         alert('Please log in to save papers');
// //         navigate('/login');
// //         return;
// //       }

// //       // Get BibTeX for the paper - SAME AS CITATIONSPAGE
// //       const paperIdToFetch = saveItem.paperId || saveItem.id;
// //       let bibtexData = '';
      
// //       if (paperIdToFetch) {
// //         bibtexData = await fetchPaperBibtex(paperIdToFetch);
// //       }

// //       // Prepare paper data with BibTeX - SAME AS CITATIONSPAGE
// //       const paperData = {
// //         s2_paper_id: paperIdToFetch || '',
// //         title: saveItem.title || '',
// //         venue: Array.isArray(saveItem.venue) ? saveItem.venue[0] : saveItem.venue || '',
// //         published_year: saveItem.year || new Date().getFullYear(),
// //         citation_count: saveItem.citationCount || 0,
// //         fields_of_study: saveItem.fieldsOfStudy || [],
// //         abstract: saveItem.abstract || '',
// //         bibtex: bibtexData || '', // Include BibTeX here
// //         authors: (saveItem.authors || []).map(a => { 
// //           if (typeof a === 'object') {
// //             return { 
// //               name: a.name || '',
// //               affiliation: a.affiliation || ''
// //             };
// //           }
// //           return { name: a || '', affiliation: '' };
// //         }),
// //         reading_status: 'unread',
// //         user_note: ''
// //       };

// //       console.log("Saving paper with data:", {
// //         ...paperData,
// //         bibtex_length: (bibtexData || '').length,
// //         has_bibtex: !!(bibtexData && bibtexData.trim())
// //       });

// //       // Save to each selected library
// //       let savedCount = 0;
// //       let failedCount = 0;
// //       const failedLibraries = [];

// //       for (const library of selectedLibraries) {
// //         try {
// //           const response = await fetch(`${API_ENDPOINTS.LIBRARIES}/${library.id}/papers`, {
// //             method: 'POST',
// //             headers: {
// //               'Content-Type': 'application/json',
// //               'Authorization': `Bearer ${token}`
// //             },
// //             body: JSON.stringify(paperData)
// //           });

// //           if (response.ok) {
// //             savedCount++;
// //             const result = await response.json();
// //             console.log(`Paper saved to library ${library.name}:`, result);
// //           } else {
// //             const errorData = await response.json();
// //             console.error(`Failed to save to library ${library.name}:`, errorData);
// //             failedLibraries.push(`${library.name}: ${errorData.message || 'Unknown error'}`);
// //             failedCount++;
// //           }
// //         } catch (error) {
// //           console.error(`Error saving to library ${library.name}:`, error);
// //           failedLibraries.push(`${library.name}: ${error.message}`);
// //           failedCount++;
// //         }
// //       }

// //       if (savedCount > 0) {
// //         alert(`Paper saved to ${savedCount} librar${savedCount === 1 ? 'y' : 'ies'}!${failedCount > 0 ? `\n\nFailed to save to ${failedCount} librar${failedCount === 1 ? 'y' : 'ies'}:\n${failedLibraries.join('\n')}` : ''}`);
// //         closeSave();
// //       } else {
// //         alert(`Failed to save paper:\n${failedLibraries.join('\n')}`);
// //       }
// //     } catch (error) {
// //       console.error('Error saving paper:', error);
// //       alert('Error saving paper: ' + error.message);
// //     }
// //   };

// //   const handleCreateLibrary = async () => {
// //     if (!newLibraryName.trim()) return;
    
// //     try {
// //       setCreatingLibrary(true);
// //       const token = localStorage.getItem('access_token');
// //       if (!token) {
// //         alert('Please log in to create a library');
// //         return;
// //       }
      
// //       const response = await fetch(`${API_ENDPOINTS.LIBRARIES}`, {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //           'Authorization': `Bearer ${token}`
// //         },
// //         body: JSON.stringify({ name: newLibraryName.trim() })
// //       });
      
// //       if (response.ok) {
// //         const data = await response.json();
// //         const newLibrary = data.library;
// //         setUserLibraries([...userLibraries, { id: newLibrary.id, name: newLibrary.name, role: 'creator' }]);
// //         setNewLibraryName('');
// //         setShowNewLibraryModal(false);
// //       } else {
// //         let errorMsg = 'Failed to create library';
// //         try {
// //           const errorData = await response.json();
// //           errorMsg = errorData.message || errorMsg;
// //         } catch (e) {
// //           errorMsg = `${response.status} ${response.statusText}`;
// //         }
// //         console.error('Error creating library:', errorMsg);
// //         alert('Failed to create library: ' + errorMsg);
// //       }
// //     } catch (error) {
// //       console.error('Error creating library:', error);
// //       alert('Error creating library: ' + error.message);
// //     } finally {
// //       setCreatingLibrary(false);
// //     }
// //   };

// //   const toggleLibrarySelection = (library) => {
// //     setSelectedLibraries(prev => {
// //       const libraryId = library.id;
// //       const isSelected = prev.some(l => l.id === libraryId);
// //       if (isSelected) {
// //         return prev.filter(l => l.id !== libraryId);
// //       } else {
// //         return [...prev, library];
// //       }
// //     });
// //   };

// //   // Generate page numbers for pagination display
// //   const getPageNumbers = () => {
// //     const pageNumbers = [];
// //     const maxVisiblePages = 5;
    
// //     if (totalPages <= maxVisiblePages) {
// //       for (let i = 1; i <= totalPages; i++) {
// //         pageNumbers.push(i);
// //       }
// //     } else {
// //       if (currentPage <= 3) {
// //         for (let i = 1; i <= maxVisiblePages; i++) {
// //           pageNumbers.push(i);
// //         }
// //         if (totalPages > maxVisiblePages) {
// //           pageNumbers.push('...');
// //           pageNumbers.push(totalPages);
// //         }
// //       } else if (currentPage >= totalPages - 2) {
// //         pageNumbers.push(1);
// //         pageNumbers.push('...');
// //         for (let i = totalPages - 4; i <= totalPages; i++) {
// //           pageNumbers.push(i);
// //         }
// //       } else {
// //         pageNumbers.push(1);
// //         pageNumbers.push('...');
// //         for (let i = currentPage - 1; i <= currentPage + 1; i++) {
// //           pageNumbers.push(i);
// //         }
// //         pageNumbers.push('...');
// //         pageNumbers.push(totalPages);
// //       }
// //     }
    
// //     return pageNumbers;
// //   };

// //   return (
// //     <>
// //       <Navbar />

// //       <div style={{ paddingTop: 100, paddingLeft: 40, paddingRight: 40 }}>
// //         <div ref={searchFormRef} style={{ position: "relative", maxWidth: 920, marginBottom: 18 }}>
// //           <form onSubmit={onHeaderSearch} style={{ display: "flex" }}>
// //             <input
// //               type="text"
// //               value={searchInput}
// //               onChange={(e) => setSearchInput(e.target.value)}
// //               onFocus={() => searchInput.trim().length >= 2 && setShowSuggestions(true)}
// //               placeholder="Search for articles..."
// //               style={{ 
// //                 flex: 1, 
// //                 padding: "10px 12px", 
// //                 border: "1px solid #ddd", 
// //                 borderRadius: "4px 0 0 4px" 
// //               }}
// //             />
// //             <button 
// //               type="submit"
// //               style={{ 
// //                 marginLeft: 0, 
// //                 padding: "8px 14px", 
// //                 background: "#3E513E", 
// //                 color: "#fff", 
// //                 border: "1px solid #3E513E", 
// //                 cursor: "pointer", 
// //                 borderRadius: "0 4px 4px 0" 
// //               }}
// //             >
// //               Search
// //             </button>
// //           </form>

// //           {/* Autocomplete Dropdown */}
// //           {showSuggestions && suggestions.length > 0 && (
// //             <div
// //               style={{
// //                 position: "absolute",
// //                 top: "100%",
// //                 left: 0,
// //                 right: 72,
// //                 backgroundColor: "#fff",
// //                 border: "1px solid #ddd",
// //                 borderTop: "none",
// //                 borderRadius: "0 0 4px 4px",
// //                 maxHeight: "300px",
// //                 overflowY: "auto",
// //                 zIndex: 1000,
// //                 boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
// //               }}
// //             >
// //               {suggestions.map((suggestion, idx) => (
// //                 <div
// //                   key={idx}
// //                   onClick={() => handleSuggestionClick(suggestion)}
// //                   style={{
// //                     padding: "12px 12px",
// //                     cursor: "pointer",
// //                     borderBottom: idx < suggestions.length - 1 ? "1px solid #f0f0f0" : "none",
// //                     transition: "background-color 0.2s",
// //                     fontSize: 13,
// //                     color: "#333"
// //                   }}
// //                   onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
// //                   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
// //                 >
// //                   <div style={{ fontWeight: 500 }}>{suggestion.title}</div>
// //                   {suggestion.authorsYear && (
// //                     <div style={{ fontSize: 11, color: "#888" }}>{suggestion.authorsYear}</div>
// //                   )}
// //                 </div>
// //               ))}
// //             </div>
// //           )}

// //           {/* Loading indicator */}
// //           {suggestionsLoading && searchInput.trim().length >= 2 && (
// //             <div
// //               style={{
// //                 position: "absolute",
// //                 top: "100%",
// //                 left: 0,
// //                 right: 72,
// //                 padding: "12px 12px",
// //                 backgroundColor: "#fff",
// //                 border: "1px solid #ddd",
// //                 borderTop: "none",
// //                 borderRadius: "0 0 4px 4px",
// //                 fontSize: 13,
// //                 color: "#666",
// //                 zIndex: 1000
// //               }}
// //             >
// //               Loading suggestions...
// //             </div>
// //           )}
// //         </div>

// //         {/* Updated header message */}
// //         <h3 style={{ marginTop: 8, marginBottom: 12, fontSize: 16, fontWeight: 500, color: '#333' }}>
// //           {resultsLoading ? 'Loading results...' : 
// //            q ? 
// //              (totalResults > 0 ? 
// //                `About ${totalResults.toLocaleString()} results for "${q}"` : 
// //                `No results found for "${q}"`) : 
// //              'Enter a search query'}
// //         </h3>

// //         {resultsError && (
// //           <div style={{ color: '#d32f2f', marginBottom: 20 }}>
// //             {resultsError}
// //           </div>
// //         )}

// //         {/* Only show filters and results if we have data */}
// //         {!resultsLoading && totalResults > 0 && (
// //           <>
// //             <div ref={containerRef} style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center", flexWrap: 'wrap' }}>
// //               <div style={{ position: 'relative' }}>
// //                 <button onClick={() => { setOpenFields(o=>!o); setOpenDate(false); }} style={{ padding: "8px 12px", border: "1px solid #e2e6ea", background: "#fff" }}>Fields of Study ▾</button>
// //                 {openFields && (
// //                   <div style={{ position: 'absolute', top: 40, left: 0, background: '#fff', border: '1px solid #ddd', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 12, width: 260, zIndex: 60 }}>
// //                     <strong style={{display:'block', marginBottom:8}}>Fields of Study</strong>
// //                     {availableFields.map((f) => (
// //                       <label key={f} style={{ display: 'block', marginBottom: 6 }}>
// //                         <input type="checkbox" checked={selectedFields.includes(f)} onChange={() => {
// //                           setSelectedFields((prev) => prev.includes(f) ? prev.filter(x=>x!==f) : [...prev, f]);
// //                         }} /> <span style={{marginLeft:8}}>{f}</span>
// //                       </label>
// //                     ))}
// //                   </div>
// //                 )}
// //               </div>

// //               <div style={{ position: 'relative' }}>
// //                 <button onClick={() => { setOpenDate(o=>!o); setOpenFields(false); }} style={{ padding: "8px 12px", border: "1px solid #e2e6ea", background: "#fff" }}>Date Range ▾</button>
// //                 {openDate && (
// //                   <div style={{ position: 'absolute', top: 40, left: 0, background: '#fff', border: '1px solid #ddd', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 16, width: 360, zIndex:50, overflow: 'hidden', boxSizing: 'border-box' }}>
// //                     <div style={{ position: 'relative', padding: '6px 0' }}>
// //                       <input
// //                         type="range"
// //                         min={1931}
// //                         max={2026}
// //                         value={dateRange[0]}
// //                         onChange={(e)=>{
// //                           const val = Number(e.target.value);
// //                           setDateRange([Math.min(val, dateRange[1]), dateRange[1]]);
// //                         }}
// //                         style={{ width: 'calc(100% - 48px)', marginLeft: 24, marginRight: 24, display: 'block' }}
// //                       />
// //                       <input
// //                         type="range"
// //                         min={1931}
// //                         max={2026}
// //                         value={dateRange[1]}
// //                         onChange={(e)=>{
// //                           const val = Number(e.target.value);
// //                           setDateRange([dateRange[0], Math.max(val, dateRange[0])]);
// //                         }}
// //                         style={{ width: 'calc(100% - 48px)', marginLeft: 24, marginRight: 24, marginTop: -36, display: 'block' }}
// //                       />
// //                     </div>
// //                     <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
// //                       <small>{dateRange[0]}</small>
// //                       <small>{dateRange[1]}</small>
// //                     </div>
// //                     <div style={{ display:'flex', gap:8, marginTop:12 }}>
// //                       <button onClick={()=>setDateRange([2026,2026])} style={{padding:'8px 12px', border:'1px solid #9b9b9b', background:'#f5f5f5'}}>This year</button>
// //                       <button onClick={()=>setDateRange([2021,2026])} style={{padding:'8px 12px', border:'1px solid #9b9b9b', background:'#f5f5f5'}}>Last 5 years</button>
// //                       <button onClick={()=>setDateRange([2016,2026])} style={{padding:'8px 12px', border:'1px solid #9b9b9b', background:'#f5f5f5'}}>Last 10 years</button>
// //                     </div>
// //                   </div>
// //                 )}
// //               </div>

// //               <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap:8 }}>
// //                 <label style={{ color:'#444', fontSize:13 }}>Sort by</label>
// //                 <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} style={{ padding:'6px 8px' }}>
// //                   <option value="relevance">Relevance</option>
// //                   <option value="citations">Citation count</option>
// //                 </select>
// //               </div>
// //             </div>

// //             <div>
// //               {currentPapers.map((r, i) => (
// //                 <div key={i} style={{ padding: "18px 0", borderBottom: "1px solid #eee" }}>
// //                   <button 
// //                     onClick={() => navigate(`/paper/${r.paperId}`)}
// //                     style={{ 
// //                       color: "#3E513E", 
// //                       fontSize: 20, 
// //                       fontWeight: 600, 
// //                       textDecoration: "none",
// //                       background: "transparent",
// //                       border: "none",
// //                       cursor: "pointer",
// //                       padding: 0,
// //                       textAlign: "left"
// //                     }}
// //                   >
// //                     {r.title}
// //                   </button>

// //                   <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
// //                     {/* 1. Authors first */}
// //                     {r.authors && r.authors.map((a, idx) => (
// //                       <span key={idx} style={{ background: "#f2f6f8", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}>
// //                         {typeof a === 'object' ? a.name || '' : a || ''}
// //                       </span>
// //                     ))}
                    
// //                     {/* 2. Fields of Study second */}
// //                     {r.fieldsOfStudy && r.fieldsOfStudy.length > 0 && (
// //                       <>
// //                         {r.fieldsOfStudy.slice(0, 3).map((field, idx) => (
// //                           <span 
// //                             key={idx} 
// //                             style={{ 
// //                               background: "#e8f4f8", 
// //                               padding: "4px 8px", 
// //                               borderRadius: 4, 
// //                               fontSize: 11,
// //                               color: "#2c5c6d",
// //                               fontWeight: 500
// //                             }}
// //                           >
// //                             {field}
// //                           </span>
// //                         ))}
// //                         {r.fieldsOfStudy.length > 3 && (
// //                           <span 
// //                             style={{ 
// //                               background: "#e8f4f8", 
// //                               padding: "4px 8px", 
// //                               borderRadius: 4, 
// //                               fontSize: 11,
// //                               color: "#2c5c6d",
// //                               fontWeight: 500
// //                             }}
// //                           >
// //                             +{r.fieldsOfStudy.length - 3} more
// //                           </span>
// //                         )}
// //                       </>
// //                     )}
                    
// //                     {/* 3. Venue third */}
// //                     {r.venue && (
// //                       <span style={{ color: "#888", fontSize: 13 }}>
// //                         {Array.isArray(r.venue) ? r.venue.join(", ") : r.venue}
// //                       </span>
// //                     )}
                    
// //                     {/* 4. Date fourth (with separator if venue exists) */}
// //                     {(r.year || r.date) && (
// //                       <span style={{ color: "#888", fontSize: 13 }}>
// //                         {r.venue ? ' · ' : ''}{r.year || r.date || 'n.d.'}
// //                       </span>
// //                     )}
// //                   </div>

// //                   {r.abstract && (
// //                     <p style={{ marginTop: 10, color: "#444" }}>
// //                       {r.abstract.length > 300 ? `${r.abstract.substring(0, 300)}...` : r.abstract} 
// //                       {r.abstract.length > 300 && <a href="#" style={{ color: "#3E513E" }}>Expand</a>}
// //                     </p>
// //                   )}

// //                   <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
// //                     {/* Citations Count with inverted commas icon */}
// //                     <span style={{ 
// //                       display: "inline-flex", 
// //                       alignItems: "center", 
// //                       gap: 6,
// //                       padding: "6px 10px",
// //                       background: "#f5f5f5",
// //                       border: "1px solid #e0e0e0",
// //                       borderRadius: 4,
// //                       fontSize: 12,
// //                       color: "#333",
// //                       fontWeight: 500
// //                     }}>
// //                       <img 
// //                         src={invertedCommasIcon} 
// //                         alt="Citations" 
// //                         style={{ width: 12, height: 12, opacity: 0.8 }}
// //                       />
// //                       {r.citationCount ? r.citationCount.toLocaleString() : 0}
// //                     </span>

// //                     {/* PDF Button */}
// //                     {r.openAccessPdf && r.openAccessPdf.url ? (
// //                       <a 
// //                         href={r.openAccessPdf.url}
// //                         target="_blank"
// //                         rel="noopener noreferrer"
// //                         style={{
// //                           display: "inline-flex",
// //                           alignItems: "center",
// //                           gap: 6,
// //                           padding: "6px 10px",
// //                           background: "#fff",
// //                           border: "1px solid #e0e0e0",
// //                           borderRadius: 4,
// //                           fontSize: 12,
// //                           color: "#333",
// //                           textDecoration: "none",
// //                           cursor: "pointer",
// //                           fontWeight: 500,
// //                           whiteSpace: "nowrap"
// //                         }}
// //                       >
// //                         [PDF]
// //                       </a>
// //                     ) : null}

// //                     {/* ArXiv Button - if available */}
// //                     {r.externalIds && r.externalIds.ArXiv ? (
// //                       <a 
// //                         href={`https://arxiv.org/abs/${r.externalIds.ArXiv}`}
// //                         target="_blank"
// //                         rel="noopener noreferrer"
// //                         style={{
// //                           display: "inline-flex",
// //                           alignItems: "center",
// //                           gap: 6,
// //                           padding: "6px 10px",
// //                           background: "#fff",
// //                           border: "1px solid #e0e0e0",
// //                           borderRadius: 4,
// //                           fontSize: 12,
// //                           color: "#333",
// //                           textDecoration: "none",
// //                           cursor: "pointer",
// //                           fontWeight: 500,
// //                           whiteSpace: "nowrap"
// //                         }}
// //                       >
// //                         arXiv
// //                       </a>
// //                     ) : null}

// //                     {/* Save Button with bookmark icon */}
// //                     <button 
// //                       onClick={() => openSave(r)} 
// //                       style={{
// //                         display: "inline-flex",
// //                         alignItems: "center",
// //                         gap: 6,
// //                         padding: "6px 10px",
// //                         background: "#fff",
// //                         border: "1px solid #e0e0e0",
// //                         borderRadius: 4,
// //                         fontSize: 12,
// //                         color: "#333",
// //                         cursor: "pointer",
// //                         fontWeight: 500,
// //                         whiteSpace: "nowrap"
// //                       }}
// //                     >
// //                       <img 
// //                         src={bookmarkIcon} 
// //                         alt="Save" 
// //                         style={{ width: 12, height: 12 }}
// //                       />
// //                       Save
// //                     </button>

// //                     {/* Cite Button with inverted commas icon */}
// //                     <button 
// //                       onClick={() => openCite(r)} 
// //                       style={{
// //                         display: "inline-flex",
// //                         alignItems: "center",
// //                         gap: 6,
// //                         padding: "6px 10px",
// //                         background: "#fff",
// //                         border: "1px solid #e0e0e0",
// //                         borderRadius: 4,
// //                         fontSize: 12,
// //                         color: "#333",
// //                         cursor: "pointer",
// //                         fontWeight: 500,
// //                         whiteSpace: "nowrap"
// //                       }}
// //                     >
// //                       <img 
// //                         src={invertedCommasIcon} 
// //                         alt="Cite" 
// //                         style={{ width: 12, height: 12 }}
// //                       />
// //                       Cite
// //                     </button>
// //                   </div>
// //                 </div>
// //               ))}
// //             </div>

// //             {/* Pagination - only show if we have more than 7 results */}
// //             {visible.length > papersPerPage && (
// //               <div style={{ marginTop: 40, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
// //                 {/* Previous button */}
// //                 <button 
// //                   onClick={goToPrevPage}
// //                   disabled={currentPage === 1}
// //                   style={{ 
// //                     padding: "8px 12px", 
// //                     fontSize: 14,
// //                     background: currentPage === 1 ? "#f5f5f5" : "#3E513E", 
// //                     color: currentPage === 1 ? "#999" : "#fff", 
// //                     border: "none",
// //                     borderRadius: 4,
// //                     cursor: currentPage === 1 ? "not-allowed" : "pointer",
// //                     fontWeight: 500
// //                   }}
// //                 >
// //                   ← Previous
// //                 </button>

// //                 {/* Page numbers */}
// //                 {getPageNumbers().map((pageNum, index) => (
// //                   pageNum === '...' ? (
// //                     <span key={`ellipsis-${index}`} style={{ padding: "8px", color: "#666" }}>
// //                       ...
// //                     </span>
// //                   ) : (
// //                     <button
// //                       key={pageNum}
// //                       onClick={() => goToPage(pageNum)}
// //                       style={{
// //                         padding: "8px 12px",
// //                         fontSize: 14,
// //                         background: currentPage === pageNum ? "#3E513E" : "#f5f5f5",
// //                         color: currentPage === pageNum ? "#fff" : "#333",
// //                         border: "none",
// //                         borderRadius: 4,
// //                         cursor: "pointer",
// //                         fontWeight: currentPage === pageNum ? 600 : 500,
// //                         minWidth: "40px"
// //                       }}
// //                     >
// //                       {pageNum}
// //                     </button>
// //                   )
// //                 ))}

// //                 {/* Next button */}
// //                 <button 
// //                   onClick={goToNextPage}
// //                   disabled={currentPage === totalPages}
// //                   style={{ 
// //                     padding: "8px 12px", 
// //                     fontSize: 14,
// //                     background: currentPage === totalPages ? "#f5f5f5" : "#3E513E", 
// //                     color: currentPage === totalPages ? "#999" : "#fff", 
// //                     border: "none",
// //                     borderRadius: 4,
// //                     cursor: currentPage === totalPages ? "not-allowed" : "pointer",
// //                     fontWeight: 500
// //                   }}
// //                 >
// //                   Next →
// //                 </button>
// //               </div>
// //             )}

// //             {/* Show page info */}
// //             {visible.length > 0 && (
// //               <div style={{ marginTop: 20, textAlign: "center", color: "#666", fontSize: 14 }}>
// //                 Showing papers {startIndex + 1} to {Math.min(endIndex, visible.length)} of {visible.length} results
// //                 {visible.length !== totalResults && ` (filtered from ${totalResults} total)`}
// //               </div>
// //             )}
// //           </>
// //         )}
// //       </div>

// //       {/* Create New Library Modal */}
// //       {showNewLibraryModal && (
// //         <div style={{ 
// //           position: 'fixed', 
// //           top: 0, left: 0, right: 0, bottom: 0, 
// //           background: 'rgba(0,0,0,0.5)', 
// //           display: 'flex', alignItems: 'center', justifyContent: 'center', 
// //           zIndex: 3000 
// //         }}>
// //           <div style={{
// //             background: '#fff',
// //             borderRadius: 8,
// //             padding: '24px',
// //             width: '90%',
// //             maxWidth: '400px',
// //             boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
// //           }}>
// //             <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#333' }}>
// //               Create New Library
// //             </h3>
// //             <input
// //               type="text"
// //               value={newLibraryName}
// //               onChange={(e) => setNewLibraryName(e.target.value)}
// //               placeholder="Library name"
// //               autoFocus
// //               onKeyPress={(e) => e.key === 'Enter' && handleCreateLibrary()}
// //               style={{
// //                 width: '100%',
// //                 padding: '10px 12px',
// //                 border: '1px solid #ddd',
// //                 borderRadius: 4,
// //                 fontSize: 14,
// //                 marginBottom: '16px',
// //                 boxSizing: 'border-box',
// //                 outline: 'none'
// //               }}
// //             />
// //             <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
// //               <button
// //                 onClick={() => {
// //                   setShowNewLibraryModal(false);
// //                   setNewLibraryName('');
// //                 }}
// //                 style={{
// //                   padding: '8px 16px',
// //                   background: '#f0f0f0',
// //                   color: '#333',
// //                   border: '1px solid #ddd',
// //                   borderRadius: 4,
// //                   cursor: 'pointer',
// //                   fontSize: 12,
// //                   fontWeight: 500
// //                 }}
// //               >
// //                 Cancel
// //               </button>
// //               <button
// //                 onClick={handleCreateLibrary}
// //                 disabled={!newLibraryName.trim() || creatingLibrary}
// //                 style={{
// //                   padding: '8px 16px',
// //                   background: newLibraryName.trim() && !creatingLibrary ? '#3E513E' : '#ccc',
// //                   color: '#fff',
// //                   border: 'none',
// //                   borderRadius: 4,
// //                   cursor: newLibraryName.trim() && !creatingLibrary ? 'pointer' : 'not-allowed',
// //                   fontSize: 12,
// //                   fontWeight: 500
// //                 }}
// //               >
// //                 {creatingLibrary ? 'Creating...' : 'Create'}
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Save Modal - USING CITATIONSPAGE STYLE */}
// //       {saveOpen && saveItem && (
// //         <div style={{ 
// //           position: 'fixed', 
// //           top: 0, left: 0, right: 0, bottom: 0, 
// //           background: 'rgba(0,0,0,0.5)', 
// //           display: 'flex', alignItems: 'center', justifyContent: 'center', 
// //           zIndex: 2000 
// //         }}>
// //           <div 
// //             className="save-modal"
// //             style={{ 
// //               width: '500px',
// //               maxWidth: '90vw', 
// //               background: '#fff', 
// //               borderRadius: 8,
// //               boxShadow: '0 10px 40px rgba(0,0,0,0.2)', 
// //               overflow: 'hidden' 
// //             }}>
// //             {/* Header */}
// //             <div style={{ 
// //               display: 'flex', 
// //               justifyContent: 'space-between', 
// //               alignItems: 'center', 
// //               padding: '20px 24px', 
// //               borderBottom: '1px solid #e0e0e0' 
// //             }}>
// //               <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#333' }}>Save to Library</h2>
// //               <button 
// //                 onClick={closeSave} 
// //                 style={{ 
// //                   width: 40, 
// //                   height: 40, 
// //                   borderRadius: 20, 
// //                   background: '#3E513E', 
// //                   color: '#fff', 
// //                   border: 'none', 
// //                   cursor: 'pointer', 
// //                   fontSize: 20, 
// //                   display: 'flex', 
// //                   alignItems: 'center', 
// //                   justifyContent: 'center' 
// //                 }}
// //               >
// //                 ✕
// //               </button>
// //             </div>

// //             {/* Content */}
// //             <div style={{ padding: '24px' }}>
// //               {/* Paper info - smaller */}
// //               <div style={{ marginBottom: 20 }}>
// //                 <h3 style={{ 
// //                   margin: 0, 
// //                   fontSize: 15,
// //                   fontWeight: 600, 
// //                   color: '#333', 
// //                   marginBottom: 6,
// //                   lineHeight: 1.4 
// //                 }}>
// //                   {saveItem.title}
// //                 </h3>
// //                 <p style={{ 
// //                   margin: 0, 
// //                   fontSize: 12,
// //                   color: '#666',
// //                   lineHeight: 1.4 
// //                 }}>
// //                   {(saveItem.authors || []).slice(0, 2).map(a => typeof a === 'object' ? a.name : a).join(', ')} 
// //                   {(saveItem.authors || []).length > 2 ? '+ others' : ''} • 
// //                   {saveItem.venue ? (Array.isArray(saveItem.venue) ? saveItem.venue.join(", ") : saveItem.venue) : ''}
// //                   {saveItem.year || saveItem.date ? ' • ' + (saveItem.year || saveItem.date || 'n.d.') : ''}
// //                 </p>
// //                 {/* Add fields of study to save modal display */}
// //                 {saveItem.fieldsOfStudy && saveItem.fieldsOfStudy.length > 0 && (
// //                   <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
// //                     {saveItem.fieldsOfStudy.slice(0, 3).map((field, idx) => (
// //                       <span 
// //                         key={idx}
// //                         style={{ 
// //                           background: "#e8f4f8", 
// //                           padding: "2px 6px", 
// //                           borderRadius: 3, 
// //                           fontSize: 10,
// //                           color: "#2c5c6d"
// //                         }}
// //                       >
// //                         {field}
// //                       </span>
// //                     ))}
// //                     {saveItem.fieldsOfStudy.length > 3 && (
// //                       <span 
// //                         style={{ 
// //                           background: "#e8f4f8", 
// //                           padding: "2px 6px", 
// //                           borderRadius: 3, 
// //                           fontSize: 10,
// //                           color: "#2c5c6d"
// //                         }}
// //                       >
// //                         +{saveItem.fieldsOfStudy.length - 3} more
// //                       </span>
// //                     )}
// //                   </div>
// //                 )}
// //               </div>

// //               {/* Libraries list */}
// //               <div style={{ marginBottom: 20 }}>
// //                 <div style={{ 
// //                   display: 'flex',
// //                   justifyContent: 'space-between',
// //                   alignItems: 'center',
// //                   marginBottom: 10
// //                 }}>
// //                   <div style={{ 
// //                     fontSize: 13,
// //                     fontWeight: 600, 
// //                     color: '#444'
// //                   }}>
// //                     Select libraries to save to:
// //                   </div>
// //                   <button
// //                     onClick={() => setShowNewLibraryModal(true)}
// //                     style={{
// //                       fontSize: 12,
// //                       padding: '4px 8px',
// //                       background: '#f0f0f0',
// //                       color: '#333',
// //                       border: '1px solid #ddd',
// //                       borderRadius: 4,
// //                       cursor: 'pointer',
// //                       fontWeight: 500
// //                     }}
// //                   >
// //                     + New
// //                   </button>
// //                 </div>
                
// //                 {availableLibraries.length === 0 ? (
// //                   <div style={{
// //                     padding: '20px',
// //                     textAlign: 'center',
// //                     color: '#666',
// //                     background: '#f9f9f9',
// //                     borderRadius: 4,
// //                     border: '1px solid #e0e0e0'
// //                   }}>
// //                     <p style={{ margin: '0 0 10px 0', fontSize: 13 }}>
// //                       You haven't created any libraries yet.
// //                     </p>
// //                     <button
// //                       onClick={() => setShowNewLibraryModal(true)}
// //                       style={{
// //                         padding: '8px 16px',
// //                         background: '#3E513E',
// //                         color: '#fff',
// //                         border: 'none',
// //                         borderRadius: 4,
// //                         cursor: 'pointer',
// //                         fontSize: 12,
// //                         fontWeight: 500
// //                       }}
// //                     >
// //                       Create Library
// //                     </button>
// //                   </div>
// //                 ) : (
// //                   <div style={{ 
// //                     maxHeight: 200,
// //                     overflowY: 'auto', 
// //                     border: '1px solid #e0e0e0', 
// //                     borderRadius: 4 
// //                   }}>
// //                   {availableLibraries.map((library, index) => (
// //                     <label
// //                       key={library.id}
// //                       style={{
// //                         display: 'flex',
// //                         alignItems: 'center',
// //                         padding: '10px 14px',
// //                         borderBottom: index < availableLibraries.length - 1 ? '1px solid #f0f0f0' : 'none',
// //                         cursor: 'pointer',
// //                         backgroundColor: selectedLibraries.some(l => l.id === library.id) ? '#f0f7f0' : 'transparent',
// //                         transition: 'background-color 0.2s',
// //                       }}
// //                     >
// //                       <input
// //                         type="checkbox"
// //                         checked={selectedLibraries.some(l => l.id === library.id)}
// //                         onChange={() => toggleLibrarySelection(library)}
// //                         style={{ marginRight: 10 }}
// //                       />
// //                       <span style={{ fontSize: 13, color: '#333' }}>{library.name}</span>
// //                     </label>
// //                   ))}
// //                   </div>
// //                 )}
// //               </div>

// //               {/* Divider */}
// //               <div style={{ height: '1px', background: '#e0e0e0', marginBottom: 16 }} />

// //               {/* Action buttons */}
// //               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// //                 {/* Selected count */}
// //                 <div style={{ fontSize: 12, color: '#666' }}>
// //                   {selectedLibraries.length} {selectedLibraries.length === 1 ? 'library' : 'libraries'} selected
// //                 </div>

// //                 {/* Save button */}
// //                 <button
// //                   onClick={handleSaveToLibraries}
// //                   disabled={selectedLibraries.length === 0}
// //                   style={{
// //                     padding: '8px 20px',
// //                     background: selectedLibraries.length === 0 ? '#cccccc' : '#3E513E',
// //                     color: '#fff',
// //                     border: 'none',
// //                     borderRadius: 4,
// //                     cursor: selectedLibraries.length === 0 ? 'not-allowed' : 'pointer',
// //                     fontSize: 13,
// //                     fontWeight: 500,
// //                     transition: 'background-color 0.2s',
// //                   }}
// //                 >
// //                   Save to {selectedLibraries.length > 0 ? `${selectedLibraries.length} ` : ''}Library{selectedLibraries.length !== 1 ? 'ies' : ''}
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* UPDATED: Citation Modal - EXACTLY LIKE PAPERDETAILS.JSX */}
// //       {citeOpen && (
// //         <div style={{ 
// //           position: 'fixed', 
// //           top: 0, left: 0, right: 0, bottom: 0, 
// //           background: 'rgba(0,0,0,0.5)', 
// //           display: 'flex', alignItems: 'center', justifyContent: 'center', 
// //           zIndex: 2000 
// //         }}>
// //           <div 
// //             className="cite-modal"
// //             style={{ 
// //               width: '580px', 
// //               maxWidth: '90vw', 
// //               background: '#fff', 
// //               borderRadius: 8, 
// //               boxShadow: '0 10px 40px rgba(0,0,0,0.2)', 
// //               overflow: 'hidden' 
// //             }}>
// //             {/* Header */}
// //             <div style={{ 
// //               display: 'flex', 
// //               justifyContent: 'space-between', 
// //               alignItems: 'center', 
// //               padding: '20px 24px', 
// //               borderBottom: '1px solid #e0e0e0' 
// //             }}>
// //               <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#333' }}>Cite Paper</h2>
// //               <button 
// //                 onClick={closeCite} 
// //                 style={{ 
// //                   width: 40, 
// //                   height: 40, 
// //                   borderRadius: 20, 
// //                   background: '#3E513E', 
// //                   color: '#fff', 
// //                   border: 'none', 
// //                   cursor: 'pointer', 
// //                   fontSize: 20, 
// //                   display: 'flex', 
// //                   alignItems: 'center', 
// //                   justifyContent: 'center' 
// //                 }}
// //               >
// //                 ✕
// //               </button>
// //             </div>

// //             {/* Content */}
// //             <div style={{ padding: '24px' }}>
// //               {citeLoading && (
// //                 <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
// //                   Loading citation formats...
// //                 </div>
// //               )}
              
// //               {!citeLoading && citeFormats.length > 0 && (
// //                 <>
// //                   {/* Format tabs */}
// //                   <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e0e0e0', marginBottom: 20, overflowX: 'auto' }}>
// //                     {citeFormats.map(fmt => (
// //                       <button
// //                         key={fmt.id}
// //                         onClick={() => setCiteFormat(fmt.id)}
// //                         style={{
// //                           padding: '12px 16px',
// //                           background: 'transparent',
// //                           border: 'none',
// //                           borderBottom: citeFormat === fmt.id ? '3px solid #3E513E' : '3px solid transparent',
// //                           cursor: 'pointer',
// //                           fontSize: 14,
// //                           fontWeight: citeFormat === fmt.id ? 600 : 500,
// //                           color: citeFormat === fmt.id ? '#3E513E' : '#666',
// //                           whiteSpace: 'nowrap'
// //                         }}
// //                       >
// //                         {fmt.label}
// //                       </button>
// //                     ))}
// //                   </div>

// //                   {/* Citation display area */}
// //                   <div style={{ marginBottom: 20 }}>
// //                     {citeFormat === 'bibtex' ? (
// //                       <textarea
// //                         id="cite-textarea"
// //                         readOnly
// //                         value={(() => {
// //                           const selected = citeFormats.find(f => f.id === citeFormat);
// //                           return selected ? selected.value : '';
// //                         })()}
// //                         style={{
// //                           width: '100%',
// //                           height: 200,
// //                           padding: 12,
// //                           fontFamily: 'monospace',
// //                           fontSize: 12,
// //                           border: '1px solid #d0d0d0',
// //                           borderRadius: 4,
// //                           resize: 'none',
// //                           background: '#fafafa'
// //                         }}
// //                       />
// //                     ) : (
// //                       <div
// //                         id="cite-html"
// //                         style={{
// //                           width: '100%',
// //                           height: 200,
// //                           padding: 12,
// //                           fontSize: 12,
// //                           border: '1px solid #d0d0d0',
// //                           borderRadius: 4,
// //                           background: '#fafafa',
// //                           overflowY: 'auto'
// //                         }}
// //                         dangerouslySetInnerHTML={{
// //                           __html: (() => {
// //                             const selected = citeFormats.find(f => f.id === citeFormat);
// //                             return selected ? selected.value : '';
// //                           })()
// //                         }}
// //                       />
// //                     )}
// //                   </div>

// //                   {/* Divider */}
// //                   <div style={{ height: '1px', background: '#e0e0e0', marginBottom: 20 }} />

// //                   {/* Copy and Export */}
// //                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// //                     {/* Export / BibTeX on the left */}
// //                     <div>
// //                       <div style={{ fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 8 }}>Export</div>
// //                       <div style={{ display: 'flex', gap: 8 }}>
// //                         <button
// //                           onClick={downloadBibTeX}
// //                           style={{
// //                             padding: '8px 16px',
// //                             background: '#3E513E',
// //                             color: '#fff',
// //                             border: 'none',
// //                             borderRadius: 4,
// //                             cursor: 'pointer',
// //                             fontSize: 13,
// //                             fontWeight: 500
// //                           }}
// //                         >
// //                           BibTeX
// //                         </button>
// //                       </div>
// //                     </div>

// //                     {/* Copy button on the right */}
// //                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
// //                       <button
// //                         onClick={copyCitation}
// //                         style={{
// //                           display: 'inline-flex',
// //                           alignItems: 'center',
// //                           gap: 6,
// //                           background: 'transparent',
// //                           border: 'none',
// //                           color: '#3E513E',
// //                           cursor: 'pointer',
// //                           fontSize: 13,
// //                           fontWeight: 500,
// //                         }}
// //                       >
// //                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
// //                           <path d="M16 1H4a2 2 0 00-2 2v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
// //                           <rect x="8" y="5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
// //                         </svg>
// //                         Copy
// //                       </button>
// //                       {copied && <span style={{ color: '#0b8043', fontWeight: 600, fontSize: 13 }}>Copied!</span>}
// //                     </div>
// //                   </div>
// //                 </>
// //               )}
              
// //               {!citeLoading && citeFormats.length === 0 && (
// //                 <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
// //                   No citation formats available
// //                 </div>
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </>
// //   );
// // };

// // export default ResultsPage;



// import React, { useMemo, useState, useRef, useEffect } from "react";
// import Navbar from "../components/Navbar";
// import { useLocation, useNavigate } from "react-router-dom";
// import { API_ENDPOINTS } from "../config/api";

// // Import the icons
// import bookmarkIcon from "../images/bookmark.png";
// import invertedCommasIcon from "../images/inverted-commas.png";

// function useQuery() {
//   return new URLSearchParams(useLocation().search);
// }

// // Global cache for citation data
// const citationCache = new Map();

// // Load cache from localStorage on initial load
// const loadCitationCacheFromStorage = () => {
//   try {
//     const stored = localStorage.getItem('citationCache');
//     if (stored) {
//       const parsed = JSON.parse(stored);
//       Object.entries(parsed).forEach(([key, value]) => {
//         citationCache.set(key, value);
//       });
//     }
//   } catch (error) {
//     console.warn('Failed to load citation cache from storage:', error);
//   }
// };

// // Save cache to localStorage
// const saveCitationCacheToStorage = () => {
//   try {
//     const cacheObj = Object.fromEntries(citationCache);
//     localStorage.setItem('citationCache', JSON.stringify(cacheObj));
//   } catch (error) {
//     console.warn('Failed to save citation cache to storage:', error);
//   }
// };

// // Helper function to fetch citations with caching
// const fetchPaperCitationsWithCache = async (paperId) => {
//   // Return from cache if available
//   if (citationCache.has(paperId)) {
//     console.log(`Using cached citations for paper: ${paperId}`);
//     return citationCache.get(paperId);
//   }

//   try {
//     console.log(`Fetching citations for paper: ${paperId}`);
//     const response = await fetch(`http://localhost:5000/api/citations/${paperId}`);
    
//     if (response.ok) {
//       const data = await response.json();
//       const citations = data.data || [];
//       citationCache.set(paperId, citations);
//       saveCitationCacheToStorage(); // Save to localStorage
//       return citations;
//     }
//   } catch (error) {
//     console.warn("Could not fetch citations:", error);
//   }
  
//   return [];
// };

// // Helper function to fetch BibTeX with caching
// const fetchPaperBibtexWithCache = async (paperId) => {
//   const citations = await fetchPaperCitationsWithCache(paperId);
//   const bibtexFormat = citations.find(f => f.id === 'bibtex');
//   return bibtexFormat ? bibtexFormat.value : '';
// };

// const sanitizeFilename = (s = '') => {
//   return s.replace(/[^a-z0-9\.\-\_]/gi, '-').slice(0, 120);
// };

// const downloadFile = (filename, content, mime = 'text/plain') => {
//   const blob = new Blob([content], { type: mime });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = filename;
//   document.body.appendChild(a);
//   a.click();
//   a.remove();
//   URL.revokeObjectURL(url);
// };

// const ResultsPage = () => {
//   const query = useQuery();
//   const navigate = useNavigate();
//   const q = query.get("q") || "";
//   const type = query.get("type") || "publications";
//   const [searchInput, setSearchInput] = useState(q);
//   const [suggestions, setSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const [suggestionsLoading, setSuggestionsLoading] = useState(false);
//   const [selectedFields, setSelectedFields] = useState([]);
//   const [sortBy, setSortBy] = useState("relevance");
//   const [dateRange, setDateRange] = useState([1931, 2026]);
//   const [openFields, setOpenFields] = useState(false);
//   const [openDate, setOpenDate] = useState(false);
//   const [results, setResults] = useState([]);
//   const [resultsLoading, setResultsLoading] = useState(false);
//   const [resultsError, setResultsError] = useState(null);
//   const [totalResults, setTotalResults] = useState(0);
  
//   // Pagination state
//   const [currentPage, setCurrentPage] = useState(1);
//   const papersPerPage = 7;

//   // Citation modal state
//   const [citeOpen, setCiteOpen] = useState(false);
//   const [citeItem, setCiteItem] = useState(null);
//   const [citeFormats, setCiteFormats] = useState([]);
//   const [citeFormat, setCiteFormat] = useState('bibtex');
//   const [copied, setCopied] = useState(false);
//   const [citeLoading, setCiteLoading] = useState(false);

//   // Save modal state
//   const [saveOpen, setSaveOpen] = useState(false);
//   const [saveItem, setSaveItem] = useState(null);
//   const [selectedLibraries, setSelectedLibraries] = useState([]);
//   const [userLibraries, setUserLibraries] = useState([]);
//   const [librariesLoading, setLibrariesLoading] = useState(false);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [showNewLibraryModal, setShowNewLibraryModal] = useState(false);
//   const [newLibraryName, setNewLibraryName] = useState('');
//   const [creatingLibrary, setCreatingLibrary] = useState(false);

//   // NEW: Track expanded abstracts for each paper
//   const [expandedAbstracts, setExpandedAbstracts] = useState({});

//   const containerRef = useRef(null);
//   const searchFormRef = useRef(null);

//   // Load citation cache from localStorage on mount
//   useEffect(() => {
//     loadCitationCacheFromStorage();
//   }, []);

//   // Sync searchInput with query param
//   useEffect(() => {
//     setSearchInput(q);
//   }, [q]);

//   // Keep dropdown and filters closed when clicking outside
//   useEffect(() => {
//     const onDocClick = (e) => {
//       if (!containerRef.current) return;
//       if (!containerRef.current.contains(e.target)) {
//         setOpenFields(false);
//         setOpenDate(false);
//       }
//     };
//     document.addEventListener('mousedown', onDocClick);
//     return () => document.removeEventListener('mousedown', onDocClick);
//   }, []);
  
//   useEffect(() => {
//     if (!q) {
//       setResults([]);
//       setTotalResults(0);
//       setCurrentPage(1);
//       // Reset expanded abstracts when results change
//       setExpandedAbstracts({});
//       return;
//     }

//     const fetchResults = async () => {
//       try {
//         setResultsLoading(true);
//         setResultsError(null);
//         console.log(`Fetching results for: "${q}"`);
        
//         const params = new URLSearchParams();
//         params.append('query', q);
//         params.append('limit', 100);
//         params.append('offset', 0);
        
//         if (sortBy === 'citations') {
//           params.append('sortByCitations', 'true');
//         }
        
//         if (dateRange && dateRange.length === 2 && (dateRange[0] > 1931 || dateRange[1] < 2026)) {
//           params.append('yearFrom', dateRange[0]);
//           params.append('yearTo', dateRange[1]);
//         }
        
//         if (selectedFields.length > 0) {
//           params.append('fieldsOfStudy', selectedFields.join(','));
//         }
        
//         const response = await fetch(
//           `${API_ENDPOINTS.PAPER_SEARCH}?${params.toString()}`
//         );
        
//         if (response.ok) {
//           const data = await response.json();
//           console.log("Results loaded:", data);
          
//           // Process the results to include fields of study
//           const processedResults = (data.data || []).map(paper => ({
//             ...paper,
//             // Ensure fieldsOfStudy is always an array
//             fieldsOfStudy: Array.isArray(paper.fieldsOfStudy) ? paper.fieldsOfStudy : 
//                           paper.fields ? (Array.isArray(paper.fields) ? paper.fields : []) : []
//           }));
          
//           setResults(processedResults);
//           setTotalResults(data.total || processedResults.length || 0);
//           setCurrentPage(1);
//           // Reset expanded abstracts when results change
//           setExpandedAbstracts({});
//         } else {
//           setResultsError("Failed to load results");
//           setResults([]);
//           setTotalResults(0);
//           setExpandedAbstracts({});
//         }
//       } catch (error) {
//         console.error("Results fetch error:", error);
//         setResultsError("Error loading results");
//         setResults([]);
//         setTotalResults(0);
//         setExpandedAbstracts({});
//       } finally {
//         setResultsLoading(false);
//       }
//     };

//     fetchResults();
//   }, [q, sortBy, dateRange, selectedFields]);

//   // Pre-fetch citations for first few results
//   useEffect(() => {
//     const preFetchCitations = async () => {
//       if (!results || results.length === 0) return;
      
//       // Pre-fetch citations for the first few papers
//       const papersToPrefetch = results.slice(0, 5);
//       papersToPrefetch.forEach(async (paper) => {
//         if (paper.paperId && !citationCache.has(paper.paperId)) {
//           try {
//             const response = await fetch(`http://localhost:5000/api/citations/${paper.paperId}`);
//             if (response.ok) {
//               const data = await response.json();
//               const citations = data.data || [];
//               citationCache.set(paper.paperId, citations);
//               saveCitationCacheToStorage();
//             }
//           } catch (error) {
//             console.warn(`Pre-fetch failed for paper ${paper.paperId}:`, error);
//           }
//         }
//       });
//     };

//     if (!resultsLoading && results.length > 0) {
//       preFetchCitations();
//     }
//   }, [results, resultsLoading]);

//   // Autocomplete handler with 1 second delay
//   useEffect(() => {
//     if (searchInput.trim().length < 2) {
//       setSuggestions([]);
//       setShowSuggestions(false);
//       return;
//     }

//     const timer = setTimeout(async () => {
//       try {
//         setSuggestionsLoading(true);
//         console.log(`Fetching autocomplete for: "${searchInput}"`);
//         const response = await fetch(`${API_ENDPOINTS.AUTOCOMPLETE}?query=${encodeURIComponent(searchInput)}`);
        
//         if (response.ok) {
//           const data = await response.json();
//           console.log("Autocomplete response:", data);
//           setSuggestions(data.matches || []);
//           setShowSuggestions(true);
//         } else {
//           console.error("Autocomplete response not ok:", response.status);
//         }
//       } catch (error) {
//         console.error("Autocomplete error:", error);
//       } finally {
//         setSuggestionsLoading(false);
//       }
//     }, 1000);

//     return () => clearTimeout(timer);
//   }, [searchInput]);

//   // Close dropdown when clicking outside search form
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (searchFormRef.current && !searchFormRef.current.contains(e.target)) {
//         setShowSuggestions(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Check authentication and fetch user libraries
//   useEffect(() => {
//     const checkAuthAndFetchLibraries = async () => {
//       try {
//         const token = localStorage.getItem('access_token');
//         if (!token) {
//           setIsAuthenticated(false);
//           setUserLibraries([]);
//           return;
//         }

//         setLibrariesLoading(true);
//         const response = await fetch(API_ENDPOINTS.LIBRARIES, {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         });

//         if (response.ok) {
//           const data = await response.json();
//           console.log('User libraries fetched:', data);
//           setIsAuthenticated(true);
//           let libraries = [];
//           if (data.my_libraries && Array.isArray(data.my_libraries)) {
//             libraries = data.my_libraries.map(lib => ({ id: lib.id, name: lib.name, role: lib.role }));
//           }
//           if (data.shared_with_me && Array.isArray(data.shared_with_me)) {
//             libraries = [...libraries, ...data.shared_with_me.map(lib => ({ id: lib.id, name: lib.name, role: lib.role }))];
//           }
//           setUserLibraries(libraries);
//         } else if (response.status === 401) {
//           setIsAuthenticated(false);
//           setUserLibraries([]);
//           localStorage.removeItem('access_token');
//         } else {
//           console.error('Failed to fetch libraries:', response.status);
//           setUserLibraries([]);
//         }
//       } catch (error) {
//         console.error('Error fetching libraries:', error);
//         setUserLibraries([]);
//       } finally {
//         setLibrariesLoading(false);
//       }
//     };

//     checkAuthAndFetchLibraries();
//   }, []);

//   const visible = useMemo(() => {
//     let list = results.slice();
//     if (sortBy === 'citations') {
//       list.sort((a,b)=> (b.citationCount || 0) - (a.citationCount || 0));
//     }
//     return list;
//   }, [results, sortBy]);

//   // Extract available fields from results
//   const availableFields = useMemo(() => {
//     const fields = new Set();
//     results.forEach(r => {
//       if (r.fieldsOfStudy && Array.isArray(r.fieldsOfStudy)) {
//         r.fieldsOfStudy.forEach(f => fields.add(f));
//       }
//     });
//     return Array.from(fields).sort().slice(0, 10);
//   }, [results]);

//   const availableLibraries = isAuthenticated && userLibraries.length > 0 
//     ? userLibraries 
//     : [];

//   // Pagination calculations
//   const totalPages = Math.ceil(visible.length / papersPerPage);
//   const startIndex = (currentPage - 1) * papersPerPage;
//   const endIndex = startIndex + papersPerPage;
//   const currentPapers = visible.slice(startIndex, endIndex);

//   const onHeaderSearch = (e) => {
//     e && e.preventDefault && e.preventDefault();
//     setShowSuggestions(false);
    
//     if (!searchInput.trim()) {
//       return;
//     }
    
//     navigate(`/search?q=${encodeURIComponent(searchInput)}&type=${encodeURIComponent(type)}`);
//   };

//   const handleSuggestionClick = (suggestion) => {
//     setSearchInput(suggestion.title);
//     setShowSuggestions(false);
//     if (suggestion.title.trim()) {
//       navigate(`/search?q=${encodeURIComponent(suggestion.title)}&type=${encodeURIComponent(type)}`);
//     }
//   };

//   // NEW: Toggle abstract expansion for a specific paper
//   const toggleAbstract = (paperId) => {
//     setExpandedAbstracts(prev => ({
//       ...prev,
//       [paperId]: !prev[paperId]
//     }));
//   };

//   // Pagination functions
//   const goToPage = (page) => {
//     setCurrentPage(page);
//     window.scrollTo({ top: 200, behavior: 'smooth' });
//   };

//   const goToNextPage = () => {
//     if (currentPage < totalPages) {
//       goToPage(currentPage + 1);
//     }
//   };

//   const goToPrevPage = () => {
//     if (currentPage > 1) {
//       goToPage(currentPage - 1);
//     }
//   };

//   // Citation modal functions with caching
//   const openCite = async (item) => {
//     if (!item || !item.paperId) return;
    
//     setCiteLoading(true);
//     setCiteFormats([]);
//     setCiteOpen(true);
//     setCopied(false);
//     setCiteItem(item);
    
//     try {
//       // Use cached citations
//       const citations = await fetchPaperCitationsWithCache(item.paperId);
//       console.log("Citations (cached/fetched):", citations);
//       setCiteFormats(citations);
      
//       // Set default format to first available or bibtex
//       if (citations && citations.length > 0) {
//         setCiteFormat(citations[0].id || 'bibtex');
//       } else {
//         setCiteFormat('bibtex');
//       }
//     } catch (error) {
//       console.error("Citation fetch error:", error);
//       setCiteFormats([]);
//       setCiteFormat('bibtex');
//     } finally {
//       setCiteLoading(false);
//     }
//   };

//   const closeCite = () => {
//     setCiteOpen(false);
//     setCiteItem(null);
//     setCiteFormats([]);
//     setCopied(false);
//   };

//   const copyCitation = async () => {
//     let txt = '';
    
//     // Try to get citation from cached format
//     if (citeFormats && citeFormats.length > 0) {
//       const selectedFormat = citeFormats.find(f => f.id === citeFormat);
//       if (selectedFormat) {
//         // For BibTeX, use plain text. For HTML formats, extract text content
//         if (selectedFormat.id === 'bibtex') {
//           txt = selectedFormat.value || '';
//         } else {
//           // Create a temporary div to extract text from HTML
//           const tempDiv = document.createElement('div');
//           tempDiv.innerHTML = selectedFormat.value || '';
//           txt = tempDiv.textContent || tempDiv.innerText || '';
//         }
//       }
//     }
    
//     // Fallback to local generation if not available
//     if (!txt && citeItem) {
//       const authors = (citeItem.authors || []).map(a => typeof a === 'object' ? a.name || a : a || '').join(' and ');
//       const year = citeItem.year || 'n.d.';

//       if (citeFormat === 'BibTeX' || citeFormat === 'bibtex') {
//         const authorName = citeItem.authors && citeItem.authors[0] ? 
//           (typeof citeItem.authors[0] === 'object' ? citeItem.authors[0].name : citeItem.authors[0]) : 
//           'author';
//         const key = `${authorName.replace(/\s+/g,'')}${year}`;
//         return `@inproceedings{${key},\n  title={${citeItem.title}},\n  author={${authors}},\n  booktitle=${citeItem.venue || 'Unknown'},\n  year={${year}},\n}`;
//       }

//       if (citeFormat === 'MLA') {
//         return `${authors}. "${citeItem.title}." ${citeItem.venue || 'Unknown'}, ${year}.`;
//       }

//       if (citeFormat === 'APA') {
//         return `${authors} (${year}). ${citeItem.title}. ${citeItem.venue || 'Unknown'}.`;
//       }

//       if (citeFormat === 'IEEE') {
//         return `[1] ${authors}, "${citeItem.title}", ${citeItem.venue || 'Unknown'}, ${year}.`;
//       }
//     }
    
//     try {
//       await navigator.clipboard.writeText(txt);
//       setCopied(true);
//       setTimeout(() => setCopied(false), 1600);
//     } catch (e) {
//       const el = document.getElementById(citeFormat === 'bibtex' ? 'cite-textarea' : 'cite-html');
//       if (el) {
//         // For textarea, use select(). For div, create range
//         if (citeFormat === 'bibtex') {
//           el.select();
//         } else {
//           const range = document.createRange();
//           range.selectNodeContents(el);
//           const selection = window.getSelection();
//           selection.removeAllRanges();
//           selection.addRange(range);
//         }
//         try { document.execCommand('copy'); setCopied(true); setTimeout(()=>setCopied(false),1600); } catch(_){}
//       }
//     }
//   };

//   const downloadBibTeX = () => {
//     let content = '';
    
//     // Try to get BibTeX from cached format
//     if (citeFormats && citeFormats.length > 0) {
//       const bibTexFormat = citeFormats.find(f => f.id === 'bibtex');
//       if (bibTexFormat) {
//         content = bibTexFormat.value || '';
//       }
//     }
    
//     // Fallback to local generation if not available
//     if (!content && citeItem) {
//       const authors = (citeItem.authors || []).map(a => typeof a === 'object' ? a.name || a : a || '').join(' and ');
//       const year = citeItem.year || 'n.d.';
//       const authorName = citeItem.authors && citeItem.authors[0] ? 
//         (typeof citeItem.authors[0] === 'object' ? citeItem.authors[0].name : citeItem.authors[0]) : 
//         'author';
//       const key = `${authorName.replace(/\s+/g,'')}${year}`;
//       content = `@inproceedings{${key},\n  title={${citeItem.title}},\n  author={${authors}},\n  booktitle=${citeItem.venue || 'Unknown'},\n  year={${year}},\n}`;
//     }
    
//     const name = sanitizeFilename((citeItem && citeItem.title) || 'paper') + '.bib';
//     downloadFile(name, content, 'application/x-bibtex');
//   };

//   // Save modal functions
//   const openSave = (item) => {
//     if (!isAuthenticated) {
//       alert('Please log in to save papers to libraries');
//       navigate('/login');
//       return;
//     }
//     setSaveItem(item);
//     setSelectedLibraries([]);
//     setSaveOpen(true);
//   };

//   const closeSave = () => {
//     setSaveOpen(false);
//     setSaveItem(null);
//     setSelectedLibraries([]);
//   };

//   // SAVE PAPER TO LIBRARIES
//   const handleSaveToLibraries = async () => {
//     if (selectedLibraries.length === 0) {
//       alert('Please select at least one library');
//       return;
//     }

//     try {
//       const token = localStorage.getItem('access_token');
//       if (!token) {
//         alert('Please log in to save papers');
//         navigate('/login');
//         return;
//       }

//       // Get BibTeX for the paper - USING CACHE
//       const paperIdToFetch = saveItem.paperId || saveItem.id;
//       let bibtexData = '';
      
//       if (paperIdToFetch) {
//         bibtexData = await fetchPaperBibtexWithCache(paperIdToFetch);
//       }

//       // Prepare paper data with BibTeX
//       const paperData = {
//         s2_paper_id: paperIdToFetch || '',
//         title: saveItem.title || '',
//         venue: Array.isArray(saveItem.venue) ? saveItem.venue[0] : saveItem.venue || '',
//         published_year: saveItem.year || new Date().getFullYear(),
//         citation_count: saveItem.citationCount || 0,
//         fields_of_study: saveItem.fieldsOfStudy || [],
//         abstract: saveItem.abstract || '',
//         bibtex: bibtexData || '',
//         authors: (saveItem.authors || []).map(a => { 
//           if (typeof a === 'object') {
//             return { 
//               name: a.name || '',
//               affiliation: a.affiliation || ''
//             };
//           }
//           return { name: a || '', affiliation: '' };
//         }),
//         reading_status: 'unread',
//         user_note: ''
//       };

//       console.log("Saving paper with data:", {
//         ...paperData,
//         bibtex_length: (bibtexData || '').length,
//         has_bibtex: !!(bibtexData && bibtexData.trim())
//       });

//       // Save to each selected library
//       let savedCount = 0;
//       let failedCount = 0;
//       const failedLibraries = [];

//       for (const library of selectedLibraries) {
//         try {
//           const response = await fetch(`${API_ENDPOINTS.LIBRARIES}/${library.id}/papers`, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify(paperData)
//           });

//           if (response.ok) {
//             savedCount++;
//             const result = await response.json();
//             console.log(`Paper saved to library ${library.name}:`, result);
//           } else {
//             const errorData = await response.json();
//             console.error(`Failed to save to library ${library.name}:`, errorData);
//             failedLibraries.push(`${library.name}: ${errorData.message || 'Unknown error'}`);
//             failedCount++;
//           }
//         } catch (error) {
//           console.error(`Error saving to library ${library.name}:`, error);
//           failedLibraries.push(`${library.name}: ${error.message}`);
//           failedCount++;
//         }
//       }

//       if (savedCount > 0) {
//         alert(`Paper saved to ${savedCount} librar${savedCount === 1 ? 'y' : 'ies'}!${failedCount > 0 ? `\n\nFailed to save to ${failedCount} librar${failedCount === 1 ? 'y' : 'ies'}:\n${failedLibraries.join('\n')}` : ''}`);
//         closeSave();
//       } else {
//         alert(`Failed to save paper:\n${failedLibraries.join('\n')}`);
//       }
//     } catch (error) {
//       console.error('Error saving paper:', error);
//       alert('Error saving paper: ' + error.message);
//     }
//   };

//   const handleCreateLibrary = async () => {
//     if (!newLibraryName.trim()) return;
    
//     try {
//       setCreatingLibrary(true);
//       const token = localStorage.getItem('access_token');
//       if (!token) {
//         alert('Please log in to create a library');
//         return;
//       }
      
//       const response = await fetch(`${API_ENDPOINTS.LIBRARIES}`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({ name: newLibraryName.trim() })
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         const newLibrary = data.library;
//         setUserLibraries([...userLibraries, { id: newLibrary.id, name: newLibrary.name, role: 'creator' }]);
//         setNewLibraryName('');
//         setShowNewLibraryModal(false);
//       } else {
//         let errorMsg = 'Failed to create library';
//         try {
//           const errorData = await response.json();
//           errorMsg = errorData.message || errorMsg;
//         } catch (e) {
//           errorMsg = `${response.status} ${response.statusText}`;
//         }
//         console.error('Error creating library:', errorMsg);
//         alert('Failed to create library: ' + errorMsg);
//       }
//     } catch (error) {
//       console.error('Error creating library:', error);
//       alert('Error creating library: ' + error.message);
//     } finally {
//       setCreatingLibrary(false);
//     }
//   };

//   const toggleLibrarySelection = (library) => {
//     setSelectedLibraries(prev => {
//       const libraryId = library.id;
//       const isSelected = prev.some(l => l.id === libraryId);
//       if (isSelected) {
//         return prev.filter(l => l.id !== libraryId);
//       } else {
//         return [...prev, library];
//       }
//     });
//   };

//   // Generate page numbers for pagination display
//   const getPageNumbers = () => {
//     const pageNumbers = [];
//     const maxVisiblePages = 5;
    
//     if (totalPages <= maxVisiblePages) {
//       for (let i = 1; i <= totalPages; i++) {
//         pageNumbers.push(i);
//       }
//     } else {
//       if (currentPage <= 3) {
//         for (let i = 1; i <= maxVisiblePages; i++) {
//           pageNumbers.push(i);
//         }
//         if (totalPages > maxVisiblePages) {
//           pageNumbers.push('...');
//           pageNumbers.push(totalPages);
//         }
//       } else if (currentPage >= totalPages - 2) {
//         pageNumbers.push(1);
//         pageNumbers.push('...');
//         for (let i = totalPages - 4; i <= totalPages; i++) {
//           pageNumbers.push(i);
//         }
//       } else {
//         pageNumbers.push(1);
//         pageNumbers.push('...');
//         for (let i = currentPage - 1; i <= currentPage + 1; i++) {
//           pageNumbers.push(i);
//         }
//         pageNumbers.push('...');
//         pageNumbers.push(totalPages);
//       }
//     }
    
//     return pageNumbers;
//   };

//   return (
//     <>
//       <Navbar />

//       <div style={{ paddingTop: 100, paddingLeft: 40, paddingRight: 40 }}>
//         <div ref={searchFormRef} style={{ position: "relative", maxWidth: 920, marginBottom: 18 }}>
//           <form onSubmit={onHeaderSearch} style={{ display: "flex" }}>
//             <input
//               type="text"
//               value={searchInput}
//               onChange={(e) => setSearchInput(e.target.value)}
//               onFocus={() => searchInput.trim().length >= 2 && setShowSuggestions(true)}
//               placeholder="Search for articles..."
//               style={{ 
//                 flex: 1, 
//                 padding: "10px 12px", 
//                 border: "1px solid #ddd", 
//                 borderRadius: "4px 0 0 4px" 
//               }}
//             />
//             <button 
//               type="submit"
//               style={{ 
//                 marginLeft: 0, 
//                 padding: "8px 14px", 
//                 background: "#3E513E", 
//                 color: "#fff", 
//                 border: "1px solid #3E513E", 
//                 cursor: "pointer", 
//                 borderRadius: "0 4px 4px 0" 
//               }}
//             >
//               Search
//             </button>
//           </form>

//           {/* Autocomplete Dropdown */}
//           {showSuggestions && suggestions.length > 0 && (
//             <div
//               style={{
//                 position: "absolute",
//                 top: "100%",
//                 left: 0,
//                 right: 72,
//                 backgroundColor: "#fff",
//                 border: "1px solid #ddd",
//                 borderTop: "none",
//                 borderRadius: "0 0 4px 4px",
//                 maxHeight: "300px",
//                 overflowY: "auto",
//                 zIndex: 1000,
//                 boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
//               }}
//             >
//               {suggestions.map((suggestion, idx) => (
//                 <div
//                   key={idx}
//                   onClick={() => handleSuggestionClick(suggestion)}
//                   style={{
//                     padding: "12px 12px",
//                     cursor: "pointer",
//                     borderBottom: idx < suggestions.length - 1 ? "1px solid #f0f0f0" : "none",
//                     transition: "background-color 0.2s",
//                     fontSize: 13,
//                     color: "#333"
//                   }}
//                   onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
//                   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
//                 >
//                   <div style={{ fontWeight: 500 }}>{suggestion.title}</div>
//                   {suggestion.authorsYear && (
//                     <div style={{ fontSize: 11, color: "#888" }}>{suggestion.authorsYear}</div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Loading indicator */}
//           {suggestionsLoading && searchInput.trim().length >= 2 && (
//             <div
//               style={{
//                 position: "absolute",
//                 top: "100%",
//                 left: 0,
//                 right: 72,
//                 padding: "12px 12px",
//                 backgroundColor: "#fff",
//                 border: "1px solid #ddd",
//                 borderTop: "none",
//                 borderRadius: "0 0 4px 4px",
//                 fontSize: 13,
//                 color: "#666",
//                 zIndex: 1000
//               }}
//             >
//               Loading suggestions...
//             </div>
//           )}
//         </div>

//         {/* Updated header message */}
//         <h3 style={{ marginTop: 8, marginBottom: 12, fontSize: 16, fontWeight: 500, color: '#333' }}>
//           {resultsLoading ? 'Loading results...' : 
//            q ? 
//              (totalResults > 0 ? 
//                `About ${totalResults.toLocaleString()} results for "${q}"` : 
//                `No results found for "${q}"`) : 
//              'Enter a search query'}
//         </h3>

//         {resultsError && (
//           <div style={{ color: '#d32f2f', marginBottom: 20 }}>
//             {resultsError}
//           </div>
//         )}

//         {/* Only show filters and results if we have data */}
//         {!resultsLoading && totalResults > 0 && (
//           <>
//             <div ref={containerRef} style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center", flexWrap: 'wrap' }}>
//               <div style={{ position: 'relative' }}>
//                 <button onClick={() => { setOpenFields(o=>!o); setOpenDate(false); }} style={{ padding: "8px 12px", border: "1px solid #e2e6ea", background: "#fff" }}>Fields of Study ▾</button>
//                 {openFields && (
//                   <div style={{ position: 'absolute', top: 40, left: 0, background: '#fff', border: '1px solid #ddd', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 12, width: 260, zIndex: 60 }}>
//                     <strong style={{display:'block', marginBottom:8}}>Fields of Study</strong>
//                     {availableFields.map((f) => (
//                       <label key={f} style={{ display: 'block', marginBottom: 6 }}>
//                         <input type="checkbox" checked={selectedFields.includes(f)} onChange={() => {
//                           setSelectedFields((prev) => prev.includes(f) ? prev.filter(x=>x!==f) : [...prev, f]);
//                         }} /> <span style={{marginLeft:8}}>{f}</span>
//                       </label>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <div style={{ position: 'relative' }}>
//                 <button onClick={() => { setOpenDate(o=>!o); setOpenFields(false); }} style={{ padding: "8px 12px", border: "1px solid #e2e6ea", background: "#fff" }}>Date Range ▾</button>
//                 {openDate && (
//                   <div style={{ position: 'absolute', top: 40, left: 0, background: '#fff', border: '1px solid #ddd', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 16, width: 360, zIndex:50, overflow: 'hidden', boxSizing: 'border-box' }}>
//                     <div style={{ position: 'relative', padding: '6px 0' }}>
//                       <input
//                         type="range"
//                         min={1931}
//                         max={2026}
//                         value={dateRange[0]}
//                         onChange={(e)=>{
//                           const val = Number(e.target.value);
//                           setDateRange([Math.min(val, dateRange[1]), dateRange[1]]);
//                         }}
//                         style={{ width: 'calc(100% - 48px)', marginLeft: 24, marginRight: 24, display: 'block' }}
//                       />
//                       <input
//                         type="range"
//                         min={1931}
//                         max={2026}
//                         value={dateRange[1]}
//                         onChange={(e)=>{
//                           const val = Number(e.target.value);
//                           setDateRange([dateRange[0], Math.max(val, dateRange[0])]);
//                         }}
//                         style={{ width: 'calc(100% - 48px)', marginLeft: 24, marginRight: 24, marginTop: -36, display: 'block' }}
//                       />
//                     </div>
//                     <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
//                       <small>{dateRange[0]}</small>
//                       <small>{dateRange[1]}</small>
//                     </div>
//                     <div style={{ display:'flex', gap:8, marginTop:12 }}>
//                       <button onClick={()=>setDateRange([2026,2026])} style={{padding:'8px 12px', border:'1px solid #9b9b9b', background:'#f5f5f5'}}>This year</button>
//                       <button onClick={()=>setDateRange([2021,2026])} style={{padding:'8px 12px', border:'1px solid #9b9b9b', background:'#f5f5f5'}}>Last 5 years</button>
//                       <button onClick={()=>setDateRange([2016,2026])} style={{padding:'8px 12px', border:'1px solid #9b9b9b', background:'#f5f5f5'}}>Last 10 years</button>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap:8 }}>
//                 <label style={{ color:'#444', fontSize:13 }}>Sort by</label>
//                 <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} style={{ padding:'6px 8px' }}>
//                   <option value="relevance">Relevance</option>
//                   <option value="citations">Citation count</option>
//                 </select>
//               </div>
//             </div>

//             <div>
//               {currentPapers.map((r, i) => (
//                 <div key={i} style={{ padding: "18px 0", borderBottom: "1px solid #eee" }}>
//                   <button 
//                     onClick={() => navigate(`/paper/${r.paperId}`)}
//                     style={{ 
//                       color: "#3E513E", 
//                       fontSize: 20, 
//                       fontWeight: 600, 
//                       textDecoration: "none",
//                       background: "transparent",
//                       border: "none",
//                       cursor: "pointer",
//                       padding: 0,
//                       textAlign: "left"
//                     }}
//                   >
//                     {r.title}
//                   </button>

//                   <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
//                     {/* 1. Authors first */}
//                     {r.authors && r.authors.map((a, idx) => (
//                       <span key={idx} style={{ background: "#f2f6f8", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}>
//                         {typeof a === 'object' ? a.name || '' : a || ''}
//                       </span>
//                     ))}
                    
//                     {/* 2. Fields of Study second */}
//                     {r.fieldsOfStudy && r.fieldsOfStudy.length > 0 && (
//                       <>
//                         {r.fieldsOfStudy.slice(0, 3).map((field, idx) => (
//                           <span 
//                             key={idx} 
//                             style={{ 
//                               background: "#e8f4f8", 
//                               padding: "4px 8px", 
//                               borderRadius: 4, 
//                               fontSize: 11,
//                               color: "#2c5c6d",
//                               fontWeight: 500
//                             }}
//                           >
//                             {field}
//                           </span>
//                         ))}
//                         {r.fieldsOfStudy.length > 3 && (
//                           <span 
//                             style={{ 
//                               background: "#e8f4f8", 
//                               padding: "4px 8px", 
//                               borderRadius: 4, 
//                               fontSize: 11,
//                               color: "#2c5c6d",
//                               fontWeight: 500
//                             }}
//                           >
//                             +{r.fieldsOfStudy.length - 3} more
//                           </span>
//                         )}
//                       </>
//                     )}
                    
//                     {/* 3. Venue third */}
//                     {r.venue && (
//                       <span style={{ color: "#888", fontSize: 13 }}>
//                         {Array.isArray(r.venue) ? r.venue.join(", ") : r.venue}
//                       </span>
//                     )}
                    
//                     {/* 4. Date fourth (with separator if venue exists) */}
//                     {(r.year || r.date) && (
//                       <span style={{ color: "#888", fontSize: 13 }}>
//                         {r.venue ? ' · ' : ''}{r.year || r.date || 'n.d.'}
//                       </span>
//                     )}
//                   </div>

//                   {/* ABSTRACT WITH EXPAND/COLLAPSE FUNCTIONALITY */}
//                   {r.abstract && (
//                     <div style={{ marginTop: 10 }}>
//                       <p style={{ 
//                         margin: 0, 
//                         color: "#444", 
//                         lineHeight: 1.6,
//                         fontSize: 14
//                       }}>
//                         {expandedAbstracts[r.paperId] ? r.abstract : (
//                           r.abstract.length > 300 ? `${r.abstract.substring(0, 300)}...` : r.abstract
//                         )}
//                       </p>
//                       {r.abstract.length > 300 && (
//                         <button 
//                           onClick={() => toggleAbstract(r.paperId)}
//                           style={{
//                             background: "transparent",
//                             border: "none",
//                             color: "#3E513E",
//                             cursor: "pointer",
//                             fontSize: 14,
//                             padding: "4px 0 0 0",
//                             margin: 0,
//                             textDecoration: "underline",
//                             fontWeight: 500
//                           }}
//                         >
//                           {expandedAbstracts[r.paperId] ? 'Collapse' : 'Expand'}
//                         </button>
//                       )}
//                     </div>
//                   )}

//                   <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
//                     {/* Citations Count with inverted commas icon */}
//                     <span style={{ 
//                       display: "inline-flex", 
//                       alignItems: "center", 
//                       gap: 6,
//                       padding: "6px 10px",
//                       background: "#f5f5f5",
//                       border: "1px solid #e0e0e0",
//                       borderRadius: 4,
//                       fontSize: 12,
//                       color: "#333",
//                       fontWeight: 500
//                     }}>
//                       <img 
//                         src={invertedCommasIcon} 
//                         alt="Citations" 
//                         style={{ width: 12, height: 12, opacity: 0.8 }}
//                       />
//                       {r.citationCount ? r.citationCount.toLocaleString() : 0}
//                     </span>

//                     {/* PDF Button */}
//                     {r.openAccessPdf && r.openAccessPdf.url ? (
//                       <a 
//                         href={r.openAccessPdf.url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         style={{
//                           display: "inline-flex",
//                           alignItems: "center",
//                           gap: 6,
//                           padding: "6px 10px",
//                           background: "#fff",
//                           border: "1px solid #e0e0e0",
//                           borderRadius: 4,
//                           fontSize: 12,
//                           color: "#333",
//                           textDecoration: "none",
//                           cursor: "pointer",
//                           fontWeight: 500,
//                           whiteSpace: "nowrap"
//                         }}
//                       >
//                         [PDF]
//                       </a>
//                     ) : null}

//                     {/* ArXiv Button - if available */}
//                     {r.externalIds && r.externalIds.ArXiv ? (
//                       <a 
//                         href={`https://arxiv.org/abs/${r.externalIds.ArXiv}`}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         style={{
//                           display: "inline-flex",
//                           alignItems: "center",
//                           gap: 6,
//                           padding: "6px 10px",
//                           background: "#fff",
//                           border: "1px solid #e0e0e0",
//                           borderRadius: 4,
//                           fontSize: 12,
//                           color: "#333",
//                           textDecoration: "none",
//                           cursor: "pointer",
//                           fontWeight: 500,
//                           whiteSpace: "nowrap"
//                         }}
//                       >
//                         arXiv
//                       </a>
//                     ) : null}

//                     {/* Save Button with bookmark icon */}
//                     <button 
//                       onClick={() => openSave(r)} 
//                       style={{
//                         display: "inline-flex",
//                         alignItems: "center",
//                         gap: 6,
//                         padding: "6px 10px",
//                         background: "#fff",
//                         border: "1px solid #e0e0e0",
//                         borderRadius: 4,
//                         fontSize: 12,
//                         color: "#333",
//                         cursor: "pointer",
//                         fontWeight: 500,
//                         whiteSpace: "nowrap"
//                       }}
//                     >
//                       <img 
//                         src={bookmarkIcon} 
//                         alt="Save" 
//                         style={{ width: 12, height: 12 }}
//                       />
//                       Save
//                     </button>

//                     {/* Cite Button with inverted commas icon */}
//                     <button 
//                       onClick={() => openCite(r)} 
//                       style={{
//                         display: "inline-flex",
//                         alignItems: "center",
//                         gap: 6,
//                         padding: "6px 10px",
//                         background: "#fff",
//                         border: "1px solid #e0e0e0",
//                         borderRadius: 4,
//                         fontSize: 12,
//                         color: "#333",
//                         cursor: "pointer",
//                         fontWeight: 500,
//                         whiteSpace: "nowrap"
//                       }}
//                     >
//                       <img 
//                         src={invertedCommasIcon} 
//                         alt="Cite" 
//                         style={{ width: 12, height: 12 }}
//                       />
//                       Cite
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Pagination - only show if we have more than 7 results */}
//             {visible.length > papersPerPage && (
//               <div style={{ marginTop: 40, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
//                 {/* Previous button */}
//                 <button 
//                   onClick={goToPrevPage}
//                   disabled={currentPage === 1}
//                   style={{ 
//                     padding: "8px 12px", 
//                     fontSize: 14,
//                     background: currentPage === 1 ? "#f5f5f5" : "#3E513E", 
//                     color: currentPage === 1 ? "#999" : "#fff", 
//                     border: "none",
//                     borderRadius: 4,
//                     cursor: currentPage === 1 ? "not-allowed" : "pointer",
//                     fontWeight: 500
//                   }}
//                 >
//                   ← Previous
//                 </button>

//                 {/* Page numbers */}
//                 {getPageNumbers().map((pageNum, index) => (
//                   pageNum === '...' ? (
//                     <span key={`ellipsis-${index}`} style={{ padding: "8px", color: "#666" }}>
//                       ...
//                     </span>
//                   ) : (
//                     <button
//                       key={pageNum}
//                       onClick={() => goToPage(pageNum)}
//                       style={{
//                         padding: "8px 12px",
//                         fontSize: 14,
//                         background: currentPage === pageNum ? "#3E513E" : "#f5f5f5",
//                         color: currentPage === pageNum ? "#fff" : "#333",
//                         border: "none",
//                         borderRadius: 4,
//                         cursor: "pointer",
//                         fontWeight: currentPage === pageNum ? 600 : 500,
//                         minWidth: "40px"
//                       }}
//                     >
//                       {pageNum}
//                     </button>
//                   )
//                 ))}

//                 {/* Next button */}
//                 <button 
//                   onClick={goToNextPage}
//                   disabled={currentPage === totalPages}
//                   style={{ 
//                     padding: "8px 12px", 
//                     fontSize: 14,
//                     background: currentPage === totalPages ? "#f5f5f5" : "#3E513E", 
//                     color: currentPage === totalPages ? "#999" : "#fff", 
//                     border: "none",
//                     borderRadius: 4,
//                     cursor: currentPage === totalPages ? "not-allowed" : "pointer",
//                     fontWeight: 500
//                   }}
//                 >
//                   Next →
//                 </button>
//               </div>
//             )}

//             {/* Show page info */}
//             {visible.length > 0 && (
//               <div style={{ marginTop: 20, textAlign: "center", color: "#666", fontSize: 14 }}>
//                 Showing papers {startIndex + 1} to {Math.min(endIndex, visible.length)} of {visible.length} results
//                 {visible.length !== totalResults && ` (filtered from ${totalResults} total)`}
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {/* Create New Library Modal */}
//       {showNewLibraryModal && (
//         <div style={{ 
//           position: 'fixed', 
//           top: 0, left: 0, right: 0, bottom: 0, 
//           background: 'rgba(0,0,0,0.5)', 
//           display: 'flex', alignItems: 'center', justifyContent: 'center', 
//           zIndex: 3000 
//         }}>
//           <div style={{
//             background: '#fff',
//             borderRadius: 8,
//             padding: '24px',
//             width: '90%',
//             maxWidth: '400px',
//             boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
//           }}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#333' }}>
//               Create New Library
//             </h3>
//             <input
//               type="text"
//               value={newLibraryName}
//               onChange={(e) => setNewLibraryName(e.target.value)}
//               placeholder="Library name"
//               autoFocus
//               onKeyPress={(e) => e.key === 'Enter' && handleCreateLibrary()}
//               style={{
//                 width: '100%',
//                 padding: '10px 12px',
//                 border: '1px solid #ddd',
//                 borderRadius: 4,
//                 fontSize: 14,
//                 marginBottom: '16px',
//                 boxSizing: 'border-box',
//                 outline: 'none'
//               }}
//             />
//             <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
//               <button
//                 onClick={() => {
//                   setShowNewLibraryModal(false);
//                   setNewLibraryName('');
//                 }}
//                 style={{
//                   padding: '8px 16px',
//                   background: '#f0f0f0',
//                   color: '#333',
//                   border: '1px solid #ddd',
//                   borderRadius: 4,
//                   cursor: 'pointer',
//                   fontSize: 12,
//                   fontWeight: 500
//                 }}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleCreateLibrary}
//                 disabled={!newLibraryName.trim() || creatingLibrary}
//                 style={{
//                   padding: '8px 16px',
//                   background: newLibraryName.trim() && !creatingLibrary ? '#3E513E' : '#ccc',
//                   color: '#fff',
//                   border: 'none',
//                   borderRadius: 4,
//                   cursor: newLibraryName.trim() && !creatingLibrary ? 'pointer' : 'not-allowed',
//                   fontSize: 12,
//                   fontWeight: 500
//                 }}
//               >
//                 {creatingLibrary ? 'Creating...' : 'Create'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Save Modal */}
//       {saveOpen && saveItem && (
//         <div style={{ 
//           position: 'fixed', 
//           top: 0, left: 0, right: 0, bottom: 0, 
//           background: 'rgba(0,0,0,0.5)', 
//           display: 'flex', alignItems: 'center', justifyContent: 'center', 
//           zIndex: 2000 
//         }}>
//           <div 
//             className="save-modal"
//             style={{ 
//               width: '500px',
//               maxWidth: '90vw', 
//               background: '#fff', 
//               borderRadius: 8,
//               boxShadow: '0 10px 40px rgba(0,0,0,0.2)', 
//               overflow: 'hidden' 
//             }}>
//             {/* Header */}
//             <div style={{ 
//               display: 'flex', 
//               justifyContent: 'space-between', 
//               alignItems: 'center', 
//               padding: '20px 24px', 
//               borderBottom: '1px solid #e0e0e0' 
//             }}>
//               <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#333' }}>Save to Library</h2>
//               <button 
//                 onClick={closeSave} 
//                 style={{ 
//                   width: 40, 
//                   height: 40, 
//                   borderRadius: 20, 
//                   background: '#3E513E', 
//                   color: '#fff', 
//                   border: 'none', 
//                   cursor: 'pointer', 
//                   fontSize: 20, 
//                   display: 'flex', 
//                   alignItems: 'center', 
//                   justifyContent: 'center' 
//                 }}
//               >
//                 ✕
//               </button>
//             </div>

//             {/* Content */}
//             <div style={{ padding: '24px' }}>
//               {/* Paper info - smaller */}
//               <div style={{ marginBottom: 20 }}>
//                 <h3 style={{ 
//                   margin: 0, 
//                   fontSize: 15,
//                   fontWeight: 600, 
//                   color: '#333', 
//                   marginBottom: 6,
//                   lineHeight: 1.4 
//                 }}>
//                   {saveItem.title}
//                 </h3>
//                 <p style={{ 
//                   margin: 0, 
//                   fontSize: 12,
//                   color: '#666',
//                   lineHeight: 1.4 
//                 }}>
//                   {(saveItem.authors || []).slice(0, 2).map(a => typeof a === 'object' ? a.name : a).join(', ')} 
//                   {(saveItem.authors || []).length > 2 ? '+ others' : ''} • 
//                   {saveItem.venue ? (Array.isArray(saveItem.venue) ? saveItem.venue.join(", ") : saveItem.venue) : ''}
//                   {saveItem.year || saveItem.date ? ' • ' + (saveItem.year || saveItem.date || 'n.d.') : ''}
//                 </p>
//                 {/* Add fields of study to save modal display */}
//                 {saveItem.fieldsOfStudy && saveItem.fieldsOfStudy.length > 0 && (
//                   <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
//                     {saveItem.fieldsOfStudy.slice(0, 3).map((field, idx) => (
//                       <span 
//                         key={idx}
//                         style={{ 
//                           background: "#e8f4f8", 
//                           padding: "2px 6px", 
//                           borderRadius: 3, 
//                           fontSize: 10,
//                           color: "#2c5c6d"
//                         }}
//                       >
//                         {field}
//                       </span>
//                     ))}
//                     {saveItem.fieldsOfStudy.length > 3 && (
//                       <span 
//                         style={{ 
//                           background: "#e8f4f8", 
//                           padding: "2px 6px", 
//                           borderRadius: 3, 
//                           fontSize: 10,
//                           color: "#2c5c6d"
//                         }}
//                       >
//                         +{saveItem.fieldsOfStudy.length - 3} more
//                       </span>
//                     )}
//                   </div>
//                 )}
//               </div>

//               {/* Libraries list */}
//               <div style={{ marginBottom: 20 }}>
//                 <div style={{ 
//                   display: 'flex',
//                   justifyContent: 'space-between',
//                   alignItems: 'center',
//                   marginBottom: 10
//                 }}>
//                   <div style={{ 
//                     fontSize: 13,
//                     fontWeight: 600, 
//                     color: '#444'
//                   }}>
//                     Select libraries to save to:
//                   </div>
//                   <button
//                     onClick={() => setShowNewLibraryModal(true)}
//                     style={{
//                       fontSize: 12,
//                       padding: '4px 8px',
//                       background: '#f0f0f0',
//                       color: '#333',
//                       border: '1px solid #ddd',
//                       borderRadius: 4,
//                       cursor: 'pointer',
//                       fontWeight: 500
//                     }}
//                   >
//                     + New
//                   </button>
//                 </div>
                
//                 {availableLibraries.length === 0 ? (
//                   <div style={{
//                     padding: '20px',
//                     textAlign: 'center',
//                     color: '#666',
//                     background: '#f9f9f9',
//                     borderRadius: 4,
//                     border: '1px solid #e0e0e0'
//                   }}>
//                     <p style={{ margin: '0 0 10px 0', fontSize: 13 }}>
//                       You haven't created any libraries yet.
//                     </p>
//                     <button
//                       onClick={() => setShowNewLibraryModal(true)}
//                       style={{
//                         padding: '8px 16px',
//                         background: '#3E513E',
//                         color: '#fff',
//                         border: 'none',
//                         borderRadius: 4,
//                         cursor: 'pointer',
//                         fontSize: 12,
//                         fontWeight: 500
//                       }}
//                     >
//                       Create Library
//                     </button>
//                   </div>
//                 ) : (
//                   <div style={{ 
//                     maxHeight: 200,
//                     overflowY: 'auto', 
//                     border: '1px solid #e0e0e0', 
//                     borderRadius: 4 
//                   }}>
//                   {availableLibraries.map((library, index) => (
//                     <label
//                       key={library.id}
//                       style={{
//                         display: 'flex',
//                         alignItems: 'center',
//                         padding: '10px 14px',
//                         borderBottom: index < availableLibraries.length - 1 ? '1px solid #f0f0f0' : 'none',
//                         cursor: 'pointer',
//                         backgroundColor: selectedLibraries.some(l => l.id === library.id) ? '#f0f7f0' : 'transparent',
//                         transition: 'background-color 0.2s',
//                       }}
//                     >
//                       <input
//                         type="checkbox"
//                         checked={selectedLibraries.some(l => l.id === library.id)}
//                         onChange={() => toggleLibrarySelection(library)}
//                         style={{ marginRight: 10 }}
//                       />
//                       <span style={{ fontSize: 13, color: '#333' }}>{library.name}</span>
//                     </label>
//                   ))}
//                   </div>
//                 )}
//               </div>

//               {/* Divider */}
//               <div style={{ height: '1px', background: '#e0e0e0', marginBottom: 16 }} />

//               {/* Action buttons */}
//               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                 {/* Selected count */}
//                 <div style={{ fontSize: 12, color: '#666' }}>
//                   {selectedLibraries.length} {selectedLibraries.length === 1 ? 'library' : 'libraries'} selected
//                 </div>

//                 {/* Save button */}
//                 <button
//                   onClick={handleSaveToLibraries}
//                   disabled={selectedLibraries.length === 0}
//                   style={{
//                     padding: '8px 20px',
//                     background: selectedLibraries.length === 0 ? '#cccccc' : '#3E513E',
//                     color: '#fff',
//                     border: 'none',
//                     borderRadius: 4,
//                     cursor: selectedLibraries.length === 0 ? 'not-allowed' : 'pointer',
//                     fontSize: 13,
//                     fontWeight: 500,
//                     transition: 'background-color 0.2s',
//                   }}
//                 >
//                   Save to {selectedLibraries.length > 0 ? `${selectedLibraries.length} ` : ''}Library{selectedLibraries.length !== 1 ? 'ies' : ''}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Citation Modal */}
//       {citeOpen && (
//         <div style={{ 
//           position: 'fixed', 
//           top: 0, left: 0, right: 0, bottom: 0, 
//           background: 'rgba(0,0,0,0.5)', 
//           display: 'flex', alignItems: 'center', justifyContent: 'center', 
//           zIndex: 2000 
//         }}>
//           <div 
//             className="cite-modal"
//             style={{ 
//               width: '580px', 
//               maxWidth: '90vw', 
//               background: '#fff', 
//               borderRadius: 8, 
//               boxShadow: '0 10px 40px rgba(0,0,0,0.2)', 
//               overflow: 'hidden' 
//             }}>
//             {/* Header */}
//             <div style={{ 
//               display: 'flex', 
//               justifyContent: 'space-between', 
//               alignItems: 'center', 
//               padding: '20px 24px', 
//               borderBottom: '1px solid #e0e0e0' 
//             }}>
//               <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#333' }}>Cite Paper</h2>
//               <button 
//                 onClick={closeCite} 
//                 style={{ 
//                   width: 40, 
//                   height: 40, 
//                   borderRadius: 20, 
//                   background: '#3E513E', 
//                   color: '#fff', 
//                   border: 'none', 
//                   cursor: 'pointer', 
//                   fontSize: 20, 
//                   display: 'flex', 
//                   alignItems: 'center', 
//                   justifyContent: 'center' 
//                 }}
//               >
//                 ✕
//               </button>
//             </div>

//             {/* Content */}
//             <div style={{ padding: '24px' }}>
//               {citeLoading && (
//                 <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
//                   Loading citation formats...
//                 </div>
//               )}
              
//               {!citeLoading && citeFormats.length > 0 && (
//                 <>
//                   {/* Format tabs */}
//                   <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e0e0e0', marginBottom: 20, overflowX: 'auto' }}>
//                     {citeFormats.map(fmt => (
//                       <button
//                         key={fmt.id}
//                         onClick={() => setCiteFormat(fmt.id)}
//                         style={{
//                           padding: '12px 16px',
//                           background: 'transparent',
//                           border: 'none',
//                           borderBottom: citeFormat === fmt.id ? '3px solid #3E513E' : '3px solid transparent',
//                           cursor: 'pointer',
//                           fontSize: 14,
//                           fontWeight: citeFormat === fmt.id ? 600 : 500,
//                           color: citeFormat === fmt.id ? '#3E513E' : '#666',
//                           whiteSpace: 'nowrap'
//                         }}
//                       >
//                         {fmt.label || fmt.id}
//                       </button>
//                     ))}
//                   </div>

//                   {/* Citation display area */}
//                   <div style={{ marginBottom: 20 }}>
//                     {citeFormat === 'bibtex' ? (
//                       <textarea
//                         id="cite-textarea"
//                         readOnly
//                         value={(() => {
//                           const selected = citeFormats.find(f => f.id === citeFormat);
//                           return selected ? selected.value : '';
//                         })()}
//                         style={{
//                           width: '100%',
//                           height: 200,
//                           padding: 12,
//                           fontFamily: 'monospace',
//                           fontSize: 12,
//                           border: '1px solid #d0d0d0',
//                           borderRadius: 4,
//                           resize: 'none',
//                           background: '#fafafa'
//                         }}
//                       />
//                     ) : (
//                       <div
//                         id="cite-html"
//                         style={{
//                           width: '100%',
//                           height: 200,
//                           padding: 12,
//                           fontSize: 12,
//                           border: '1px solid #d0d0d0',
//                           borderRadius: 4,
//                           background: '#fafafa',
//                           overflowY: 'auto'
//                         }}
//                         dangerouslySetInnerHTML={{
//                           __html: (() => {
//                             const selected = citeFormats.find(f => f.id === citeFormat);
//                             return selected ? selected.value : '';
//                           })()
//                         }}
//                       />
//                     )}
//                   </div>

//                   {/* Divider */}
//                   <div style={{ height: '1px', background: '#e0e0e0', marginBottom: 20 }} />

//                   {/* Copy and Export */}
//                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     {/* Export / BibTeX on the left */}
//                     <div>
//                       <div style={{ fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 8 }}></div>
//                       <div style={{ display: 'flex', gap: 8 }}>
//                         <button
//                           onClick={downloadBibTeX}
//                           style={{
//                             padding: '8px 16px',
//                             background: '#3E513E',
//                             color: '#fff',
//                             border: 'none',
//                             borderRadius: 4,
//                             cursor: 'pointer',
//                             fontSize: 13,
//                             fontWeight: 500
//                           }}
//                         >
//                           BibTeX
//                         </button>
//                       </div>
//                     </div>

//                     {/* Copy button on the right */}
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                       <button
//                         onClick={copyCitation}
//                         style={{
//                           display: 'inline-flex',
//                           alignItems: 'center',
//                           gap: 6,
//                           background: 'transparent',
//                           border: 'none',
//                           color: '#3E513E',
//                           cursor: 'pointer',
//                           fontSize: 13,
//                           fontWeight: 500,
//                         }}
//                       >
//                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                           <path d="M16 1H4a2 2 0 00-2 2v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//                           <rect x="8" y="5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//                         </svg>
//                         Copy
//                       </button>
//                       {copied && <span style={{ color: '#0b8043', fontWeight: 600, fontSize: 13 }}>Copied!</span>}
//                     </div>
//                   </div>
//                 </>
//               )}
              
//               {!citeLoading && citeFormats.length === 0 && (
//                 <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
//                   No citation formats available
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default ResultsPage;



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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const papersPerPage = 7;

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

  // NEW: Track expanded abstracts for each paper
  const [expandedAbstracts, setExpandedAbstracts] = useState({});
  
  // NEW: Track if user has interacted with search input
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
  
  useEffect(() => {
    if (!q) {
      setResults([]);
      setTotalResults(0);
      setCurrentPage(1);
      // Reset expanded abstracts when results change
      setExpandedAbstracts({});
      return;
    }

    const fetchResults = async () => {
      try {
        setResultsLoading(true);
        setResultsError(null);
        console.log(`Fetching results for: "${q}"`);
        
        const params = new URLSearchParams();
        params.append('query', q);
        params.append('limit', 100);
        params.append('offset', 0);
        
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
          
          // Process the results to include fields of study
          const processedResults = (data.data || []).map(paper => ({
            ...paper,
            // Ensure fieldsOfStudy is always an array
            fieldsOfStudy: Array.isArray(paper.fieldsOfStudy) ? paper.fieldsOfStudy : 
                          paper.fields ? (Array.isArray(paper.fields) ? paper.fields : []) : []
          }));
          
          setResults(processedResults);
          setTotalResults(data.total || processedResults.length || 0);
          setCurrentPage(1);
          // Reset expanded abstracts when results change
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
  }, [q, sortBy, dateRange, selectedFields]);

  // Pre-fetch citations for first few results
  useEffect(() => {
    const preFetchCitations = async () => {
      if (!results || results.length === 0) return;
      
      // Pre-fetch citations for the first few papers
      const papersToPrefetch = results.slice(0, 5);
      papersToPrefetch.forEach(async (paper) => {
        if (paper.paperId && !citationCache.has(paper.paperId)) {
          try {
            const response = await fetch(`http://localhost:5000/api/citations/${paper.paperId}`);
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

  // Autocomplete handler with 1 second delay - UPDATED TO NOT SHOW ON INITIAL LOAD
  useEffect(() => {
    // Only show suggestions if user has interacted AND query is long enough
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

  const visible = useMemo(() => {
    let list = results.slice();
    if (sortBy === 'citations') {
      list.sort((a,b)=> (b.citationCount || 0) - (a.citationCount || 0));
    }
    return list;
  }, [results, sortBy]);

  // Extract available fields from results
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

  // Pagination calculations
  const totalPages = Math.ceil(visible.length / papersPerPage);
  const startIndex = (currentPage - 1) * papersPerPage;
  const endIndex = startIndex + papersPerPage;
  const currentPapers = visible.slice(startIndex, endIndex);

  const onHeaderSearch = (e) => {
    e && e.preventDefault && e.preventDefault();
    setShowSuggestions(false);
    setHasUserInteracted(false); // Reset interaction state after search
    
    if (!searchInput.trim()) {
      return;
    }
    
    navigate(`/search?q=${encodeURIComponent(searchInput)}&type=${encodeURIComponent(type)}`);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchInput(suggestion.title);
    setShowSuggestions(false);
    setHasUserInteracted(false); // Reset after clicking suggestion
    
    if (suggestion.title.trim()) {
      navigate(`/search?q=${encodeURIComponent(suggestion.title)}&type=${encodeURIComponent(type)}`);
    }
  };

  // NEW: Toggle abstract expansion for a specific paper
  const toggleAbstract = (paperId) => {
    setExpandedAbstracts(prev => ({
      ...prev,
      [paperId]: !prev[paperId]
    }));
  };

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

  // Citation modal functions with caching
  const openCite = async (item) => {
    if (!item || !item.paperId) return;
    
    setCiteLoading(true);
    setCiteFormats([]);
    setCiteOpen(true);
    setCopied(false);
    setCiteItem(item);
    
    try {
      // Use cached citations
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
    
    // Try to get citation from cached format
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
    
    // Try to get BibTeX from cached format
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

  // SAVE PAPER TO LIBRARIES
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

      // Get BibTeX for the paper - USING CACHE
      const paperIdToFetch = saveItem.paperId || saveItem.id;
      let bibtexData = '';
      
      if (paperIdToFetch) {
        bibtexData = await fetchPaperBibtexWithCache(paperIdToFetch);
      }

      // Prepare paper data with BibTeX
      const paperData = {
        s2_paper_id: paperIdToFetch || '',
        title: saveItem.title || '',
        venue: Array.isArray(saveItem.venue) ? saveItem.venue[0] : saveItem.venue || '',
        published_year: saveItem.year || new Date().getFullYear(),
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

      console.log("Saving paper with data:", {
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
        <div ref={searchFormRef} style={{ position: "relative", maxWidth: 920, marginBottom: 18 }}>
          <form onSubmit={onHeaderSearch} style={{ display: "flex" }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setHasUserInteracted(true); // User is typing
              }}
              onFocus={() => {
                setHasUserInteracted(true); // User focused the input
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

          {/* Autocomplete Dropdown */}
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

          {/* Loading indicator */}
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

        {/* Updated header message */}
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

        {/* Only show filters and results if we have data */}
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
              {currentPapers.map((r, i) => (
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
                    {/* 1. Authors first */}
                    {r.authors && r.authors.map((a, idx) => (
                      <span key={idx} style={{ background: "#f2f6f8", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}>
                        {typeof a === 'object' ? a.name || '' : a || ''}
                      </span>
                    ))}
                    
                    {/* 2. Fields of Study second */}
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
                    
                    {/* 3. Venue third */}
                    {r.venue && (
                      <span style={{ color: "#888", fontSize: 13 }}>
                        {Array.isArray(r.venue) ? r.venue.join(", ") : r.venue}
                      </span>
                    )}
                    
                    {/* 4. Date fourth (with separator if venue exists) */}
                    {(r.year || r.date) && (
                      <span style={{ color: "#888", fontSize: 13 }}>
                        {r.venue ? ' · ' : ''}{r.year || r.date || 'n.d.'}
                      </span>
                    )}
                  </div>

                  {/* ABSTRACT WITH EXPAND/COLLAPSE FUNCTIONALITY */}
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

            {/* Pagination - only show if we have more than 7 results */}
            {visible.length > papersPerPage && (
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
            {visible.length > 0 && (
              <div style={{ marginTop: 20, textAlign: "center", color: "#666", fontSize: 14 }}>
                Showing papers {startIndex + 1} to {Math.min(endIndex, visible.length)} of {visible.length} results
                {visible.length !== totalResults && ` (filtered from ${totalResults} total)`}
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

export default ResultsPage;