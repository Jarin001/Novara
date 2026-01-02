import React, { useMemo, useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useLocation, useNavigate } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const mockResults = (q) => {
  const sample = [
    {
      id: 1,
      title: `Exploring the role of vocalizations in regulating ${q}`,
      authors: ["Bing Xie", "J. B. Brask", "T. Dabelsteen"],
      venue: "Philosophical Transactions B",
      date: 2024,
      snippet:
        "The role that vocalizations play in (i) collective movement, (ii) separation risk and cohesion maintenance, (iii) fission–fusion dynamics, and (iv) social networks are reviewed.",
      pdf: true,
      citationCount: 18,
      fields: ["Biology", "Environmental Science"],
    },
    {
      id: 2,
      title: `${q} when battling a pandemic`,
      authors: ["C. Parks"],
      venue: "Sociology",
      date: 2020,
      snippet:
        "This special issue presents six articles that address aspects of how group dynamics and processes have been impacted by, and have the potential to impact, the SARS-CoV-2 pandemic.",
      pdf: false,
      citationCount: 4,
      fields: ["Sociology"],
    },
    {
      id: 3,
      title: `${q} for Teams`,
      authors: ["D. Levi"],
      venue: "Business, Psychology",
      date: 2020,
      snippet:
        "PART I: CHARACTERISTICS OF TEAMS Chapter 1: Understanding Teams Chapter 2: Defining Team Success...",
      pdf: false,
      citationCount: 2,
      fields: ["Economics"],
    },
    {
      id: 4,
      title: `Vaccination rollout and ${q}`,
      authors: ["Y. Bergeron"],
      venue: "Nature",
      date: 2008,
      snippet: "A long-term study of pandemic response and the role of vaccination programs.",
      pdf: true,
      citationCount: 180,
      fields: ["Medicine", "Biology"],
    },
  ];
  return sample;
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

const ResultsPage = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const q = query.get("q") || "";
  const type = query.get("type") || "publications";
  const [selectedFields, setSelectedFields] = useState([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [dateRange, setDateRange] = useState([1931, 2026]);
  const [openFields, setOpenFields] = useState(false);
  const [openDate, setOpenDate] = useState(false);

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

  const results = mockResults(q);

  const visible = useMemo(() => {
    let list = results.slice();

    if (selectedFields.length) {
      list = list.filter((r) => r.fields && r.fields.some(f => selectedFields.includes(f)));
    }

    if (dateRange && dateRange.length === 2) {
      const [minY, maxY] = dateRange;
      list = list.filter((r) => {
        const year = typeof r.date === 'number' ? r.date : (new Date(r.date).getFullYear() || 0);
        return year >= minY && year <= maxY;
      });
    }

    if (sortBy === 'citations') {
      list.sort((a,b)=> (b.citationCount || 0) - (a.citationCount || 0));
    }

    return list;
  }, [results, selectedFields, dateRange, sortBy]);

  const availableFields = [
    "Environmental Science",
    "Medicine",
    "Biology",
    "Agricultural and Food Sciences",
    "Economics",
    "Sociology",
    "Engineering",
    "Computer Science",
    "History",
    "Geography",
  ];

  const availableAuthors = [
    "Yves Bergeron",
    "Hans Pretzsch",
    "Jesús Julio Camarero",
    "Christoph Leuschner",
    "Yang Liu",
    "Wei Zhang",
  ];

  const onHeaderSearch = (e) => {
    e && e.preventDefault && e.preventDefault();
    const val = e.target.elements["headerSearch"].value || "";
    navigate(`/search?q=${encodeURIComponent(val)}&type=${encodeURIComponent(type)}`);
  };

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

  const authorMatches = availableAuthors.filter(a => {
    if (!q) return true;
    return a.toLowerCase().includes(q.toLowerCase());
  });

  const total = 15300000;

  return (
    <>
      <Navbar />

      <div style={{ paddingTop: 100, paddingLeft: 40, paddingRight: 40 }}>
        <form onSubmit={onHeaderSearch} style={{ display: "flex", maxWidth: 920, marginBottom: 18 }}>
          <input
            name="headerSearch"
            defaultValue={q}
            placeholder="Search for articles..."
            style={{ flex: 1, padding: "10px 12px", border: "1px solid #ddd", borderRadius: 4 }}
          />
          <button style={{ marginLeft: 8, padding: "8px 14px", background: "#3E513E", color: "#fff", border: "1px solid #3E513E", cursor: "pointer" }}>
            Search
          </button>
        </form>

        <h3 style={{ marginTop: 8, marginBottom: 12, fontSize: 16, fontWeight: 500, color: '#333' }}>
          {type === 'authors'
            ? `About ${authorMatches.length} authors for "${q}"`
            : `About ${total.toLocaleString()} results for "${q}"`}
        </h3>

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
          {type === 'authors' ? (
            <>
              {authorMatches.map((a, i) => (
                <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid #eee", display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button
                      onClick={() => navigate(`/search?q=${encodeURIComponent(a)}&type=publications`)}
                      style={{
                        color: "#3E513E",
                        fontSize: 16,
                        fontWeight: 600,
                        textDecoration: "none",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        textAlign: "left",
                      }}
                    >
                      {a}
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
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

                  <p style={{ marginTop: 10, color: "#444" }}>{r.snippet} <a href="#" style={{ color: "#3E513E" }}>Expand</a></p>

                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
                    <span style={{ color: "#888" }}>Save</span>
                    <button onClick={() => openCite(r)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>Cite</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
          <button style={{ padding: "4px 8px", fontSize: 12 }}>{"←"}</button>
          <button style={{ padding: "4px 8px", background: "#3E513E", color: "#fff", fontSize: 12 }}>1</button>
          <button style={{ padding: "4px 8px", fontSize: 12 }}>2</button>
          <button style={{ padding: "4px 8px", fontSize: 12 }}>3</button>
          <button style={{ padding: "4px 8px", fontSize: 12 }}>4</button>
          <button style={{ padding: "4px 8px", fontSize: 12 }}>{"→"}</button>
        </div>

        {/* Citation Modal */}
        {citeOpen && citeItem && (
          <div style={{ 
            position: 'fixed', 
            top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.5)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 1000 
          }}>
            <div style={{ 
              width: '580px', maxWidth: '90vw', 
              background: '#fff', borderRadius: 8, 
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)', overflow: 'hidden' 
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e0e0e0' }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#333' }}>Cite Paper</h2>
                <button onClick={closeCite} style={{ width: 40, height: 40, borderRadius: 20, background: '#3E513E', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
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
      </div>
    </>
  );
};

export default ResultsPage;
