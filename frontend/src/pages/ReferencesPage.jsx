import React, { useMemo, useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

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

// Mock references data
const mockReferences = (paperTitle) => {
  return [
    {
      id: 201,
      title: 'Expectation Propagation Algorithms for MIMO Detection',
      authors: ['Frank Miller', 'Grace Lee'],
      venue: 'IEEE Transactions on Wireless Communications',
      date: 2020,
      snippet: `A foundational paper on expectation propagation methods for MIMO detection systems that ${paperTitle} builds upon...`,
      pdf: true,
      citationCount: 45,
      fields: ['MIMO', 'Detection'],
    },
    {
      id: 202,
      title: 'Neumann Series Approximations for Matrix Inversion',
      authors: ['Henry Davis'],
      venue: 'Journal of Numerical Analysis',
      date: 2019,
      snippet: `This paper provides theoretical foundations for Neumann series-based approximations used in ${paperTitle}...`,
      pdf: true,
      citationCount: 28,
      fields: ['Numerical Methods'],
    },
    {
      id: 203,
      title: 'Block-Diagonal Preconditioners in Signal Processing',
      authors: ['Isabel Martinez', 'Jack Taylor'],
      venue: 'Signal Processing Review',
      date: 2021,
      snippet: `Block-diagonal structures are exploited for efficient computation in signal processing as applied in ${paperTitle}...`,
      pdf: false,
      citationCount: 17,
      fields: ['Signal Processing'],
    },
    {
      id: 204,
      title: 'Hardware Implementation of MIMO Detectors',
      authors: ['Kevin Anderson'],
      venue: 'IEEE Design & Test',
      date: 2020,
      snippet: `A comprehensive review of hardware-efficient MIMO detector implementations relevant to ${paperTitle}...`,
      pdf: true,
      citationCount: 32,
      fields: ['Hardware', 'MIMO'],
    },
    {
      id: 205,
      title: 'Massive MIMO Detection: Algorithms and Architectures',
      authors: ['Linda Wilson', 'Michael Brown'],
      venue: 'IEEE Communications Surveys & Tutorials',
      date: 2022,
      snippet: `Survey of detection algorithms for massive MIMO systems including approaches similar to ${paperTitle}...`,
      pdf: true,
      citationCount: 58,
      fields: ['Survey', 'MIMO'],
    },
    {
      id: 206,
      title: 'Low-Complexity Signal Processing for 5G',
      authors: ['Nancy Clark'],
      venue: '5G Signal Processing Conference',
      date: 2021,
      snippet: `Discussion of low-complexity algorithms for 5G systems, relevant to the approach in ${paperTitle}...`,
      pdf: false,
      citationCount: 23,
      fields: ['5G', 'Signal Processing'],
    },
    {
      id: 207,
      title: 'ASIC Design for Wireless Communications',
      authors: ['Oliver Taylor', 'Patricia Harris'],
      venue: 'IEEE Journal of Solid-State Circuits',
      date: 2020,
      snippet: `Hardware design considerations for wireless communication systems as explored in ${paperTitle}...`,
      pdf: true,
      citationCount: 41,
      fields: ['ASIC', 'Hardware Design'],
    },
    {
      id: 208,
      title: 'Energy-Efficient Baseband Processors',
      authors: ['Quincy Roberts'],
      venue: 'IEEE Transactions on Circuits and Systems',
      date: 2021,
      snippet: `Design of energy-efficient baseband processors for wireless systems, a focus of ${paperTitle}...`,
      pdf: true,
      citationCount: 19,
      fields: ['Energy Efficiency', 'Hardware'],
    },
  ];
};

const ReferencesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const paper = location.state?.paper || {
    title: 'An Efficient Approximate Expectation Propagation Detector With Block-Diagonal Neumann-Series',
  };
  
  const [selectedFields, setSelectedFields] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [dateRange, setDateRange] = useState([2010, 2026]);
  const [openFields, setOpenFields] = useState(false);
  const [openDate, setOpenDate] = useState(false);
  
  // Save modal state
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveItem, setSaveItem] = useState(null);
  const [selectedLibraries, setSelectedLibraries] = useState([]);
  
  // Citation modal state
  const [citeOpen, setCiteOpen] = useState(false);
  const [citeItem, setCiteItem] = useState(null);
  const [citeFormat, setCiteFormat] = useState('BibTeX');
  const [copied, setCopied] = useState(false);
  
  const containerRef = useRef(null);

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

  const results = mockReferences(paper.title);

  const visible = useMemo(() => {
    let list = results.slice();

    // Fields filter
    if (selectedFields.length) {
      list = list.filter((r) => r.fields && r.fields.some(f => selectedFields.includes(f)));
    }

    // Date range filter
    if (dateRange && dateRange.length === 2) {
      const [minY, maxY] = dateRange;
      list = list.filter((r) => r.date >= minY && r.date <= maxY);
    }

    // Sorting
    if (sortBy === 'citations') {
      list.sort((a,b)=> (b.citationCount || 0) - (a.citationCount || 0));
    }

    return list;
  }, [results, selectedFields, dateRange, sortBy]);

  const availableFields = [
    "MIMO",
    "Detection",
    "Numerical Methods",
    "Signal Processing",
    "Hardware",
    "Survey",
    "5G",
    "ASIC",
    "Energy Efficiency",
    "Hardware Design",
  ];

  const total = 47; // Mock total number of references

  const onHeaderSearch = (e) => {
    e && e.preventDefault && e.preventDefault();
    const val = e.target.elements["headerSearch"].value || "";
    navigate(`/search?q=${encodeURIComponent(val)}&type=publications`);
  };

  // Save modal functions
  const openSave = (item) => {
    setSaveItem(item);
    setSelectedLibraries([]);
    setSaveOpen(true);
  };

  const closeSave = () => {
    setSaveOpen(false);
    setSaveItem(null);
    setSelectedLibraries([]);
  };

  const handleSaveToLibraries = () => {
    console.log(`Saving paper "${saveItem?.title}" to libraries:`, selectedLibraries);
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
  const openCite = (item) => {
    setCiteItem(item);
    setCiteFormat('BibTeX');
    setCiteOpen(true);
    setCopied(false);
  };

  const closeCite = () => {
    setCiteOpen(false);
    setCiteItem(null);
    setCopied(false);
  };

  const copyCitation = async () => {
    const txt = getCitationText(citeItem, citeFormat);
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

  const downloadBibTeX = (item) => {
    const content = getCitationText(item, 'BibTeX');
    const name = sanitizeFilename((item && item.title) || 'citation') + '.bib';
    downloadFile(name, content, 'application/x-bibtex');
  };

  return (
    <>
      <Navbar />

      <div style={{ paddingTop: 100, paddingLeft: 40, paddingRight: 40 }}>
        {/* Header showing which paper's references we're viewing */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#333', marginBottom: 8 }}>
            References for: {paper.title}
          </h2>
          <p style={{ color: '#666', fontSize: 14 }}>
            Showing papers referenced by this work
          </p>
        </div>

        <h3 style={{ marginTop: 8, marginBottom: 12, fontSize: 16, fontWeight: 500, color: '#333' }}>
          About {total.toLocaleString()} results
        </h3>

        {/* Filters row */}
        <div ref={containerRef} style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center", flexWrap: 'wrap' }}>
          {/* Fields of Study dropdown */}
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

          {/* Date Range dropdown */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setOpenDate(o=>!o); setOpenFields(false); }} style={{ padding: "8px 12px", border: "1px solid #e2e6ea", background: "#fff" }}>Date Range ▾</button>
            {openDate && (
              <div style={{ position: 'absolute', top: 40, left: 0, background: '#fff', border: '1px solid #ddd', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 16, width: 360, zIndex:50, overflow: 'hidden', boxSizing: 'border-box' }}>
                <div style={{ position: 'relative', padding: '6px 0' }}>
                  <input
                    type="range"
                    min={2000}
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
                    min={2000}
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
                onClick={() => navigate('/paper', { state: { paper: r } })}
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
                {r.authors.map((a) => (
                  <span key={a} style={{ background: "#f2f6f8", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}>{a}</span>
                ))}
                <span style={{ color: "#888", fontSize: 13 }}>{r.venue} · {r.date}</span>
              </div>

              <p style={{ marginTop: 10, color: "#444" }}>
                {r.snippet} 
                <a href="#" style={{ color: "#3E513E", marginLeft: 4 }}>Expand</a>
              </p>

              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
                <button onClick={() => openSave(r)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: 0 }}>Save</button>
                <button onClick={() => openCite(r)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: 0 }}>Cite</button>
                <span style={{ marginLeft: 'auto', color: '#666' }}>
                  {r.citationCount} citations
                </span>
                {r.pdf && (
                  <span style={{ color: '#666' }}>
                    
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* pagination */}
        <div style={{ marginTop: 20, display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
          <button style={{ padding: "4px 8px", fontSize: 12 }}>{"←"}</button>
          <button style={{ padding: "4px 8px", background: "#3E513E", color: "#fff", fontSize: 12 }}>1</button>
          <button style={{ padding: "4px 8px", fontSize: 12 }}>2</button>
          <button style={{ padding: "4px 8px", fontSize: 12 }}>3</button>
          <button style={{ padding: "4px 8px", fontSize: 12 }}>4</button>
          <button style={{ padding: "4px 8px", fontSize: 12 }}>{"→"}</button>
        </div>
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
                  {saveItem.authors.join(', ')} • {saveItem.venue} • {saveItem.date}
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
                  value={getCitationText(citeItem, citeFormat)}
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
                      onClick={() => downloadBibTeX(citeItem)}
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
    </>
  );
};

export default ReferencesPage;