import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { API_ENDPOINTS } from '../config/api';

// Helper functions for citation formatting
const getCitationText = (item, format) => {
  if (!item) return '';
  const authors = (item.authors || []).map(a => a.name || a).join(' and ');
  const year = item.year || 'n.d.';

  if (format === 'BibTeX') {
    const key = `${(item.authors && item.authors[0] && (item.authors[0].name || item.authors[0]).replace(/\s+/g,'')) || 'author'}${year}`;
    return `@inproceedings{${key},\n  title={${item.title}},\n  author={${authors}},\n  booktitle=${item.venue || 'Unknown'},\n  year={${year}},\n}`;
  }

  if (format === 'MLA') {
    return `${(item.authors || []).map(a => a.name || a).join(', ')}. "${item.title}." ${item.venue || 'Unknown'}, ${year}.`;
  }

  if (format === 'APA') {
    return `${(item.authors || []).map(a => a.name || a).join(', ')} (${year}). ${item.title}. ${item.venue || 'Unknown'}.`;
  }

  if (format === 'IEEE') {
    return `[1] ${(item.authors || []).map(a => a.name || a).join(', ')}, "${item.title}," ${item.venue || 'Unknown'}, ${year}.`;
  }

  return '';
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

const PaperDetails = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [paper, setPaper] = useState(null);
  const [paperLoading, setPaperLoading] = useState(true);
  const [paperError, setPaperError] = useState(null);
  
  // State for existing features
  const [chatOpen, setChatOpen] = useState(false);
  const [abstractExpanded, setAbstractExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I can help you understand this paper better. What would you like to know?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState(null);

  // State for Save and Cite modals
  const [saveOpen, setSaveOpen] = useState(false);
  const [selectedLibraries, setSelectedLibraries] = useState([]);
  const [userLibraries, setUserLibraries] = useState([]);
  const [librariesLoading, setLibrariesLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNewLibraryModal, setShowNewLibraryModal] = useState(false);
  const [newLibraryName, setNewLibraryName] = useState('');
  const [creatingLibrary, setCreatingLibrary] = useState(false);
  const [citeOpen, setCiteOpen] = useState(false);
  const [citeFormats, setCiteFormats] = useState([]);
  const [citeFormat, setCiteFormat] = useState('bibtex');
  const [copied, setCopied] = useState(false);
  const [citeLoading, setCiteLoading] = useState(false);

  // State for keyword extraction
  const [keywords, setKeywords] = useState([]);
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [keywordsError, setKeywordsError] = useState(null);
  const [keywordsExtracted, setKeywordsExtracted] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  // Refs for scrolling
  const topicsSectionRef = useRef(null);
  const detailsSectionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch paper details from backend
  useEffect(() => {
    if (!paperId) {
      setPaperError('No paper ID provided');
      setPaperLoading(false);
      return;
    }

    const fetchPaperDetails = async () => {
      try {
        setPaperLoading(true);
        setPaperError(null);
        console.log(`Fetching paper details for paperId: ${paperId}`);
        
        const url = `http://localhost:5000/api/papers/${paperId}`;
        console.log(`Request URL: ${url}`);
        
        const response = await fetch(url);
        console.log(`Response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Paper details loaded:", data);
          setPaper(data);
          
          // Check if paper already has keywords
          if (data.keywords && data.keywords.length > 0) {
            setKeywords(data.keywords);
            setKeywordsExtracted(true);
          }
        } else {
          const errorText = await response.text();
          console.error(`Error response (${response.status}):`, errorText);
          setPaperError(`Failed to load paper details (${response.status})`);
        }
      } catch (error) {
        console.error("Paper details fetch error:", error);
        setPaperError(`Error loading paper details: ${error.message}`);
      } finally {
        setPaperLoading(false);
      }
    };

    fetchPaperDetails();
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

  // NEW: Auto-scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // NEW FUNCTION: Get JWT token from localStorage
  const getAuthToken = () => {
    // Try to get access_token directly from localStorage
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      return accessToken;
    }
    
    // Fallback: try to get from user object
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.session?.access_token || user.token || null;
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  };

  // MODIFIED FUNCTION: Send message to AI backend
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !paper || isSending) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    setChatError(null);
    
    // Add user message to chat
    const newMessages = [
      ...messages,
      { role: 'user', text: userMessage }
    ];
    setMessages(newMessages);
    setIsSending(true);
    
    try {
      // Get auth token
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found in localStorage');
        throw new Error('Please log in to use the AI chat feature');
      }
      
      console.log("Token found, sending to AI backend:", token.substring(0, 20) + "...");
      
      // Get PDF URL from paper data - check multiple possible properties
      const pdfUrl = paper.openAccessPdf?.url || paper.pdfUrl || paper.url || '';
      if (!pdfUrl) {
        throw new Error('PDF URL not available for this paper');
      }
      
      console.log("Sending question to AI backend:", { pdfUrl, question: userMessage });
      
      const response = await fetch('http://localhost:5000/api/paper-ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pdfUrl: pdfUrl,
          question: userMessage
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error response:", errorData, "Status:", response.status);
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("AI response received:", data);
      
      // Add AI response to chat
      setMessages([
        ...newMessages,
        { role: 'bot', text: data.answer || "I couldn't find an answer to that question in the paper." }
      ]);
      
    } catch (error) {
      console.error("Chat error:", error);
      setChatError(error.message);
      
      // Add error message to chat
      setMessages([
        ...newMessages,
        { role: 'bot', text: `Sorry, I encountered an error: ${error.message}` }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // NEW FUNCTION: Extract keywords when Topics tab is clicked
  const extractKeywordsForPaper = async () => {
    if (!paper || keywordsExtracted || keywordsLoading) return;
    
    try {
      setKeywordsLoading(true);
      setKeywordsError(null);
      setUsingFallback(false);
      
      console.log("Extracting keywords for paper:", paper.title);
      
      const response = await fetch('http://localhost:5000/api/keywords/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: paper.title,
          abstract: paper.abstract
        })
      });
      
      // First check if response is ok
      if (!response.ok) {
        let errorText;
        try {
          const errorData = await response.json();
          
          // Check if it's a quota error (429)
          if (response.status === 429) {
            console.log("AI quota exceeded, using fallback extraction");
            // Simple fallback extraction based on title and abstract
            const text = `${paper.title} ${paper.abstract}`.toLowerCase();
            const words = text.split(/\W+/).filter(word => word.length > 3);
            const commonTerms = ['machine learning', 'deep learning', 'artificial intelligence', 'data', 'analysis', 'method', 'study', 'research', 'model', 'system'];
            
            // Get unique words and limit to 10
            const uniqueWords = [...new Set(words)].slice(0, 10);
            setKeywords(uniqueWords.length > 0 ? uniqueWords : commonTerms.slice(0, 5));
            setKeywordsExtracted(true);
            setUsingFallback(true);
            return;
          }
          
          errorText = errorData.error || `HTTP ${response.status}`;
          throw new Error(errorText);
        } catch (jsonError) {
          errorText = await response.text();
          if (!errorText) {
            errorText = `HTTP ${response.status}`;
          }
          throw new Error(errorText);
        }
      }
      
      // Try to parse as JSON
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        throw new Error("Invalid response from server");
      }
      
      if (data.success && data.data && data.data.keywords) {
        console.log("Keywords extracted via AI:", data.data.keywords);
        setKeywords(data.data.keywords);
        setKeywordsExtracted(true);
        setUsingFallback(false);
      } else {
        throw new Error(data.error || "Failed to extract keywords");
      }
    } catch (error) {
      console.error("Keyword extraction error:", error);
      setKeywordsError(`Failed to extract keywords: ${error.message}`);
    } finally {
      setKeywordsLoading(false);
    }
  };

  // Handle tab click - extract keywords when Topics tab is clicked
  const handleTabClick = (tab) => {
    if (tab.isNavigation && tab.paperId) {
      if (tab.id === 'citations') {
        navigate(`/citations/${tab.paperId}`);
      } else if (tab.id === 'references') {
        navigate(`/references/${tab.paperId}`);
      } else if (tab.id === 'related') {
        navigate(`/related/${tab.paperId}`);
      }
    } else {
      setActiveTab(tab.id);
      
      // Extract keywords when Topics tab is clicked
      if (tab.id === 'topics' && paper && !keywordsExtracted && !keywordsLoading) {
        extractKeywordsForPaper();
      }
    }
  };

  // Scroll to topics section when activeTab changes to 'topics'
  useEffect(() => {
    if (activeTab === 'topics' && topicsSectionRef.current) {
      // Wait for next render cycle to ensure the section is rendered
      setTimeout(() => {
        topicsSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 50);
    } else if (activeTab === 'details' && detailsSectionRef.current) {
      // Scroll to details section when Details tab is clicked
      setTimeout(() => {
        detailsSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 50);
    }
  }, [activeTab]);

  // Use real user libraries or empty array
  const availableLibraries = isAuthenticated && userLibraries.length > 0 
    ? userLibraries 
    : [];

  // Save modal functions
  const openSave = () => {
    if (!isAuthenticated) {
      alert('Please log in to save papers to libraries');
      navigate('/login');
      return;
    }
    setSelectedLibraries([]);
    setSaveOpen(true);
  };

  const closeSave = () => {
    setSaveOpen(false);
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
        s2_paper_id: paper.paperId || paper.id || '',
        title: paper.title || '',
        venue: Array.isArray(paper.venue) ? paper.venue[0] : paper.venue || '',
        published_year: paper.year || new Date().getFullYear(),
        citation_count: paper.citationCount || 0,
        fields_of_study: paper.fieldsOfStudy || [],
        abstract: paper.abstract || '',
        bibtex: paper.bibtex || '',
        authors: (paper.authors || []).map(a => ({ 
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

  // Citation modal functions
  const openCite = async () => {
    if (!paper || !paper.paperId) return;
    
    setCiteLoading(true);
    setCiteFormats([]);
    setCiteOpen(true);
    setCopied(false);
    
    try {
      console.log(`Fetching citations for paper: ${paper.paperId}`);
      const response = await fetch(`http://localhost:5000/api/citations/${paper.paperId}`);
      
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
    if (!txt && paper) {
      txt = getCitationText(paper, citeFormat);
    }
    
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(()=>setCopied(false), 1600);
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
    if (!content && paper) {
      content = getCitationText(paper, 'BibTeX');
    }
    
    const name = sanitizeFilename((paper && paper.title) || 'paper') + '.bib';
    downloadFile(name, content, 'application/x-bibtex');
  };

  // Tabs configuration
  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'topics', label: 'Topics' },
    { 
      id: 'citations', 
      label: `Citations (${(paper && paper.citationCount) || 0})`, 
      isNavigation: true, 
      paperId: paper?.paperId 
    },
    { 
      id: 'references', 
      label: `References (${(paper && paper.referenceCount) || 0})`, 
      isNavigation: true, 
      paperId: paper?.paperId 
    },
    { 
      id: 'related', 
      label: 'Related Papers', 
      isNavigation: true, 
      paperId: paper?.paperId 
    },
  ];

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

  return (
    <>
      <Navbar />
      
      <div style={{ 
        paddingTop: 80, 
        paddingLeft: 40, 
        paddingRight: 40,
        paddingBottom: 40,
        background: '#f0f0f0',
        minHeight: '100vh',
        marginRight: chatOpen ? 380 : 0,
        transition: 'margin-right 0.3s ease'
      }}>
        
        {/* Loading State */}
        {paperLoading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            maxWidth: 1400,
            margin: '0 auto'
          }}>
            <div style={{ fontSize: 18, color: '#666' }}>Loading paper details...</div>
            
          </div>
        )}
        
        {/* Error State */}
        {paperError && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            maxWidth: 1400,
            margin: '0 auto'
          }}>
            <div style={{ fontSize: 18, color: '#d32f2f' }}>Error: {paperError}</div>
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
        
        {/* Main Content Container & Tabs */}
        {paper && !paperLoading && !paperError && (
        <>
        <div style={{ 
          display: 'flex', 
          gap: 32,
          maxWidth: 1400,
          margin: '0 auto'
        }}>
          
          {/* Left Column - Paper Details */}
          <div style={{ flex: 1 }}>
            
            {/* DOI and Corpus ID */}
            <div style={{ 
              fontSize: 13, 
              color: '#999', 
              marginBottom: 20,
              display: 'flex',
              gap: 20
            }}>
              {paper.doi && (
                <span>
                  <strong>DOI:</strong> <a href={`https://doi.org/${paper.doi}`} style={{ color: '#999', textDecoration: 'none' }}>{paper.doi}</a>
                </span>
              )}
              {paper.corpusId && (
                <span>
                  <strong>Corpus ID:</strong> {paper.corpusId}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{ 
              fontSize: 32, 
              fontWeight: 700, 
              color: '#222', 
              marginBottom: 20,
              lineHeight: 1.3
            }}>
              {paper.title}
            </h1>

            {/* Authors & Meta */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
                {(paper.authors || []).map((author, idx) => {
                  const authorName = author.name || author;
                  return (
                    <React.Fragment key={idx}>
                      <span 
                        style={{ 
                          color: '#3E513E', 
                          cursor: 'pointer',
                          textDecoration: 'none',
                          fontSize: 14
                        }}
                      >
                        {authorName}
                      </span>
                      {idx < (paper.authors || []).length - 1 && <span style={{ margin: '0 4px', color: '#666' }}>·</span>}
                    </React.Fragment>
                  );
                })}
              </div>
              
              <div style={{ color: '#999', fontSize: 13 }}>
                <span>Published in <a href="#" style={{ color: '#3E513E', textDecoration: 'none' }}>{paper.venue || 'Unknown'}</a></span>
                <span style={{ margin: '0 8px' }}>·</span>
                <span>{paper.year || 'n.d.'}</span>
                {paper.fieldsOfStudy && paper.fieldsOfStudy.length > 0 && (
                  <>
                    <span style={{ margin: '0 8px' }}>·</span>
                    <span><a href="#" style={{ color: '#3E513E', textDecoration: 'none' }}>{paper.fieldsOfStudy.join(', ')}</a></span>
                  </>
                )}
              </div>
            </div>

            {/* Abstract */}
            <div style={{ 
              background: 'transparent',
              padding: 0,
              marginBottom: 24,
              borderLeft: 'none'
            }}>
              <div style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: 14, color: '#333' }}>Abstract</strong>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#333', lineHeight: 1.6 }}>
                {abstractExpanded ? paper.abstract : (paper.abstract || '').substring(0, 200) + '...'}
              </p>
              {paper.abstract && paper.abstract.length > 200 && (
                <button 
                  onClick={() => setAbstractExpanded(!abstractExpanded)}
                  style={{ 
                    color: '#3E513E', 
                    textDecoration: 'none', 
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: 0
                  }}
                >
                  {abstractExpanded ? 'Collapse' : 'Expand'}
                </button>
              )}
            </div>

            {/* Action Buttons - Ordered: PDF, Save, Cite */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
              
              {/* PDF Button */}
              {paper.openAccessPdf && paper.openAccessPdf.url ? (
                <a 
                  href={paper.openAccessPdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 12px',
                    background: '#3E513E',
                    color: '#fff',
                    border: '1px solid #3E513E',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap'
                  }}
                >
                  [PDF] {(() => {
                    const status = paper.openAccessPdf.status;
                    const statusMap = {
                      'ARXIV': 'arXiv',
                      'DOI': 'DOI',
                      'PMC': 'PubMed Central',
                      'ACL': 'ACL',
                      'ACM': 'ACM',
                      'BIORXIV': 'bioRxiv',
                      'GREEN': 'Open Access'
                    };
                    return statusMap[status] || status || 'Open Access';
                  })()}
                </a>
              ) : (
                <button 
                  disabled
                  style={{
                    padding: '8px 12px',
                    background: '#f0f0f0',
                    color: '#999',
                    border: '1px solid #d0d0d0',
                    borderRadius: 4,
                    cursor: 'not-allowed',
                    fontSize: 12,
                    fontWeight: 500
                  }}
                >
                  [PDF] Unavailable
                </button>
              )}
              
              {/* Save to Library Button */}
              <button 
                onClick={openSave}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  color: '#3E513E',
                  border: '1px solid #3E513E',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                Save to Library
              </button>
              
              {/* Cite Button */}
              <button 
                onClick={openCite}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  color: '#3E513E',
                  border: '1px solid #3E513E',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                Cite
              </button>
            </div>
          </div>

          {/* Right Sidebar - Empty */}
          <div style={{ width: 300 }}>
          </div>
        </div>

        {/* FULL WIDTH TABS SECTION - Outside the maxWidth container */}
        <div style={{ 
          background: '#fff', 
          borderRadius: 0, 
          overflow: 'hidden', 
          marginTop: 40,
          marginLeft: -40,
          marginRight: -40,
          width: 'calc(100% + 80px)'
        }}>
          <div style={{ 
            display: 'flex', 
            borderTop: '1px solid #e0e0e0',
            borderBottom: '1px solid #e0e0e0',
            overflowX: 'auto',
            background: '#fafafa',
            width: '100%'
          }}>
            {tabs.map((tab) => (
              <button 
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '3px solid #3E513E' : '3px solid transparent',
                  color: activeTab === tab.id ? '#3E513E' : '#666',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  minWidth: 0
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ 
            padding: 24,
            maxWidth: 1400,
            margin: '0 auto'
          }}>
            {/* ALWAYS SHOW DETAILS CONTENT */}
            <div 
              ref={detailsSectionRef}
              id="details-section" 
              style={{ marginBottom: activeTab === 'topics' ? 40 : 0 }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#222', marginBottom: 20 }}>Paper Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>DOI</p>
                  <p style={{ fontSize: 14, color: '#333', margin: 0 }}>
                    <a href={`https://doi.org/${paper.doi}`} style={{ color: '#3E513E', textDecoration: 'none' }}>
                      {paper.doi}
                    </a>
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Corpus ID</p>
                  <p style={{ fontSize: 14, color: '#333', margin: 0 }}>{paper.corpusId}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Publication Venue</p>
                  <p style={{ fontSize: 14, color: '#333', margin: 0 }}>{paper.venue}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Year</p>
                  <p style={{ fontSize: 14, color: '#333', margin: 0 }}>{paper.year || 'n.d.'}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Authors</p>
                  <p style={{ fontSize: 14, color: '#333', margin: 0 }}>{(paper.authors || []).length}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Citations</p>
                  <p style={{ fontSize: 14, color: '#333', margin: 0 }}>{paper.citationCount}</p>
                </div>
              </div>
            </div>

            {/* SHOW TOPICS CONTENT BELOW DETAILS WHEN TOPICS TAB IS ACTIVE */}
            {activeTab === 'topics' && (
              <div 
                ref={topicsSectionRef}
                id="topics-section" 
                style={{ borderTop: '1px solid #e0e0e0', paddingTop: 40 }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#222', marginBottom: 20 }}>Topics & Keywords</h3>
                
                {/* Keyword Extraction Status */}
                {keywordsLoading && (
                  <div style={{ 
                    marginBottom: 20,
                    padding: '12px 16px',
                    background: '#f8f9fa',
                    borderRadius: 4,
                    borderLeft: '4px solid #3E513E'
                  }}>
                    <div style={{ fontSize: 14, color: '#3E513E', fontWeight: 500 }}>
                      <span style={{ marginRight: 8 }}>⏳</span>
                      Extracting keywords using AI... This may take a moment.
                    </div>
                  </div>
                )}
                
                {keywordsError && (
                  <div style={{ 
                    marginBottom: 20,
                    padding: '12px 16px',
                    background: '#fdeded',
                    borderRadius: 4,
                    borderLeft: '4px solid #d32f2f'
                  }}>
                    <div style={{ fontSize: 14, color: '#d32f2f', fontWeight: 500, marginBottom: 8 }}>
                      <span style={{ marginRight: 8 }}>⚠️</span>
                      {keywordsError}
                    </div>
                    <button 
                      onClick={extractKeywordsForPaper}
                      style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        color: '#d32f2f',
                        border: '1px solid #d32f2f',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 500
                      }}
                    >
                      Try Again
                    </button>
                  </div>
                )}
                
                {/* Main Keywords */}
                <div style={{ marginBottom: 30 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#444', margin: 0 }}>
                      Extracted Keywords {keywords.length > 0 && `(${keywords.length})`}
                      {usingFallback && <span style={{ fontSize: 11, color: '#666', fontStyle: 'italic', marginLeft: 8 }}>(using fallback)</span>}
                    </h4>
                    
                    {!keywordsLoading && keywords.length === 0 && !keywordsError && (
                      <button 
                        onClick={extractKeywordsForPaper}
                        style={{
                          padding: '6px 12px',
                          background: '#3E513E',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <span>🔍</span>
                        Extract Keywords
                      </button>
                    )}
                  </div>
                  
                  {keywords.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {keywords.map((keyword, idx) => (
                        <button 
                          key={idx}
                          onClick={() => {
                            navigate(`/results?q=${encodeURIComponent(keyword)}`);
                          }}
                          style={{ 
                            background: '#e8f5e9', 
                            color: '#2e7d32', 
                            padding: '6px 12px', 
                            borderRadius: 16, 
                            fontSize: 13,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#c8e6c9'}
                          onMouseLeave={(e) => e.target.style.background = '#e8f5e9'}
                        >
                          {keyword}
                        </button>
                      ))}
                    </div>
                  ) : !keywordsLoading && !keywordsError ? (
                    <div style={{ 
                      padding: '20px',
                      background: '#f8f9fa',
                      borderRadius: 4,
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px 0' }}>
                        No keywords extracted yet. Click "Extract Keywords" to analyze this paper.
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Fields of Study */}
                {paper.fieldsOfStudy && paper.fieldsOfStudy.length > 0 && (
                  <div style={{ marginBottom: 30 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#444', marginBottom: 12 }}>Fields of Study</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {paper.fieldsOfStudy.map((field, idx) => (
                        <button 
                          key={idx}
                          onClick={() => {
                            navigate(`/results?q=${encodeURIComponent(field)}`);
                          }}
                          style={{ 
                            background: '#f3e5f5', 
                            color: '#7b1fa2', 
                            padding: '6px 12px', 
                            borderRadius: 16, 
                            fontSize: 13,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#e1bee7'}
                          onMouseLeave={(e) => e.target.style.background = '#f3e5f5'}
                        >
                          {field}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </div>

      {/* Save Modal */}
      {saveOpen && (
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
                  {paper.title}
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: 12,
                  color: '#666',
                  lineHeight: 1.4 
                }}>
                  {(paper.authors || []).slice(0, 2).map(a => a.name || a).join(', ')} {(paper.authors || []).length > 2 ? '+ others' : ''} • {paper.venue || 'Unknown'} • {paper.year || 'n.d.'}
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
                
                <div style={{ 
                  maxHeight: 200,
                  overflowY: 'auto', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 4 
                }}>
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
                    <>
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
                    </>
                  )}
                </div>
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
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 8 }}>Export</div>
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

                  {copied && <span style={{ color: '#0b8043', fontWeight: 600, fontSize: 13, marginLeft: 8 }}>Copied!</span>}
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

      {/* Floating Chat Button - RIGHT SIDE TOP */}
      {!chatOpen && !paperLoading && !paperError && (
        <button
          onClick={() => setChatOpen(!chatOpen)}
          style={{
            position: 'fixed',
            top: 100,
            right: 24,
            width: 120,
            height: 48,
            borderRadius: 8,
            background: '#3187f1ff',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(62, 81, 62, 0.4)',
            zIndex: 999,
            transition: 'all 0.3s ease',
            letterSpacing: '0.5px'
          }}
          title="Chat with AI"
        >
          AI Chat
        </button>
      )}

      {/* Chat Sidebar - RIGHT SIDE */}
      {!paperLoading && !paperError && (
      <div style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        width: chatOpen ? 380 : 0,
        background: '#fff',
        boxShadow: chatOpen ? '-4px 0 20px rgba(0,0,0,0.15)' : 'none',
        transition: 'width 0.3s ease',
        zIndex: 998,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Chat Header */}
        <div style={{
          padding: '16px 20px',
          background: '#3E513E',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Paper Assistant</h3>
          <button
            onClick={() => setChatOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 18,
              padding: '6px 10px',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              transition: 'all 0.2s ease',
              fontWeight: 'bold'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            title="Close chat"
          >
            ✕
          </button>
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 8
              }}
            >
              <div style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: msg.role === 'user' ? '#3E513E' : '#f0f0f0',
                color: msg.role === 'user' ? '#fff' : '#333',
                fontSize: 13,
                lineHeight: 1.4,
                wordWrap: 'break-word'
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {/* Loading indicator when sending */}
          {isSending && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: 8
            }}>
              <div style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: '12px 12px 12px 4px',
                background: '#f0f0f0',
                color: '#333',
                fontSize: 13,
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#3E513E',
                  animation: 'pulse 1.5s infinite'
                }}></div>
                Thinking...
              </div>
            </div>
          )}
          
          {/* Error message */}
          {chatError && !isSending && (
            <div style={{
              padding: '8px 12px',
              background: '#fdeded',
              color: '#d32f2f',
              fontSize: 12,
              borderRadius: 4,
              margin: '8px 0',
              borderLeft: '3px solid #d32f2f'
            }}>
              {chatError}
            </div>
          )}
          
          {/* Empty div for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: '12px',
          borderTop: '1px solid #e0e0e0',
          background: '#fff',
          display: 'flex',
          gap: 8
        }}>
          <input
            type="text"
            placeholder="Ask about the paper..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
            disabled={isSending || !paper}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 13,
              outline: 'none',
              opacity: isSending || !paper ? 0.7 : 1,
              cursor: isSending || !paper ? 'not-allowed' : 'text'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSending || !paper}
            style={{
              padding: '8px 12px',
              background: (!inputValue.trim() || isSending || !paper) ? '#cccccc' : '#3E513E',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: (!inputValue.trim() || isSending || !paper) ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 500,
              minWidth: 60
            }}
          >
            {isSending ? '...' : 'Send'}
          </button>
        </div>

        {/* Close Chat Button */}
        <div style={{
          padding: '12px',
          borderTop: '1px solid #e0e0e0',
          background: '#f5f5f5',
          textAlign: 'center'
        }}>
          <button
            onClick={() => setChatOpen(false)}
            style={{
              color: '#3E513E',
              cursor: 'pointer',
              fontSize: 13,
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              padding: 0
            }}
          >
            Close
          </button>
        </div>
      </div>
      )}
      
      {/* Add CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </>
  );
};

export default PaperDetails;