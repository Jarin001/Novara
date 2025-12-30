import React, { useMemo, useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

// Mock citations data
const mockCitations = (paperTitle) => {
  return [
    {
      id: 101,
      title: 'Advanced Signal Processing Techniques for MIMO Systems',
      authors: ['Alice Johnson', 'Bob Smith'],
      venue: 'IEEE Transactions on Signal Processing',
      date: 2024,
      snippet: `This paper builds upon the block-diagonal Neumann-series approach for efficient MIMO detection proposed in "${paperTitle}"...`,
      pdf: true,
      citationCount: 5,
      fields: ['Signal Processing', 'Communications'],
    },
    {
      id: 102,
      title: 'Low-Complexity Detection Methods for Massive MIMO',
      authors: ['Carol White', 'David Brown'],
      venue: 'Journal of Communications',
      date: 2024,
      snippet: `We compare several low-complexity approaches including the BD-NS-EPA algorithm from "${paperTitle}"...`,
      pdf: false,
      citationCount: 3,
      fields: ['Communications'],
    },
    {
      id: 103,
      title: 'Hardware-Efficient MIMO Receivers',
      authors: ['Eve Wilson'],
      venue: 'IEEE Circuits and Systems Magazine',
      date: 2023,
      snippet: `Recent advances in hardware-efficient detector design leverage block-diagonal approximations as described in "${paperTitle}"...`,
      pdf: true,
      citationCount: 8,
      fields: ['Hardware Design', 'Communications'],
    },
    {
      id: 104,
      title: 'Neumann-Series Based Detection in 5G Networks',
      authors: ['Frank Miller', 'Grace Lee'],
      venue: '5G Communications Symposium',
      date: 2024,
      snippet: `Implementation of block-diagonal Neumann-series detectors for 5G base stations based on "${paperTitle}"...`,
      pdf: true,
      citationCount: 12,
      fields: ['5G', 'Communications'],
    },
    {
      id: 105,
      title: 'Expectation Propagation Variants for Large-Scale Systems',
      authors: ['Henry Taylor'],
      venue: 'Machine Learning for Signal Processing',
      date: 2023,
      snippet: `Survey of expectation propagation methods including the BD-NS-EPA algorithm from "${paperTitle}"...`,
      pdf: false,
      citationCount: 7,
      fields: ['Machine Learning', 'Signal Processing'],
    },
    {
      id: 106,
      title: 'ASIC Implementation of MIMO Detectors',
      authors: ['Irene Clark', 'Jack Nelson'],
      venue: 'IEEE Journal of Solid-State Circuits',
      date: 2024,
      snippet: `Hardware implementation results of various MIMO detectors including the proposed BD-NS-EPA from "${paperTitle}"...`,
      pdf: true,
      citationCount: 15,
      fields: ['Hardware Design', 'ASIC'],
    },
    {
      id: 107,
      title: 'Energy-Efficient Baseband Processing',
      authors: ['Karen Wright'],
      venue: 'Green Communications Conference',
      date: 2023,
      snippet: `Analysis of energy consumption in MIMO detectors with focus on block-diagonal approaches from "${paperTitle}"...`,
      pdf: true,
      citationCount: 4,
      fields: ['Energy Efficiency', 'Communications'],
    },
    {
      id: 108,
      title: 'Performance Analysis of Approximate MIMO Detectors',
      authors: ['Leo Adams', 'Mona Scott'],
      venue: 'IEEE Transactions on Wireless Communications',
      date: 2024,
      snippet: `Theoretical analysis of error-rate performance in approximate detectors including BD-NS-EPA from "${paperTitle}"...`,
      pdf: false,
      citationCount: 9,
      fields: ['Theoretical Analysis', 'Communications'],
    },
  ];
};

const CitationsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const paper = location.state?.paper || {
    title: 'An Efficient Approximate Expectation Propagation Detector With Block-Diagonal Neumann-Series',
    citationCount: 11
  };
  
  const [selectedFields, setSelectedFields] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [dateRange, setDateRange] = useState([2020, 2026]);
  const [openFields, setOpenFields] = useState(false);
  const [openDate, setOpenDate] = useState(false);
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

  const results = mockCitations(paper.title);

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
    "Signal Processing",
    "Communications",
    "Hardware Design",
    "Machine Learning",
    "5G",
    "Energy Efficiency",
    "Theoretical Analysis",
    "ASIC",
  ];

  const total = 125; // Mock total number of citations

  const onHeaderSearch = (e) => {
    e && e.preventDefault && e.preventDefault();
    const val = e.target.elements["headerSearch"].value || "";
    navigate(`/search?q=${encodeURIComponent(val)}&type=publications`);
  };

  return (
    <>
      <Navbar />

      <div style={{ paddingTop: 100, paddingLeft: 40, paddingRight: 40 }}>
        {/* Header showing which paper's citations we're viewing */}
        <div style={{ marginBottom: 24 }}>
          <button 
            onClick={() => navigate(-1)}
            style={{
              color: '#1a73e8',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            ← Back to paper
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#333', marginBottom: 8 }}>
            Citations for: {paper.title}
          </h2>
          <p style={{ color: '#666', fontSize: 14 }}>
            Showing papers that cite this work
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
                onClick={() => navigate('/paper', { state: { paper: r } })}
                style={{ 
                  color: "#1a73e8", 
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

              <p style={{ marginTop: 10, color: "#444" }}>{r.snippet} <a href="#">Expand</a></p>

              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
                <span style={{ color: "#888" }}>Save</span>
                <button style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>Cite</button>
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
          <button style={{ padding: "4px 8px", background: "#1a73e8", color: "#fff", fontSize: 12 }}>1</button>
          <button style={{ padding: "4px 8px", fontSize: 12 }}>2</button>
          <button style={{ padding: "4px 8px", fontSize: 12 }}>3</button>
          <button style={{ padding: "4px 8px", fontSize: 12 }}>4</button>
          <button style={{ padding: "4px 8px", fontSize: 12 }}>{"→"}</button>
        </div>
      </div>
    </>
  );
};

export default CitationsPage;