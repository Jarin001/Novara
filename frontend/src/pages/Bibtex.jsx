import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Copy, Download, ArrowLeft, Check } from 'lucide-react';
import Navbar from "../components/Navbar";
import axios from 'axios';

const Bibtex = ({ papers = [], libraries = [], sharedLibraries = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bibtexData, setBibtexData] = useState([]);
  
  // Get the selected library ID from location state or query params
  const searchParams = new URLSearchParams(location.search);
  const selectedLibrary = location.state?.selectedLibrary || searchParams.get('library') || 'all';
  
  // Get libraries and papers from location state or props
  const stateLibraries = location.state?.libraries || libraries;
  const stateSharedLibraries = location.state?.sharedLibraries || sharedLibraries;
  const statePapers = location.state?.papers || papers;
  const [allCopied, setAllCopied] = useState(false);
  
  // Fetch BibTeX data from the backend
  useEffect(() => {
    const fetchBibtex = async () => {
      try {
        const response = await axios.get(`/api/bibtex/all?library=${selectedLibrary}`);
        setBibtexData(response.data.bibtex);
      } catch (error) {
        console.error('Error fetching BibTeX data:', error);
      }
    };
    fetchBibtex();
  }, [selectedLibrary]);

  // Get papers for the selected library
  const filteredPapers = statePapers.filter(p => 
    selectedLibrary === 'all' ? true : 
    selectedLibrary.startsWith('s') ? p.libraryId === selectedLibrary : 
    !p.libraryId.startsWith('s') && p.libraryId === selectedLibrary
  );

  const sortedPapers = [...filteredPapers].sort((a, b) => b.addedDate - a.addedDate);

  // Get the appropriate library name
  let libraryName = 'All Papers';
  if (selectedLibrary === 'all') {
    libraryName = 'All Papers';
  } else {
    const personalLib = stateLibraries.find(l => l.id === selectedLibrary);
    const sharedLib = stateSharedLibraries.find(l => l.id === selectedLibrary);
    libraryName = (personalLib || sharedLib)?.name || 'Library';
  }

const copyAllBibtex = () => {
  if (sortedPapers.length === 0) {
    alert('No papers to copy in this library.');
    return;
  }
  const allBibtex = sortedPapers.map(p => p.bibtex).join('\n\n');
  navigator.clipboard.writeText(allBibtex).then(() => {
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000); // Reset after 2 seconds
  });
};

  const downloadBibtex = () => {
    if (sortedPapers.length === 0) {
      alert('No papers to download in this library.');
      return;
    }
    const allBibtex = sortedPapers.map(p => p.bibtex).join('\n\n');
    const blob = new Blob([allBibtex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${libraryName.replace(/\s+/g, '_')}_bibtex.bib`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
      <Navbar />
      <div style={{ flex: 1, overflow: 'auto', marginTop: '64px', padding: '32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', margin: '16px 0 8px 0' }}>
                BibTeX - {libraryName}
              </h1>
              <p style={{ color: '#6b7280', margin: 0 }}>{sortedPapers.length} papers</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
<button
  onClick={copyAllBibtex}
  disabled={sortedPapers.length === 0}
  style={{
    padding: '10px 16px',
    color: sortedPapers.length === 0 ? '#9ca3af' : 'white',
    backgroundColor: sortedPapers.length === 0 ? '#f3f4f6' : '#3E513E',
    border: 'none',
    borderRadius: '8px',
    cursor: sortedPapers.length === 0 ? 'not-allowed' : 'pointer',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    opacity: sortedPapers.length === 0 ? '0.7' : '1'
  }}
  title="Copy all BibTeX"
>
  {allCopied ? <Check size={18} /> : <Copy size={18} />}
</button>
              <button
                onClick={downloadBibtex}
                disabled={sortedPapers.length === 0}
                style={{
                  padding: '10px 16px',
                  color: sortedPapers.length === 0 ? '#9ca3af' : '#3E513E',
                  backgroundColor: sortedPapers.length === 0 ? '#f3f4f6' : '#E8EDE8',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: sortedPapers.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: sortedPapers.length === 0 ? '0.7' : '1'
                }}
                title="Download .bib file"
              >
                <Download size={18} />
                {/* Download .bib */}
              </button>
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#F5F5F0', 
            borderRadius: '12px', 
            padding: '24px', 
            border: '1px solid #E8EDE8',
            minHeight: '300px'
          }}>
            <pre style={{ 
              fontFamily: '"Courier New", Courier, monospace', 
              fontSize: '14px', 
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              margin: 0,
              color: '#374151',
              backgroundColor: 'transparent'
            }}>
              {sortedPapers.length > 0 ? sortedPapers.map(p => p.bibtex).join('\n\n') : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '200px',
                  color: '#9ca3af'
                }}>
                  <p style={{ fontSize: '1rem',margin: 0 }}>No BibTeX entries in this library</p>
                </div>
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bibtex;
