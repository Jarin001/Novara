import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Bibtex = ({ papers = [], libraries = [], sharedLibraries = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the selected library ID from location state or query params
  const searchParams = new URLSearchParams(location.search);
  const selectedLibrary = location.state?.selectedLibrary || searchParams.get('library') || 'all';
  
  // Get papers for the selected library
  const filteredPapers = papers.filter(p => 
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
    const personalLib = libraries.find(l => l.id === selectedLibrary);
    const sharedLib = sharedLibraries.find(l => l.id === selectedLibrary);
    libraryName = (personalLib || sharedLib)?.name || 'Library';
  }

  const copyAllBibtex = () => {
    const allBibtex = sortedPapers.map(p => p.bibtex).join('\n\n');
    navigator.clipboard.writeText(allBibtex);
    alert('All BibTeX entries copied to clipboard!');
  };

  const downloadBibtex = () => {
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F5F5F0' }}>
      <div style={{ flex: 1, overflow: 'auto', marginTop: '64px', padding: '32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 600, color: '#111827', margin: '16px 0 8px 0' }}>
                BibTeX - {libraryName}
              </h1>
              <p style={{ color: '#6b7280', margin: 0 }}>{sortedPapers.length} papers</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={copyAllBibtex}
                style={{
                  padding: '10px 20px',
                  color: 'white',
                  backgroundColor: '#3E513E',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Copy All
              </button>
              <button
                onClick={downloadBibtex}
                style={{
                  padding: '10px 20px',
                  color: '#3E513E',
                  backgroundColor: '#E8EDE8',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Download .bib
              </button>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <pre style={{ 
              fontFamily: 'monospace', 
              fontSize: '14px', 
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              margin: 0,
              color: '#374151'
            }}>
              {sortedPapers.length > 0 ? sortedPapers.map(p => p.bibtex).join('\n\n') : 'No papers in this library.'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bibtex;