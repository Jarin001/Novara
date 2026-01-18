import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const mockFallback = {
  id: 0,
  title: 'An Efficient Approximate Expectation Propagation Detector With Block-Diagonal Neumann-Series',
  authors: ['Huizheng Wang', 'Bingyang Cheng', 'Chuan Zhang'],
  venue: 'IEEE Transactions on Circuits',
  date: 2023,
  snippet: 'A block-diagonal Neumann-series-based expectation propagation approximation (BD-NS-EPA) algorithm is proposed...',
  pdf: true,
  citationCount: 11,
  fields: ['Computer Science', 'Engineering'],
  abstract: 'Expectation propagation (EP) achieves near-optimal performance for large-scale multiple-input multiple-output (L-MIMO) detection, however, at the expense of unaffordable matrix inversions. To tackle the issue, several low-complexity EP detectors have been proposed. However, they all fail to exploit the properties of channel matrices, thus resulting in unsatisfactory performance in non-ideal scenarios. To this end, in this paper, a block-diagonal Neumann-series-based expectation propagation approximation (BD-NS-EPA) algorithm is proposed, which is applicable for both ideal uncorrelated channels and the correlated channels with multiple-antenna user equipment system. First, a block-diagonal-based Neumann iteration is employed, which skillfully exerts the main information of the channels while reducing computational cost. An adjustable sorting message updating scheme then is introduced to reduce the update of redundant nodes during iterations. Numerical results show that, for $128\\times 32$ MIMO with the non-ideal channel, the proposed algorithm exhibits 0.3 dB away from the original EP when bit error-rate (BER) $=10^{-3}$, at the cost of mere 3% normalized complexity. The implementation results on SMIC 65-nm CMOS technology suggest that the proposed detector can achieve 1.252 Gbps/W and 0.275 Mbps/kGE hardware efficiency, further demonstrating that the proposed detectors can achieve a good trade-off between error-rate performance and hardware efficiency.',
  doi: '10.1109/TCSI.2022.3229690',
  corpusId: '256298793',
  highlightedCitations: 2,
  backgroundCitations: 2,
  methodsCitations: 2,
};

// Helper functions for citation formatting
const getCitationText = (item, format) => {
  if (!item) return '';
  const authors = (item.authors || []).join(' and ');
  const year = typeof item.date === 'number' ? item.date : (new Date(item.date).getFullYear() || 'n.d.');

  if (format === 'BibTeX') {
    const key = `${(item.authors && item.authors[0] || 'author').replace(/\s+/g,'')}${year}`;
    return `@inproceedings{${key},\n  title={${item.title}},\n  author={${authors}},\n  booktitle={${item.venue}},\n  year={${year}},\n}`;
  }

  if (format === 'MLA') {
    return `${(item.authors || []).join(', ')}. "${item.title}." ${item.venue}, ${year}.`;
  }

  if (format === 'APA') {
    return `${(item.authors || []).join(', ')} (${year}). ${item.title}. ${item.venue}.`;
  }

  if (format === 'IEEE') {
    return `[1] ${(item.authors || []).join(', ')}, "${item.title}," ${item.venue}, ${year}.`;
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

// Mock libraries data
const availableLibraries = [
  "My Research Papers",
  "Biology Collection",
  "Environmental Studies",
  "COVID-19 Research",
  "Team Dynamics",
  "Vaccination Studies",
  "Medical Papers",
  "Sociology Collection",
];

const PaperDetails = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const paper = (loc.state && loc.state.paper) || mockFallback;
  
  // State for existing features
  const [chatOpen, setChatOpen] = useState(false);
  const [abstractExpanded, setAbstractExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I can help you understand this paper better. What would you like to know?' }
  ]);
  const [inputValue, setInputValue] = useState('');

  // State for Save and Cite modals
  const [saveOpen, setSaveOpen] = useState(false);
  const [selectedLibraries, setSelectedLibraries] = useState([]);
  const [citeOpen, setCiteOpen] = useState(false);
  const [citeFormat, setCiteFormat] = useState('BibTeX');
  const [copied, setCopied] = useState(false);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const newMessages = [
      ...messages,
      { role: 'user', text: inputValue }
    ];
    
    // Simulate bot response
    setTimeout(() => {
      newMessages.push({
        role: 'bot',
        text: 'I understand. Based on the paper, I can tell you that this research focuses on the key concepts mentioned in the abstract. Would you like me to elaborate on any specific section?'
      });
      setMessages([...newMessages]);
    }, 500);
    
    setMessages(newMessages);
    setInputValue('');
  };

  // Save modal functions
  const openSave = () => {
    setSelectedLibraries([]);
    setSaveOpen(true);
  };

  const closeSave = () => {
    setSaveOpen(false);
    setSelectedLibraries([]);
  };

  const handleSaveToLibraries = () => {
    console.log(`Saving paper "${paper.title}" to libraries:`, selectedLibraries);
    closeSave();
  };

  const toggleLibrarySelection = (library) => {
    setSelectedLibraries(prev => 
      prev.includes(library) 
        ? prev.filter(l => l !== library)
        : [...prev, library]
    );
  };

  // Citation modal functions
  const openCite = () => {
    setCiteFormat('BibTeX');
    setCiteOpen(true);
    setCopied(false);
  };

  const closeCite = () => {
    setCiteOpen(false);
    setCopied(false);
  };

  const copyCitation = async () => {
    const txt = getCitationText(paper, citeFormat);
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(()=>setCopied(false), 1600);
    } catch (e) {
      const el = document.getElementById('cite-textarea');
      if (el) {
        el.select();
        try { document.execCommand('copy'); setCopied(true); setTimeout(()=>setCopied(false),1600); } catch(_){}
      }
    }
  };

  const downloadBibTeX = () => {
    const content = getCitationText(paper, 'BibTeX');
    const name = sanitizeFilename(paper.title) + '.bib';
    downloadFile(name, content, 'application/x-bibtex');
  };

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'topics', label: 'Topics' },
    { id: 'citations', label: `${paper.citationCount} Citations`, isNavigation: true, path: '/citations' },
    { id: 'references', label: '47 References', isNavigation: true, path: '/references' },
    { id: 'related', label: 'Related Papers', isNavigation: true, path: '/related' },
  ];

  const handleTabClick = (tab) => {
    if (tab.isNavigation && tab.path) {
      navigate(tab.path, { state: { paper: paper } });
    } else {
      setActiveTab(tab.id);
    }
  };

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
        
        {/* Main Content Container */}
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
                {paper.authors.map((author, idx) => (
                  <React.Fragment key={idx}>
                    <span 
                      style={{ 
                        color: '#3E513E', 
                        cursor: 'pointer',
                        textDecoration: 'none',
                        fontSize: 14
                      }}
                    >
                      {author}
                    </span>
                    {idx < paper.authors.length - 1 && <span style={{ margin: '0 4px', color: '#666' }}>·</span>}
                  </React.Fragment>
                ))}
                {paper.authors.length > 0 && <span style={{ color: '#999', fontSize: 13 }}>+2 authors</span>}
              </div>
              
              <div style={{ color: '#999', fontSize: 13 }}>
                <span>Published in <a href="#" style={{ color: '#3E513E', textDecoration: 'none' }}>{paper.venue}</a></span>
                <span style={{ margin: '0 8px' }}>·</span>
                <span>{paper.date}</span>
                <span style={{ margin: '0 8px' }}>·</span>
                <span><a href="#" style={{ color: '#3E513E', textDecoration: 'none' }}>Computer Science, Engineering</a></span>
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
                {abstractExpanded ? (paper.abstract || paper.snippet) : (paper.abstract || paper.snippet).substring(0, 200) + '...'}
              </p>
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
                }}>
                {abstractExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
              <button 
                onClick={openSave}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  color: '#3E513E',
                  border: '1px solid #d0d0d0',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500
                }}>
                Save to Library
              </button>
              <button 
                onClick={openCite}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  color: '#3E513E',
                  border: '1px solid #d0d0d0',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500
                }}>
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
          {/* Tabs Header - Full Width, Equally Spaced */}
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
            <div id="details-section" style={{ marginBottom: activeTab === 'topics' ? 40 : 0 }}>
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
                  <p style={{ fontSize: 14, color: '#333', margin: 0 }}>{paper.date}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Authors</p>
                  <p style={{ fontSize: 14, color: '#333', margin: 0 }}>{paper.authors.length}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Citations</p>
                  <p style={{ fontSize: 14, color: '#333', margin: 0 }}>{paper.citationCount}</p>
                </div>
              </div>
            </div>

            {/* SHOW TOPICS CONTENT BELOW DETAILS WHEN TOPICS TAB IS ACTIVE */}
            {activeTab === 'topics' && (
              <div id="topics-section" style={{ borderTop: '1px solid #e0e0e0', paddingTop: 40 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#222', marginBottom: 20 }}>Topics</h3>
                
                {/* Main Topics */}
                <div style={{ marginBottom: 30 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#444', marginBottom: 12 }}>Main Topics</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '6px 12px', borderRadius: 16, fontSize: 13 }}>
                      Signal Processing
                    </span>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '6px 12px', borderRadius: 16, fontSize: 13 }}>
                      MIMO Systems
                    </span>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '6px 12px', borderRadius: 16, fontSize: 13 }}>
                      Expectation Propagation
                    </span>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '6px 12px', borderRadius: 16, fontSize: 13 }}>
                      Wireless Communication
                    </span>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '6px 12px', borderRadius: 16, fontSize: 13 }}>
                      Hardware Efficiency
                    </span>
                  </div>
                </div>

                {/* Related Topics */}
                <div style={{ marginBottom: 30 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#444', marginBottom: 12 }}>Related Topics</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ background: '#f3e5f5', color: '#7b1fa2', padding: '6px 12px', borderRadius: 16, fontSize: 13 }}>
                      Machine Learning
                    </span>
                    <span style={{ background: '#f3e5f5', color: '#7b1fa2', padding: '6px 12px', borderRadius: 16, fontSize: 13 }}>
                      Numerical Methods
                    </span>
                    <span style={{ background: '#f3e5f5', color: '#7b1fa2', padding: '6px 12px', borderRadius: 16, fontSize: 13 }}>
                      Matrix Computations
                    </span>
                    <span style={{ background: '#f3e5f5', color: '#7b1fa2', padding: '6px 12px', borderRadius: 16, fontSize: 13 }}>
                      Communication Theory
                    </span>
                    <span style={{ background: '#f3e5f5', color: '#7b1fa2', padding: '6px 12px', borderRadius: 16, fontSize: 13 }}>
                      VLSI Design
                    </span>
                  </div>
                </div>

                {/* Topic Distribution */}
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#444', marginBottom: 12 }}>Topic Distribution</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#555' }}>Signal Processing</span>
                        <span style={{ fontSize: 13, color: '#777' }}>85%</span>
                      </div>
                      <div style={{ height: 6, background: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: '85%', height: '100%', background: '#3E513E', borderRadius: 3 }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#555' }}>MIMO Systems</span>
                        <span style={{ fontSize: 13, color: '#777' }}>72%</span>
                      </div>
                      <div style={{ height: 6, background: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: '72%', height: '100%', background: '#3E513E', borderRadius: 3 }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#555' }}>Wireless Communication</span>
                        <span style={{ fontSize: 13, color: '#777' }}>68%</span>
                      </div>
                      <div style={{ height: 6, background: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: '68%', height: '100%', background: '#3E513E', borderRadius: 3 }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#555' }}>Hardware Efficiency</span>
                        <span style={{ fontSize: 13, color: '#777' }}>45%</span>
                      </div>
                      <div style={{ height: 6, background: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: '45%', height: '100%', background: '#3E513E', borderRadius: 3 }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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
                  {paper.authors.join(', ')} • {paper.venue} • {paper.date}
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
                
                <div style={{ 
                  maxHeight: 200,
                  overflowY: 'auto', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 4 
                }}>
                  {availableLibraries.map((library, index) => (
                    <label
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderBottom: index < availableLibraries.length - 1 ? '1px solid #f0f0f0' : 'none',
                        cursor: 'pointer',
                        backgroundColor: selectedLibraries.includes(library) ? '#f0f7f0' : 'transparent',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLibraries.includes(library)}
                        onChange={() => toggleLibrarySelection(library)}
                        style={{ marginRight: 10 }}
                      />
                      <span style={{ fontSize: 13, color: '#333' }}>{library}</span>
                    </label>
                  ))}
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
              {/* Format tabs */}
              <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e0e0e0', marginBottom: 20 }}>
                {['BibTeX', 'MLA', 'APA', 'IEEE'].map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setCiteFormat(fmt)}
                    style={{
                      padding: '12px 16px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: citeFormat === fmt ? '3px solid #3E513E' : '3px solid transparent',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: citeFormat === fmt ? 600 : 500,
                      color: citeFormat === fmt ? '#3E513E' : '#666'
                    }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {/* Citation text box */}
              <div style={{ marginBottom: 20 }}>
                <textarea
                  id="cite-textarea"
                  readOnly
                  value={getCitationText(paper, citeFormat)}
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
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button - RIGHT SIDE TOP */}
      {!chatOpen && (
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
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 13,
              outline: 'none'
            }}
          />
          <button
            onClick={handleSendMessage}
            style={{
              padding: '8px 12px',
              background: '#3E513E',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500
            }}
          >
            Send
          </button>
        </div>

        {/* Close Chat Button */}
        <div style={{
          padding: '12px',
          borderTop: '1px solid #e0e0e0',
          background: '#f5f5f5',
          textAlign: 'center'
        }}>
          <a
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
          </a>
        </div>
      </div>
    </>
  );
};

export default PaperDetails;