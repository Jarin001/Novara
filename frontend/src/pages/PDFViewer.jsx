import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import io from 'socket.io-client';
import Navbar from '../components/Navbar';
import { API_ENDPOINTS } from '../config/api';

// Worker source – try CDN first, fallback to local if needed
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
// If CDN fails, copy pdf.worker.min.js to your public folder and uncomment:
// pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const PDFViewer = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Zoom state
  const [scale, setScale] = useState(1.0);
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3.0;
  const SCALE_STEP = 0.25;

  // Fullscreen ref and state
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Annotations state
  const [annotations, setAnnotations] = useState([]);
  const [currentTool, setCurrentTool] = useState('highlight');
  const [currentColor, setCurrentColor] = useState('#FFFF00');
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [notePosition, setNotePosition] = useState(null);

  // Page dimensions for coordinate mapping
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

  // Socket and user
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userColor, setUserColor] = useState('#FFFF00');

  const overlayRef = useRef(null);

  // --- FIXED: Use passed state first, fallback to fetch ---
  useEffect(() => {
    // Check if we got the PDF URL from navigation state (passed from PaperDetails)
    if (location.state?.pdfUrl) {
      console.log('Using PDF URL from navigation state:', location.state.pdfUrl);
      setPdfUrl(`${process.env.REACT_APP_BACKEND_URL}/api/pdf-proxy?url=${encodeURIComponent(location.state.pdfUrl)}`);
      setLoading(false);
    } else {
      // No state – fetch paper details as fallback
      console.log('No PDF URL in state, fetching from API...');
      const fetchPaperDetails = async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/papers/${paperId}`);
          if (response.ok) {
            const data = await response.json();
            const pdfUrl = data.openAccessPdf?.url;
            if (pdfUrl) {
              setPdfUrl(`${process.env.REACT_APP_BACKEND_URL}/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`);
            } else {
              setError('No PDF available for this paper.');
            }
          } else {
            setError('Failed to fetch paper details.');
          }
        } catch (err) {
          setError('Error fetching paper details.');
        } finally {
          setLoading(false);
        }
      };
      fetchPaperDetails();
    }
  }, [location.state, paperId]);

  // Get user ID from localStorage and assign a color
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserId(user.id);
        const hash = user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colors = ['#FFB6C1', '#ADD8E6', '#90EE90', '#FFD700', '#FFA07A', '#E0B0FF'];
        setUserColor(colors[hash % colors.length]);
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  // Initialize socket connection and join paper room
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('joinPaper', { paperId });
    });

    newSocket.on('annotationUpdate', (updatedAnnotation) => {
      setAnnotations(prev => {
        const index = prev.findIndex(a => a._id === updatedAnnotation._id);
        if (index >= 0) {
          const newAnnotations = [...prev];
          newAnnotations[index] = updatedAnnotation;
          return newAnnotations;
        } else {
          return [...prev, updatedAnnotation];
        }
      });
    });

    newSocket.on('annotationDelete', ({ id }) => {
      setAnnotations(prev => prev.filter(a => a._id !== id));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [paperId]);

  // Fetch existing annotations for this paper
  useEffect(() => {
    const fetchAnnotations = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations/${paperId}`);
        if (response.ok) {
          const data = await response.json();
          setAnnotations(data);
        }
      } catch (err) {
        console.error('Error fetching annotations', err);
      }
    };
    if (paperId) {
      fetchAnnotations();
    }
  }, [paperId]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle fullscreen on the container element
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, [isFullscreen]);

  // Zoom handlers
  const zoomIn = () => setScale(prev => Math.min(prev + SCALE_STEP, MAX_SCALE));
  const zoomOut = () => setScale(prev => Math.max(prev - SCALE_STEP, MIN_SCALE));

  // Keyboard navigation: left/right arrows
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setPageNumber(prev => Math.max(prev - 1, 1));
      } else if (e.key === 'ArrowRight') {
        setPageNumber(prev => Math.min(prev + 1, numPages || 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages]);

  // Handle mouse events for creating annotations
  const handleMouseDown = (e) => {
    if (!currentTool || !pageDimensions.width) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / pageDimensions.width;
    const y = (e.clientY - rect.top) / pageDimensions.height;

    if (currentTool === 'note') {
      setNotePosition({ x, y });
      setShowNoteInput(true);
    }
    // For highlight/underline, you would implement drag selection here.
  };

  const saveAnnotation = async (type, position, content = '') => {
    if (!userId) {
      alert('Please log in to annotate.');
      return;
    }
    const annotationData = {
      libraryId: '',
      paperId,
      userId,
      pageNumber,
      type,
      position,
      content,
      color: currentColor,
    };
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotationData),
      });
      if (response.ok) {
        const newAnnotation = await response.json();
        setAnnotations([...annotations, newAnnotation]);
        socket.emit('annotationChanged', { paperId, annotation: newAnnotation });
      }
    } catch (err) {
      console.error('Error saving annotation', err);
    }
  };

  const deleteAnnotation = async (id) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setAnnotations(prev => prev.filter(a => a._id !== id));
        socket.emit('annotationChanged', { paperId, annotation: { id, deleted: true } });
      }
    } catch (err) {
      console.error('Error deleting annotation', err);
    }
  };

  const handleNoteSave = () => {
    if (notePosition) {
      saveAnnotation('note', {
        x: notePosition.x,
        y: notePosition.y,
        width: 0.02,
        height: 0.02,
      }, noteText);
      setShowNoteInput(false);
      setNoteText('');
      setNotePosition(null);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onPageLoadSuccess = (page) => {
    const { width, height } = page.getViewport({ scale: 1 });
    setPageDimensions({ width, height });
  };

  // Render annotations on overlay
  const renderAnnotations = () => {
    return annotations
      .filter(ann => ann.pageNumber === pageNumber && !ann.isDeleted)
      .map((ann) => {
        const { x, y, width, height } = ann.position;
        const style = {
          position: 'absolute',
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          width: `${width * 100}%`,
          height: `${height * 100}%`,
          pointerEvents: 'auto',
          cursor: 'pointer',
        };
        if (ann.type === 'highlight') {
          style.backgroundColor = ann.color || '#FFFF00';
          style.opacity = 0.3;
        } else if (ann.type === 'underline') {
          style.borderBottom = `2px solid ${ann.color || '#000'}`;
          style.height = '0';
        } else if (ann.type === 'note') {
          style.backgroundColor = ann.color || '#FFD700';
          style.borderRadius = '50%';
          style.width = '15px';
          style.height = '15px';
          style.left = `${x * 100}%`;
          style.top = `${y * 100}%`;
          style.transform = 'translate(-50%, -50%)';
        }
        return (
          <div
            key={ann._id}
            style={style}
            title={ann.content || ann.type}
            onClick={() => setSelectedAnnotation(ann)}
          />
        );
      });
  };

  if (loading) return (
    <>
      <Navbar />
      <div style={{ paddingTop: 80, paddingLeft: 40, paddingRight: 40, background: '#f0f0f0', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 18, color: '#666' }}>Loading PDF viewer...</div>
        </div>
      </div>
    </>
  );

  if (error) return (
    <>
      <Navbar />
      <div style={{ paddingTop: 80, paddingLeft: 40, paddingRight: 40, background: '#f0f0f0', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 18, color: '#d32f2f' }}>Error: {error}</div>
        </div>
      </div>
    </>
  );

  if (!pdfUrl) return (
    <>
      <Navbar />
      <div style={{ paddingTop: 80, paddingLeft: 40, paddingRight: 40, background: '#f0f0f0', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 18, color: '#666' }}>No PDF URL available.</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <div style={{
        paddingTop: 80,
        paddingLeft: 40,
        paddingRight: 40,
        paddingBottom: 40,
        background: '#f0f0f0',
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Toolbar - redesigned with perfectly centered zoom controls using flexbox with equal side widths */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          background: '#fff',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {/* Left section (flex:1 pushes it to the left, equal width with right) */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setCurrentTool('highlight')}
              style={{
                padding: "6px 12px",
                background: currentTool === 'highlight' ? '#e0e0e0' : '#fff',
                border: "1px solid #e0e0e0",
                borderRadius: 4,
                fontSize: 12,
                color: "#333",
                cursor: "pointer",
                fontWeight: currentTool === 'highlight' ? 600 : 400
              }}
            >
              Highlight
            </button>
            <button
              onClick={() => setCurrentTool('underline')}
              style={{
                padding: "6px 12px",
                background: currentTool === 'underline' ? '#e0e0e0' : '#fff',
                border: "1px solid #e0e0e0",
                borderRadius: 4,
                fontSize: 12,
                color: "#333",
                cursor: "pointer",
                fontWeight: currentTool === 'underline' ? 600 : 400
              }}
            >
              Underline
            </button>
            <button
              onClick={() => setCurrentTool('note')}
              style={{
                padding: "6px 12px",
                background: currentTool === 'note' ? '#e0e0e0' : '#fff',
                border: "1px solid #e0e0e0",
                borderRadius: 4,
                fontSize: 12,
                color: "#333",
                cursor: "pointer",
                fontWeight: currentTool === 'note' ? 600 : 400
              }}
            >
              Note
            </button>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              style={{
                width: 32,
                height: 32,
                padding: 2,
                border: "1px solid #e0e0e0",
                borderRadius: 4,
                cursor: "pointer",
                marginLeft: 4
              }}
              title="Highlight/underline color"
            />
          </div>

          {/* Middle section: zoom controls (centered automatically because side sections are equal width) */}
          <div style={{ flex: '0 0 auto' }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                onClick={zoomOut}
                disabled={scale <= MIN_SCALE}
                style={{
                  padding: "6px 10px",
                  background: scale <= MIN_SCALE ? "#f0f0f0" : "#fff",
                  border: "1px solid #e0e0e0",
                  borderRadius: 4,
                  fontSize: 14,
                  color: scale <= MIN_SCALE ? "#999" : "#333",
                  cursor: scale <= MIN_SCALE ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  lineHeight: 1
                }}
                title="Zoom out"
              >
                −
              </button>
              <span style={{ fontSize: 12, color: '#333', minWidth: 50, textAlign: 'center' }}>
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={scale >= MAX_SCALE}
                style={{
                  padding: "6px 10px",
                  background: scale >= MAX_SCALE ? "#f0f0f0" : "#fff",
                  border: "1px solid #e0e0e0",
                  borderRadius: 4,
                  fontSize: 14,
                  color: scale >= MAX_SCALE ? "#999" : "#333",
                  cursor: scale >= MAX_SCALE ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  lineHeight: 1
                }}
                title="Zoom in"
              >
                +
              </button>
            </div>
          </div>

          {/* Right section (flex:1 pushes it to the right, equal width with left) */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
            <button
              onClick={toggleFullscreen}
              style={{
                padding: "6px 10px",
                background: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: 4,
                fontSize: 14,
                color: "#333",
                cursor: "pointer",
                fontWeight: "bold",
                lineHeight: 1
              }}
              title="Fullscreen"
            >
              ⛶
            </button>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber(pageNumber - 1)}
                style={{
                  padding: "6px 10px",
                  background: pageNumber <= 1 ? "#f0f0f0" : "#fff",
                  border: "1px solid #e0e0e0",
                  borderRadius: 4,
                  fontSize: 14,
                  color: pageNumber <= 1 ? "#999" : "#333",
                  cursor: pageNumber <= 1 ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  lineHeight: 1
                }}
                title="Previous page (←)"
              >
                ◀
              </button>
              <span style={{ fontSize: 12, color: '#333', whiteSpace: 'nowrap' }}>
                {pageNumber} / {numPages}
              </span>
              <button
                disabled={pageNumber >= numPages}
                onClick={() => setPageNumber(pageNumber + 1)}
                style={{
                  padding: "6px 10px",
                  background: pageNumber >= numPages ? "#f0f0f0" : "#fff",
                  border: "1px solid #e0e0e0",
                  borderRadius: 4,
                  fontSize: 14,
                  color: pageNumber >= numPages ? "#999" : "#333",
                  cursor: pageNumber >= numPages ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  lineHeight: 1
                }}
                title="Next page (→)"
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        {/* PDF Viewer with Overlay */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            overflow: 'auto',
            position: 'relative',
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            padding: 20,
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading="Loading PDF...">
              <Page
                pageNumber={pageNumber}
                scale={scale}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
            <div
              ref={overlayRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
              onMouseDown={handleMouseDown}
            >
              {renderAnnotations()}
              {showNoteInput && (
                <div style={{
                  position: 'absolute',
                  left: `${notePosition?.x * 100}%`,
                  top: `${notePosition?.y * 100}%`,
                  background: '#fff',
                  border: '1px solid #ccc',
                  padding: '5px',
                  zIndex: 100,
                  pointerEvents: 'auto',
                  borderRadius: 4,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  <textarea
                    autoFocus
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={3}
                    style={{ width: '200px', border: '1px solid #ddd', borderRadius: 4, padding: 4, fontSize: 12 }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={handleNoteSave}
                      style={{
                        padding: '4px 8px',
                        background: '#3E513E',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 500
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowNoteInput(false)}
                      style={{
                        padding: '4px 8px',
                        background: '#f0f0f0',
                        color: '#333',
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 500
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Annotation details modal */}
        {selectedAnnotation && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#fff',
            border: '1px solid #e0e0e0',
            padding: '16px',
            maxWidth: '300px',
            zIndex: 200,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            borderRadius: 8
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#333' }}>
              {selectedAnnotation.type === 'note' ? 'Note' : selectedAnnotation.type}
            </h4>
            {selectedAnnotation.type === 'note' && (
              <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>{selectedAnnotation.content}</p>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedAnnotation(null)}
                style={{
                  padding: '6px 12px',
                  background: '#f0f0f0',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                Close
              </button>
              {selectedAnnotation.userId === userId && (
                <button
                  onClick={() => deleteAnnotation(selectedAnnotation._id)}
                  style={{
                    padding: '6px 12px',
                    background: '#d32f2f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PDFViewer;