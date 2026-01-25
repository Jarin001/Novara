import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const CitationModal = ({ 
  isOpen, 
  onClose, 
  paper,
  API_BASE_URL = "http://localhost:5000"
}) => {
  const [citeFormats, setCiteFormats] = useState([]);
  const [citeFormat, setCiteFormat] = useState('bibtex');
  const [copied, setCopied] = useState(false);
  
  // Use refs to track state without causing re-renders
  const hasFetchedOtherFormats = useRef(false);
  const isFetchingOtherFormats = useRef(false);
  const otherFormatsCache = useRef([]); // Cache for other formats

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCiteFormats([]);
      setCiteFormat('bibtex');
      setCopied(false);
      hasFetchedOtherFormats.current = false;
      isFetchingOtherFormats.current = false;
      otherFormatsCache.current = [];
      return;
    }

    // Initialize with BibTeX from paper and placeholder tabs for other formats
    if (paper?.bibtex) {
      // Create initial formats with BibTeX (real) and placeholders for others
      const initialFormats = [{
        id: 'bibtex',
        label: 'BibTeX',
        value: paper.bibtex,
        isLoaded: true
      }];
      
      // Add placeholder tabs for other formats
      const placeholderFormats = [
        { id: 'mla', label: 'MLA', value: '', isLoaded: false },
        { id: 'apa', label: 'APA', value: '', isLoaded: false },
        { id: 'ieee', label: 'IEEE', value: '', isLoaded: false }
      ];
      
      setCiteFormats([...initialFormats, ...placeholderFormats]);
      setCiteFormat('bibtex');
    }

    // Fetch other formats silently in background
    if (isOpen && paper?.s2PaperId && !hasFetchedOtherFormats.current && !isFetchingOtherFormats.current) {
      fetchOtherFormats();
    }
  }, [isOpen, paper?.s2PaperId]);

  const fetchOtherFormats = async () => {
    if (!paper?.s2PaperId || hasFetchedOtherFormats.current || isFetchingOtherFormats.current) return;
    
    isFetchingOtherFormats.current = true;
    
    try {
      console.log(`Fetching other citation formats for paper: ${paper.s2PaperId}`);
      const response = await fetch(`${API_BASE_URL}/api/citations/${paper.s2PaperId}`);
      
      if (response.ok) {
        const data = await response.json();
        const formats = data.data || [];
        console.log("Other citation formats fetched:", formats);
        
        // Cache the fetched formats
        otherFormatsCache.current = formats.filter(f => f.id !== 'bibtex');
        
        // Update the citeFormats with loaded content
        setCiteFormats(prev => {
          return prev.map(format => {
            // Find matching format in fetched data
            const fetchedFormat = otherFormatsCache.current.find(f => f.id === format.id);
            if (fetchedFormat) {
              return {
                ...format,
                value: fetchedFormat.value,
                isLoaded: true
              };
            }
            return format;
          });
        });
        
        hasFetchedOtherFormats.current = true;
      }
    } catch (error) {
      console.error("Error fetching other formats:", error);
      
      // If fetch fails, generate local versions
      generateLocalFormats();
    } finally {
      isFetchingOtherFormats.current = false;
    }
  };

  const generateLocalFormats = () => {
    if (!paper) return;
    
    const localFormats = [
      {
        id: 'mla',
        label: 'MLA',
        value: getCitationText(paper, 'MLA'),
        isLoaded: true
      },
      {
        id: 'apa',
        label: 'APA',
        value: getCitationText(paper, 'APA'),
        isLoaded: true
      },
      {
        id: 'ieee',
        label: 'IEEE',
        value: getCitationText(paper, 'IEEE'),
        isLoaded: true
      }
    ];
    
    setCiteFormats(prev => {
      return prev.map(format => {
        const localFormat = localFormats.find(f => f.id === format.id);
        if (localFormat) {
          return {
            ...format,
            value: localFormat.value,
            isLoaded: true
          };
        }
        return format;
      });
    });
    
    hasFetchedOtherFormats.current = true;
  };

  const copyCitation = async () => {
    let txt = '';
    
    // Try to get citation from formats
    if (citeFormats && citeFormats.length > 0) {
      const selectedFormat = citeFormats.find(f => f.id === citeFormat);
      if (selectedFormat && selectedFormat.isLoaded) {
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
        try { 
          document.execCommand('copy'); 
          setCopied(true); 
          setTimeout(() => setCopied(false), 1600); 
        } catch(_) {}
      }
    }
  };

  const downloadBibTeX = () => {
    let content = '';
    
    // Try to get BibTeX from formats
    const bibtexFormat = citeFormats.find(f => f.id === 'bibtex');
    if (bibtexFormat && bibtexFormat.isLoaded) {
      content = bibtexFormat.value || '';
    }
    
    // Fallback to local generation if not available
    if (!content && paper) {
      content = getCitationText(paper, 'BibTeX');
    }
    
    const name = sanitizeFilename(paper?.title || 'paper') + '.bib';
    const blob = new Blob([content], { type: 'application/x-bibtex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const getCitationText = (item, format) => {
    if (!item) return '';
    const authors = (item.authors || []).map(a => typeof a === 'object' ? a.name || a : a || '').join(' and ');
    const year = item.year || 'n.d.';

    if (format === 'BibTeX' || format === 'bibtex') {
      const key = `${(item.authors && item.authors[0] && (typeof item.authors[0] === 'object' ? item.authors[0].name : item.authors[0] || '').replace(/\s+/g,'')) || 'author'}${year}`;
      return `@inproceedings{${key},\n  title={${item.title}},\n  author={${authors}},\n  booktitle=${item.venue || 'Unknown'},\n  year={${year}},\n}`;
    }

    if (format === 'MLA') {
      return `${(item.authors || []).map(a => typeof a === 'object' ? a.name || a : a || '').join(', ')}. "${item.title}." ${item.venue || 'Unknown'}, ${year}.`;
    }

    if (format === 'APA') {
      return `${(item.authors || []).map(a => typeof a === 'object' ? a.name || a : a || '').join(', ')} (${year}). ${item.title}. ${item.venue || 'Unknown'}.`;
    }

    if (format === 'IEEE') {
      return `[1] ${(item.authors || []).map(a => typeof a === 'object' ? a.name || a : a || '').join(', ')}, "${item.title}", ${item.venue || 'Unknown'}, ${year}.`;
    }

    return '';
  };

  const sanitizeFilename = (s = '') => {
    return s.replace(/[^a-z0-9\.\-\_]/gi, '-').slice(0, 120);
  };

  const getSelectedFormat = () => {
    return citeFormats.find(f => f.id === citeFormat);
  };

  if (!isOpen) return null;

  const selectedFormat = getSelectedFormat();

  return (
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
            onClick={onClose} 
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
          {citeFormats.length > 0 && (
            <>
              {/* Format tabs - ALL BLACK, ALL CLICKABLE */}
              <div style={{ 
                display: 'flex', 
                gap: 0, 
                borderBottom: '1px solid #e0e0e0', 
                marginBottom: 20, 
                overflowX: 'auto'
              }}>
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
                      color: citeFormat === fmt.id ? '#3E513E' : '#666', // ALWAYS BLACK (or green when active)
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {fmt.label || fmt.id}
                  </button>
                ))}
              </div>

              {/* Citation display area - Show content or loading state */}
              <div style={{ marginBottom: 20, minHeight: '200px' }}>
                {selectedFormat && !selectedFormat.isLoaded ? (
                  // Show loading state ONLY when content is not loaded yet
                  <div style={{
                    width: '100%',
                    height: 200,
                    padding: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fafafa',
                    border: '1px solid #d0d0d0',
                    borderRadius: 4,
                    color: '#666',
                    fontSize: 14
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#3E513E',
                        animation: 'pulse 1.5s infinite'
                      }}></div>
                      Loading {selectedFormat.label} format...
                    </div>
                  </div>
                ) : citeFormat === 'bibtex' ? (
                  // Show BibTeX textarea
                  <textarea
                    id="cite-textarea"
                    readOnly
                    value={selectedFormat?.value || ''}
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
                  // Show HTML content for other formats
                  <div
                    id="cite-html"
                    style={{
                      width: '100%',
                      minHeight: 200,
                      padding: 12,
                      fontSize: 12,
                      border: '1px solid #d0d0d0',
                      borderRadius: 4,
                      background: '#fafafa',
                      overflowY: 'auto'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: selectedFormat?.value || ''
                    }}
                  />
                )}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#e0e0e0', marginBottom: 20 }} />

              {/* Copy and Export - Always enabled for BibTeX, conditionally for others */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Export / BibTeX on the left - Always enabled */}
                <div>
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

                {/* Copy button on the right - Enabled only if format is loaded */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={copyCitation}
                    disabled={!selectedFormat?.isLoaded}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'transparent',
                      border: 'none',
                      color: selectedFormat?.isLoaded ? '#3E513E' : '#cccccc',
                      cursor: selectedFormat?.isLoaded ? 'pointer' : 'not-allowed',
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
          
          {citeFormats.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
              No citation formats available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

CitationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  paper: PropTypes.shape({
    s2PaperId: PropTypes.string,
    bibtex: PropTypes.string,
    title: PropTypes.string,
    authors: PropTypes.array,
    venue: PropTypes.string,
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  API_BASE_URL: PropTypes.string,
};

CitationModal.defaultProps = {
  API_BASE_URL: "http://localhost:5000",
};

export default CitationModal;

<style>{`
  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
`}</style>