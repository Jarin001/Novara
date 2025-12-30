import React, { useMemo, useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

// Mock related papers data
const mockRelatedPapers = (paperTitle) => {
  return [
    {
      id: 301,
      title: 'Improved Expectation Propagation Detectors for Massive MIMO',
      authors: ['Robert Chen', 'Sophia Wang'],
      venue: 'IEEE Transactions on Communications',
      date: 2024,
      snippet: `Building on the work of ${paperTitle}, this paper presents an improved expectation propagation detector with better convergence properties...`,
      pdf: true,
      citationCount: 18,
      fields: ['MIMO', 'Detection'],
    },
    {
      id: 302,
      title: 'Neumann-Series Based Preconditioners for Wireless Systems',
      authors: ['Thomas Brown', 'Emily Davis'],
      venue: 'IEEE Wireless Communications Letters',
      date: 2023,
      snippet: `This work extends the Neumann-series approach from ${paperTitle} to develop efficient preconditioners for wireless communication systems...`,
      pdf: false,
      citationCount: 12,
      fields: ['Numerical Methods', 'Wireless'],
    },
    {
      id: 303,
      title: 'Hardware-Accelerated MIMO Detection Using FPGAs',
      authors: ['Jessica Wilson'],
      venue: 'IEEE Transactions on Circuits and Systems',
      date: 2024,
      snippet: `FPGA implementation of MIMO detection algorithms including approaches similar to ${paperTitle} for improved hardware efficiency...`,
      pdf: true,
      citationCount: 24,
      fields: ['Hardware', 'FPGA'],
    },
    {
      id: 304,
      title: 'Low-Complexity Signal Detection in 6G Systems',
      authors: ['Michael Taylor', 'Sarah Johnson'],
      venue: '6G Communications Workshop',
      date: 2024,
      snippet: `Exploration of low-complexity detection methods for future 6G systems, drawing inspiration from ${paperTitle}...`,
      pdf: true,
      citationCount: 8,
      fields: ['6G', 'Signal Processing'],
    },
    {
      id: 305,
      title: 'Machine Learning Enhanced MIMO Detection',
      authors: ['David Lee', 'Olivia Martinez'],
      venue: 'IEEE Journal on Selected Areas in Communications',
      date: 2023,
      snippet: `Combination of machine learning with traditional detection methods, improving upon algorithms like those in ${paperTitle}...`,
      pdf: false,
      citationCount: 36,
      fields: ['Machine Learning', 'MIMO'],
    },
    {
      id: 306,
      title: 'Energy-Efficient Baseband Processors for 5G NR',
      authors: ['Kevin Smith'],
      venue: 'IEEE Transactions on Very Large Scale Integration Systems',
      date: 2024,
      snippet: `Design of energy-efficient processors for 5G New Radio, building on hardware efficiency concepts from ${paperTitle}...`,
      pdf: true,
      citationCount: 15,
      fields: ['Energy Efficiency', '5G'],
    },
    {
      id: 307,
      title: 'Block-Diagonal Matrix Methods in Signal Processing',
      authors: ['Lisa Anderson', 'Paul White'],
      venue: 'Signal Processing Magazine',
      date: 2023,
      snippet: `Comprehensive survey of block-diagonal matrix methods in signal processing, featuring the approach from ${paperTitle}...`,
      pdf: true,
      citationCount: 42,
      fields: ['Survey', 'Signal Processing'],
    },
    {
      id: 308,
      title: 'ASIC Design for Next-Generation Wireless Receivers',
      authors: ['Richard Clark'],
      venue: 'IEEE Solid-State Circuits Letters',
      date: 2024,
      snippet: `ASIC implementation of wireless receivers using low-complexity algorithms similar to those in ${paperTitle}...`,
      pdf: true,
      citationCount: 21,
      fields: ['ASIC', 'Hardware Design'],
    },
  ];
};

const RelatedPapersPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const paper = location.state?.paper || {
    title: 'An Efficient Approximate Expectation Propagation Detector With Block-Diagonal Neumann-Series',
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

  const results = mockRelatedPapers(paper.title);

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
    "FPGA",
    "6G",
    "Machine Learning",
    "Energy Efficiency",
    "5G",
    "Survey",
    "ASIC",
    "Hardware Design",
    "Wireless",
  ];

  const total = 87; // Mock total number of related papers

  const onHeaderSearch = (e) => {
    e && e.preventDefault && e.preventDefault();
    const val = e.target.elements["headerSearch"].value || "";
    navigate(`/search?q=${encodeURIComponent(val)}&type=publications`);
  };

  return (
    <>
      <Navbar />

      <div style={{ paddingTop: 100, paddingLeft: 40, paddingRight: 40 }}>
        {/* Header showing which paper's related papers we're viewing */}
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
            Papers related to: {paper.title}
          </h2>
          <p style={{ color: '#666', fontSize: 14 }}>
            Showing papers similar to this work
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

export default RelatedPapersPage;