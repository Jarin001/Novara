// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import { Document, Page, pdfjs } from 'react-pdf';
// import io from 'socket.io-client';
// import Navbar from '../components/Navbar';
// import { API_ENDPOINTS } from '../config/api';

// // Worker source – try CDN first, fallback to local if needed
// pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
// // If CDN fails, copy pdf.worker.min.js to your public folder and uncomment:
// // pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// const PDFViewer = () => {
//   const { paperId } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [numPages, setNumPages] = useState(null);
//   const [pageNumber, setPageNumber] = useState(1);
//   const [pdfUrl, setPdfUrl] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Zoom state
//   const [scale, setScale] = useState(1.0);
//   const MIN_SCALE = 0.5;
//   const MAX_SCALE = 3.0;
//   const SCALE_STEP = 0.25;

//   // Fullscreen ref and state
//   const containerRef = useRef(null);
//   const [isFullscreen, setIsFullscreen] = useState(false);

//   // Annotations state
//   const [annotations, setAnnotations] = useState([]);
//   const [currentTool, setCurrentTool] = useState('highlight');
//   const [currentColor, setCurrentColor] = useState('#FFFF00');
//   const [selectedAnnotation, setSelectedAnnotation] = useState(null);
//   const [noteText, setNoteText] = useState('');
//   const [showNoteInput, setShowNoteInput] = useState(false);
//   const [notePosition, setNotePosition] = useState(null); // for note input popup

//   // Page dimensions for coordinate mapping
//   const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

//   // Drag selection state
//   const [isDragging, setIsDragging] = useState(false);
//   const [dragStart, setDragStart] = useState(null);
//   const [dragEnd, setDragEnd] = useState(null);

//   // Socket and user
//   const [socket, setSocket] = useState(null);
//   const [userId, setUserId] = useState(null);
//   const [userColor, setUserColor] = useState('#FFFF00');

//   const overlayRef = useRef(null);

//   // --- FIXED: Use passed state first, fallback to fetch ---
//   useEffect(() => {
//     if (location.state?.pdfUrl) {
//       console.log('Using PDF URL from navigation state:', location.state.pdfUrl);
//       setPdfUrl(`${process.env.REACT_APP_BACKEND_URL}/api/pdf-proxy?url=${encodeURIComponent(location.state.pdfUrl)}`);
//       setLoading(false);
//     } else {
//       console.log('No PDF URL in state, fetching from API...');
//       const fetchPaperDetails = async () => {
//         try {
//           const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/papers/${paperId}`);
//           if (response.ok) {
//             const data = await response.json();
//             const pdfUrl = data.openAccessPdf?.url;
//             if (pdfUrl) {
//               setPdfUrl(`${process.env.REACT_APP_BACKEND_URL}/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`);
//             } else {
//               setError('No PDF available for this paper.');
//             }
//           } else {
//             setError('Failed to fetch paper details.');
//           }
//         } catch (err) {
//           setError('Error fetching paper details.');
//         } finally {
//           setLoading(false);
//         }
//       };
//       fetchPaperDetails();
//     }
//   }, [location.state, paperId]);

//   // Get user ID from localStorage and assign a color
//   useEffect(() => {
//     const userData = localStorage.getItem('user');
//     if (userData) {
//       try {
//         const user = JSON.parse(userData);
//         setUserId(user.id);
//         const hash = user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
//         const colors = ['#FFB6C1', '#ADD8E6', '#90EE90', '#FFD700', '#FFA07A', '#E0B0FF'];
//         setUserColor(colors[hash % colors.length]);
//       } catch (e) {
//         console.error('Error parsing user data', e);
//       }
//     }
//   }, []);

//   // Initialize socket connection and join paper room
//   useEffect(() => {
//     const newSocket = io(process.env.REACT_APP_BACKEND_URL);
//     setSocket(newSocket);

//     newSocket.on('connect', () => {
//       console.log('Socket connected');
//       newSocket.emit('joinPaper', { paperId });
//     });

//     newSocket.on('annotationUpdate', (updatedAnnotation) => {
//       setAnnotations(prev => {
//         const index = prev.findIndex(a => a._id === updatedAnnotation._id);
//         if (index >= 0) {
//           const newAnnotations = [...prev];
//           newAnnotations[index] = updatedAnnotation;
//           return newAnnotations;
//         } else {
//           return [...prev, updatedAnnotation];
//         }
//       });
//     });

//     newSocket.on('annotationDelete', ({ id }) => {
//       setAnnotations(prev => prev.filter(a => a._id !== id));
//     });

//     return () => {
//       newSocket.disconnect();
//     };
//   }, [paperId]);

//   // Fetch existing annotations for this paper
//   useEffect(() => {
//     const fetchAnnotations = async () => {
//       try {
//         const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations/${paperId}`);
//         if (response.ok) {
//           const data = await response.json();
//           setAnnotations(data);
//         }
//       } catch (err) {
//         console.error('Error fetching annotations', err);
//       }
//     };
//     if (paperId) {
//       fetchAnnotations();
//     }
//   }, [paperId]);

//   // Handle fullscreen change events
//   useEffect(() => {
//     const handleFullscreenChange = () => {
//       setIsFullscreen(!!document.fullscreenElement);
//     };
//     document.addEventListener('fullscreenchange', handleFullscreenChange);
//     return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
//   }, []);

//   // Toggle fullscreen on the container element
//   const toggleFullscreen = useCallback(() => {
//     if (!containerRef.current) return;
//     if (!isFullscreen) {
//       containerRef.current.requestFullscreen();
//     } else {
//       document.exitFullscreen();
//     }
//   }, [isFullscreen]);

//   // Zoom handlers
//   const zoomIn = () => setScale(prev => Math.min(prev + SCALE_STEP, MAX_SCALE));
//   const zoomOut = () => setScale(prev => Math.max(prev - SCALE_STEP, MIN_SCALE));

//   // Keyboard navigation: left/right arrows
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (e.key === 'ArrowLeft') {
//         setPageNumber(prev => Math.max(prev - 1, 1));
//       } else if (e.key === 'ArrowRight') {
//         setPageNumber(prev => Math.min(prev + 1, numPages || 1));
//       }
//     };
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [numPages]);

//   // Mouse event handlers for drag selection
//   const handleMouseDown = (e) => {
//     if (!currentTool || !pageDimensions.width) return;
//     // Only start drag if left button is pressed
//     if (e.button !== 0) return;

//     const rect = e.currentTarget.getBoundingClientRect();
//     const x = (e.clientX - rect.left) / pageDimensions.width;
//     const y = (e.clientY - rect.top) / pageDimensions.height;

//     // Clamp to page bounds
//     const clampedX = Math.max(0, Math.min(1, x));
//     const clampedY = Math.max(0, Math.min(1, y));

//     setIsDragging(true);
//     setDragStart({ x: clampedX, y: clampedY });
//     setDragEnd({ x: clampedX, y: clampedY });
//   };

//   const handleMouseMove = (e) => {
//     if (!isDragging || !pageDimensions.width) return;

//     const rect = overlayRef.current.getBoundingClientRect();
//     const x = (e.clientX - rect.left) / pageDimensions.width;
//     const y = (e.clientY - rect.top) / pageDimensions.height;

//     // Clamp to page bounds
//     const clampedX = Math.max(0, Math.min(1, x));
//     const clampedY = Math.max(0, Math.min(1, y));

//     setDragEnd({ x: clampedX, y: clampedY });
//   };

//   const handleMouseUp = () => {
//     if (!isDragging || !dragStart || !dragEnd) {
//       setIsDragging(false);
//       setDragStart(null);
//       setDragEnd(null);
//       return;
//     }

//     // Calculate rectangle from start and end
//     const left = Math.min(dragStart.x, dragEnd.x);
//     const top = Math.min(dragStart.y, dragEnd.y);
//     const right = Math.max(dragStart.x, dragEnd.x);
//     const bottom = Math.max(dragStart.y, dragEnd.y);
//     const width = right - left;
//     const height = bottom - top;

//     // Ignore very small selections (maybe accidental click)
//     if (width < 0.01 || height < 0.01) {
//       setIsDragging(false);
//       setDragStart(null);
//       setDragEnd(null);
//       return;
//     }

//     const position = { x: left, y: top, width, height };

//     if (currentTool === 'highlight' || currentTool === 'underline') {
//       // Save annotation immediately
//       saveAnnotation(currentTool, position);
//     } else if (currentTool === 'note') {
//       // Show note input at the top-left of the selected area
//       setNotePosition({ x: left, y: top });
//       setShowNoteInput(true);
//       // Store the position to use when saving
//       setNotePosition({ ...position, showAt: { x: left, y: top } }); // we need to store both the rectangle and where to show input
//       // For simplicity, we'll store the rectangle in a separate state
//       setPendingNoteRect(position);
//     }

//     setIsDragging(false);
//     setDragStart(null);
//     setDragEnd(null);
//   };

//   // Add global mouse event listeners when dragging
//   useEffect(() => {
//     if (isDragging) {
//       window.addEventListener('mousemove', handleMouseMove);
//       window.addEventListener('mouseup', handleMouseUp);
//     } else {
//       window.removeEventListener('mousemove', handleMouseMove);
//       window.removeEventListener('mouseup', handleMouseUp);
//     }
//     return () => {
//       window.removeEventListener('mousemove', handleMouseMove);
//       window.removeEventListener('mouseup', handleMouseUp);
//     };
//   }, [isDragging, dragStart, dragEnd]);

//   // Pending note rectangle for saving
//   const [pendingNoteRect, setPendingNoteRect] = useState(null);

//   const saveAnnotation = async (type, position, content = '') => {
//     if (!userId) {
//       alert('Please log in to annotate.');
//       return;
//     }
//     const annotationData = {
//       libraryId: '',
//       paperId,
//       userId,
//       pageNumber,
//       type,
//       position,
//       content,
//       color: currentColor,
//     };
//     try {
//       const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(annotationData),
//       });
//       if (response.ok) {
//         const newAnnotation = await response.json();
//         setAnnotations([...annotations, newAnnotation]);
//         socket.emit('annotationChanged', { paperId, annotation: newAnnotation });
//       }
//     } catch (err) {
//       console.error('Error saving annotation', err);
//     }
//   };

//   const deleteAnnotation = async (id) => {
//     try {
//       const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations/${id}`, {
//         method: 'DELETE',
//       });
//       if (response.ok) {
//         setAnnotations(prev => prev.filter(a => a._id !== id));
//         socket.emit('annotationChanged', { paperId, annotation: { id, deleted: true } });
//       }
//     } catch (err) {
//       console.error('Error deleting annotation', err);
//     }
//   };

//   const handleNoteSave = () => {
//     if (pendingNoteRect) {
//       saveAnnotation('note', pendingNoteRect, noteText);
//       setShowNoteInput(false);
//       setNoteText('');
//       setNotePosition(null);
//       setPendingNoteRect(null);
//     }
//   };

//   const onDocumentLoadSuccess = ({ numPages }) => {
//     setNumPages(numPages);
//   };

//   const onPageLoadSuccess = (page) => {
//     const { width, height } = page.getViewport({ scale: 1 });
//     setPageDimensions({ width, height });
//   };

//   // Render drag preview overlay
//   const renderDragPreview = () => {
//     if (!isDragging || !dragStart || !dragEnd) return null;
//     const left = Math.min(dragStart.x, dragEnd.x);
//     const top = Math.min(dragStart.y, dragEnd.y);
//     const width = Math.abs(dragEnd.x - dragStart.x);
//     const height = Math.abs(dragEnd.y - dragStart.y);
//     return (
//       <div
//         style={{
//           position: 'absolute',
//           left: `${left * 100}%`,
//           top: `${top * 100}%`,
//           width: `${width * 100}%`,
//           height: `${height * 100}%`,
//           backgroundColor: currentColor,
//           opacity: 0.2,
//           pointerEvents: 'none',
//           border: '1px dashed #000',
//         }}
//       />
//     );
//   };

//   // Render annotations on overlay
//   const renderAnnotations = () => {
//     return annotations
//       .filter(ann => ann.pageNumber === pageNumber && !ann.isDeleted)
//       .map((ann) => {
//         const { x, y, width, height } = ann.position;
//         const style = {
//           position: 'absolute',
//           left: `${x * 100}%`,
//           top: `${y * 100}%`,
//           width: `${width * 100}%`,
//           height: `${height * 100}%`,
//           pointerEvents: 'auto',
//           cursor: 'pointer',
//         };
//         if (ann.type === 'highlight') {
//           style.backgroundColor = ann.color || '#FFFF00';
//           style.opacity = 0.3;
//         } else if (ann.type === 'underline') {
//           style.borderBottom = `2px solid ${ann.color || '#000'}`;
//           style.height = '0';
//         } else if (ann.type === 'note') {
//           // For note, we render a small icon at the top-left of the rectangle
//           // and also show the note content on hover
//           style.backgroundColor = 'transparent';
//           style.border = 'none';
//           // We'll add a separate child div for the icon
//         }
//         return (
//           <div
//             key={ann._id}
//             style={style}
//             title={ann.content || ann.type}
//             onClick={() => setSelectedAnnotation(ann)}
//           >
//             {ann.type === 'note' && (
//               <div
//                 style={{
//                   position: 'absolute',
//                   top: 0,
//                   left: 0,
//                   width: '20px',
//                   height: '20px',
//                   backgroundColor: ann.color || '#FFD700',
//                   borderRadius: '50%',
//                   transform: 'translate(-50%, -50%)',
//                   border: '1px solid #333',
//                   cursor: 'pointer',
//                 }}
//                 title={ann.content}
//               />
//             )}
//           </div>
//         );
//       });
//   };

//   if (loading) return (
//     <>
//       <Navbar />
//       <div style={{ paddingTop: 80, paddingLeft: 40, paddingRight: 40, background: '#f0f0f0', minHeight: '100vh' }}>
//         <div style={{ textAlign: 'center', padding: '60px 20px' }}>
//           <div style={{ fontSize: 18, color: '#666' }}>Loading PDF viewer...</div>
//         </div>
//       </div>
//     </>
//   );

//   if (error) return (
//     <>
//       <Navbar />
//       <div style={{ paddingTop: 80, paddingLeft: 40, paddingRight: 40, background: '#f0f0f0', minHeight: '100vh' }}>
//         <div style={{ textAlign: 'center', padding: '60px 20px' }}>
//           <div style={{ fontSize: 18, color: '#d32f2f' }}>Error: {error}</div>
//         </div>
//       </div>
//     </>
//   );

//   if (!pdfUrl) return (
//     <>
//       <Navbar />
//       <div style={{ paddingTop: 80, paddingLeft: 40, paddingRight: 40, background: '#f0f0f0', minHeight: '100vh' }}>
//         <div style={{ textAlign: 'center', padding: '60px 20px' }}>
//           <div style={{ fontSize: 18, color: '#666' }}>No PDF URL available.</div>
//         </div>
//       </div>
//     </>
//   );

//   return (
//     <>
//       <Navbar />
//       <div style={{
//         paddingTop: 80,
//         paddingLeft: 40,
//         paddingRight: 40,
//         paddingBottom: 40,
//         background: '#f0f0f0',
//         minHeight: 'calc(100vh - 80px)',
//         display: 'flex',
//         flexDirection: 'column'
//       }}>
//         {/* Toolbar - perfectly centered zoom controls */}
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           gap: 12,
//           marginBottom: 20,
//           background: '#fff',
//           padding: '12px 20px',
//           borderRadius: 8,
//           boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
//         }}>
//           {/* Left section */}
//           <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', gap: 8, alignItems: 'center' }}>
//             <button
//               onClick={() => setCurrentTool('highlight')}
//               style={{
//                 padding: "6px 12px",
//                 background: currentTool === 'highlight' ? '#e0e0e0' : '#fff',
//                 border: "1px solid #e0e0e0",
//                 borderRadius: 4,
//                 fontSize: 12,
//                 color: "#333",
//                 cursor: "pointer",
//                 fontWeight: currentTool === 'highlight' ? 600 : 400
//               }}
//             >
//               Highlight
//             </button>
//             <button
//               onClick={() => setCurrentTool('underline')}
//               style={{
//                 padding: "6px 12px",
//                 background: currentTool === 'underline' ? '#e0e0e0' : '#fff',
//                 border: "1px solid #e0e0e0",
//                 borderRadius: 4,
//                 fontSize: 12,
//                 color: "#333",
//                 cursor: "pointer",
//                 fontWeight: currentTool === 'underline' ? 600 : 400
//               }}
//             >
//               Underline
//             </button>
//             <button
//               onClick={() => setCurrentTool('note')}
//               style={{
//                 padding: "6px 12px",
//                 background: currentTool === 'note' ? '#e0e0e0' : '#fff',
//                 border: "1px solid #e0e0e0",
//                 borderRadius: 4,
//                 fontSize: 12,
//                 color: "#333",
//                 cursor: "pointer",
//                 fontWeight: currentTool === 'note' ? 600 : 400
//               }}
//             >
//               Note
//             </button>
//             <input
//               type="color"
//               value={currentColor}
//               onChange={(e) => setCurrentColor(e.target.value)}
//               style={{
//                 width: 32,
//                 height: 32,
//                 padding: 2,
//                 border: "1px solid #e0e0e0",
//                 borderRadius: 4,
//                 cursor: "pointer",
//                 marginLeft: 4
//               }}
//               title="Highlight/underline color"
//             />
//           </div>

//           {/* Center section: zoom controls */}
//           <div style={{ flex: '0 0 auto' }}>
//             <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
//               <button
//                 onClick={zoomOut}
//                 disabled={scale <= MIN_SCALE}
//                 style={{
//                   padding: "6px 10px",
//                   background: scale <= MIN_SCALE ? "#f0f0f0" : "#fff",
//                   border: "1px solid #e0e0e0",
//                   borderRadius: 4,
//                   fontSize: 14,
//                   color: scale <= MIN_SCALE ? "#999" : "#333",
//                   cursor: scale <= MIN_SCALE ? "not-allowed" : "pointer",
//                   fontWeight: "bold",
//                   lineHeight: 1
//                 }}
//                 title="Zoom out"
//               >
//                 −
//               </button>
//               <span style={{ fontSize: 12, color: '#333', minWidth: 50, textAlign: 'center' }}>
//                 {Math.round(scale * 100)}%
//               </span>
//               <button
//                 onClick={zoomIn}
//                 disabled={scale >= MAX_SCALE}
//                 style={{
//                   padding: "6px 10px",
//                   background: scale >= MAX_SCALE ? "#f0f0f0" : "#fff",
//                   border: "1px solid #e0e0e0",
//                   borderRadius: 4,
//                   fontSize: 14,
//                   color: scale >= MAX_SCALE ? "#999" : "#333",
//                   cursor: scale >= MAX_SCALE ? "not-allowed" : "pointer",
//                   fontWeight: "bold",
//                   lineHeight: 1
//                 }}
//                 title="Zoom in"
//               >
//                 +
//               </button>
//             </div>
//           </div>

//           {/* Right section */}
//           <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
//             <button
//               onClick={toggleFullscreen}
//               style={{
//                 padding: "6px 10px",
//                 background: "#fff",
//                 border: "1px solid #e0e0e0",
//                 borderRadius: 4,
//                 fontSize: 14,
//                 color: "#333",
//                 cursor: "pointer",
//                 fontWeight: "bold",
//                 lineHeight: 1
//               }}
//               title="Fullscreen"
//             >
//               ⛶
//             </button>
//             <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
//               <button
//                 disabled={pageNumber <= 1}
//                 onClick={() => setPageNumber(pageNumber - 1)}
//                 style={{
//                   padding: "6px 10px",
//                   background: pageNumber <= 1 ? "#f0f0f0" : "#fff",
//                   border: "1px solid #e0e0e0",
//                   borderRadius: 4,
//                   fontSize: 14,
//                   color: pageNumber <= 1 ? "#999" : "#333",
//                   cursor: pageNumber <= 1 ? "not-allowed" : "pointer",
//                   fontWeight: "bold",
//                   lineHeight: 1
//                 }}
//                 title="Previous page (←)"
//               >
//                 ◀
//               </button>
//               <span style={{ fontSize: 12, color: '#333', whiteSpace: 'nowrap' }}>
//                 {pageNumber} / {numPages}
//               </span>
//               <button
//                 disabled={pageNumber >= numPages}
//                 onClick={() => setPageNumber(pageNumber + 1)}
//                 style={{
//                   padding: "6px 10px",
//                   background: pageNumber >= numPages ? "#f0f0f0" : "#fff",
//                   border: "1px solid #e0e0e0",
//                   borderRadius: 4,
//                   fontSize: 14,
//                   color: pageNumber >= numPages ? "#999" : "#333",
//                   cursor: pageNumber >= numPages ? "not-allowed" : "pointer",
//                   fontWeight: "bold",
//                   lineHeight: 1
//                 }}
//                 title="Next page (→)"
//               >
//                 ▶
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* PDF Viewer with Overlay */}
//         <div
//           ref={containerRef}
//           style={{
//             flex: 1,
//             overflow: 'auto',
//             position: 'relative',
//             background: '#fff',
//             borderRadius: 8,
//             boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//             padding: 20,
//             display: 'flex',
//             justifyContent: 'center'
//           }}
//         >
//           <div style={{ position: 'relative', display: 'inline-block' }}>
//             <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading="Loading PDF...">
//               <Page
//                 pageNumber={pageNumber}
//                 scale={scale}
//                 onLoadSuccess={onPageLoadSuccess}
//                 renderTextLayer={false} // Keep false for now; we use overlay for annotations
//                 renderAnnotationLayer={false}
//               />
//             </Document>
//             <div
//               ref={overlayRef}
//               style={{
//                 position: 'absolute',
//                 top: 0,
//                 left: 0,
//                 width: '100%',
//                 height: '100%',
//                 pointerEvents: 'auto', // Allow mouse events on overlay
//                 cursor: currentTool ? 'crosshair' : 'default',
//                 userSelect: 'none', // Prevent text selection while dragging
//               }}
//               onMouseDown={handleMouseDown}
//             >
//               {renderAnnotations()}
//               {renderDragPreview()}
//               {showNoteInput && pendingNoteRect && (
//                 <div style={{
//                   position: 'absolute',
//                   left: `${notePosition?.x * 100}%`,
//                   top: `${notePosition?.y * 100}%`,
//                   background: '#fff',
//                   border: '1px solid #ccc',
//                   padding: '5px',
//                   zIndex: 100,
//                   pointerEvents: 'auto',
//                   borderRadius: 4,
//                   boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
//                 }}>
//                   <textarea
//                     autoFocus
//                     value={noteText}
//                     onChange={(e) => setNoteText(e.target.value)}
//                     rows={3}
//                     style={{ width: '200px', border: '1px solid #ddd', borderRadius: 4, padding: 4, fontSize: 12 }}
//                   />
//                   <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
//                     <button
//                       onClick={handleNoteSave}
//                       style={{
//                         padding: '4px 8px',
//                         background: '#3E513E',
//                         color: '#fff',
//                         border: 'none',
//                         borderRadius: 4,
//                         cursor: 'pointer',
//                         fontSize: 11,
//                         fontWeight: 500
//                       }}
//                     >
//                       Save
//                     </button>
//                     <button
//                       onClick={() => {
//                         setShowNoteInput(false);
//                         setNoteText('');
//                         setNotePosition(null);
//                         setPendingNoteRect(null);
//                       }}
//                       style={{
//                         padding: '4px 8px',
//                         background: '#f0f0f0',
//                         color: '#333',
//                         border: '1px solid #ddd',
//                         borderRadius: 4,
//                         cursor: 'pointer',
//                         fontSize: 11,
//                         fontWeight: 500
//                       }}
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Annotation details modal */}
//         {selectedAnnotation && (
//           <div style={{
//             position: 'fixed',
//             bottom: '20px',
//             right: '20px',
//             background: '#fff',
//             border: '1px solid #e0e0e0',
//             padding: '16px',
//             maxWidth: '300px',
//             zIndex: 200,
//             boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
//             borderRadius: 8
//           }}>
//             <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#333' }}>
//               {selectedAnnotation.type === 'note' ? 'Note' : selectedAnnotation.type}
//             </h4>
//             {selectedAnnotation.type === 'note' && (
//               <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>{selectedAnnotation.content}</p>
//             )}
//             <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
//               <button
//                 onClick={() => setSelectedAnnotation(null)}
//                 style={{
//                   padding: '6px 12px',
//                   background: '#f0f0f0',
//                   color: '#333',
//                   border: '1px solid #ddd',
//                   borderRadius: 4,
//                   cursor: 'pointer',
//                   fontSize: 12,
//                   fontWeight: 500
//                 }}
//               >
//                 Close
//               </button>
//               {selectedAnnotation.userId === userId && (
//                 <button
//                   onClick={() => deleteAnnotation(selectedAnnotation._id)}
//                   style={{
//                     padding: '6px 12px',
//                     background: '#d32f2f',
//                     color: '#fff',
//                     border: 'none',
//                     borderRadius: 4,
//                     cursor: 'pointer',
//                     fontSize: 12,
//                     fontWeight: 500
//                   }}
//                 >
//                   Delete
//                 </button>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </>
//   );
// };

// export default PDFViewer;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import io from 'socket.io-client';
import Navbar from '../components/Navbar';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/* ─── style helpers ─────────────────────────────────────── */
const btnBase = (active) => ({
  padding: '6px 12px',
  background: active ? '#e0e0e0' : '#fff',
  border: '1px solid #e0e0e0',
  borderRadius: 4,
  fontSize: 12,
  color: '#333',
  cursor: 'pointer',
  fontWeight: active ? 600 : 400,
});

const navBtn = (disabled) => ({
  padding: '6px 10px',
  background: disabled ? '#f0f0f0' : '#fff',
  border: '1px solid #e0e0e0',
  borderRadius: 4,
  fontSize: 14,
  color: disabled ? '#999' : '#333',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 'bold',
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

/* ─── Note icon SVG ──────────────────────────────────────── */
const NoteIcon = ({ color = '#FFFF00' }) => (
  <svg width="16" height="16" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="20" height="20" rx="3" fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth="1.2"/>
    <rect x="1" y="1" width="20" height="6" rx="3" fill="rgba(0,0,0,0.18)" strokeWidth="0"/>
    <rect x="1" y="4" width="20" height="3" fill="rgba(0,0,0,0.18)" strokeWidth="0"/>
    <line x1="5" y1="11" x2="17" y2="11" stroke="rgba(0,0,0,0.35)" strokeWidth="1.2"/>
    <line x1="5" y1="14" x2="17" y2="14" stroke="rgba(0,0,0,0.35)" strokeWidth="1.2"/>
    <line x1="5" y1="17" x2="12" y2="17" stroke="rgba(0,0,0,0.35)" strokeWidth="1.2"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════ */
const PDFViewer = () => {
  const { paperId } = useParams();
  const navigate    = useNavigate();
  const location    = useLocation();

  /* ── core state ── */
  const [numPages, setNumPages]     = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfUrl, setPdfUrl]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [scale, setScale] = useState(1.0);
  const MIN_SCALE = 0.5, MAX_SCALE = 3.0, SCALE_STEP = 0.25;

  const containerRef = useRef(null);
  const overlayRef   = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* ── annotations ── */
  const [annotations, setAnnotations]   = useState([]);
  const [currentTool, setCurrentTool]   = useState('highlight');
  const [currentColor, setCurrentColor] = useState('#FFFF00');
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);

  /* ── toast ── */
  const [toast, setToast] = useState('');

  /* ── drag-to-select ── */
  const isDraggingRef = useRef(false);
  const dragStartRef  = useRef(null);
  const [dragPreview, setDragPreview] = useState(null);
  const [selection, setSelection]     = useState(null);

  /* ── note popup state ── */
  const [openNoteId, setOpenNoteId]       = useState(null);
  const [showNoteMenu, setShowNoteMenu]   = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteEditText, setNoteEditText]   = useState('');

  /* ── socket + user ── */
  const [socket, setSocket]       = useState(null);
  const [userColor, setUserColor] = useState('#FFFF00');

  /* ── track exact rendered page size (in pixels) ── */
  const [renderedPageSize, setRenderedPageSize] = useState({ width: 0, height: 0 });

  /* ── optional ResizeObserver to detect overlay size changes ── */
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });

  // Keep a ref to location.state so saveAnnotation always reads the latest
  // value without needing it in its dependency array.
  const locationStateRef = useRef(location.state);
  useEffect(() => {
    locationStateRef.current = location.state;
  }, [location.state]);

  /* ─────────────────────────────────────────────────────────
     PDF URL — depends ONLY on paperId so that navigating
     between papers always resets and re-fetches correctly.
     location.state is read via ref to avoid stale closure.
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    // Reset all per-paper state every time paperId changes
    setPdfUrl('');
    setLoading(true);
    setError(null);
    setNumPages(null);
    setPageNumber(1);
    setAnnotations([]);
    setSelection(null);
    setSelectedAnnotation(null);
    setOpenNoteId(null);
    setShowNoteMenu(false);
    setEditingNoteId(null);
    setNoteEditText('');
    setRenderedPageSize({ width: 0, height: 0 });

    const state = locationStateRef.current;

    if (state?.pdfUrl) {
      console.log('[PDFViewer] Using pdfUrl from navigation state:', state.pdfUrl);
      setPdfUrl(
        `${process.env.REACT_APP_BACKEND_URL}/api/pdf-proxy?url=${encodeURIComponent(state.pdfUrl)}`
      );
      setLoading(false);
    } else {
      console.log('[PDFViewer] No pdfUrl in state, fetching from API for paperId:', paperId);
      (async () => {
        try {
          const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/papers/${paperId}`);
          if (res.ok) {
            const data = await res.json();
            const url = data.openAccessPdf?.url;
            if (url) {
              setPdfUrl(
                `${process.env.REACT_APP_BACKEND_URL}/api/pdf-proxy?url=${encodeURIComponent(url)}`
              );
            } else {
              setError('No PDF available for this paper.');
            }
          } else {
            setError('Failed to fetch paper details.');
          }
        } catch {
          setError('Error fetching paper details.');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [paperId]);

  /* ─────────────────────────────────────────────────────────
     User color from localStorage
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user?.id) {
          const hash = user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const colors = ['#FFB6C1', '#ADD8E6', '#90EE90', '#FFD700', '#FFA07A', '#E0B0FF'];
          setUserColor(colors[hash % colors.length]);
        }
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  /* ─────────────────────────────────────────────────────────
     Socket — reconnects when paperId changes
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('joinPaper', { paperId });
    });

    newSocket.on('annotationUpdate', (updatedAnnotation) => {
      setAnnotations(prev => {
        const idx = prev.findIndex(a => a._id === updatedAnnotation._id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedAnnotation;
          return next;
        }
        return [...prev, updatedAnnotation];
      });
    });

    newSocket.on('annotationDelete', ({ id }) => {
      setAnnotations(prev => prev.filter(a => a._id !== id));
    });

    return () => newSocket.disconnect();
  }, [paperId]);

  /* ─────────────────────────────────────────────────────────
     Fetch existing annotations — re-fetches when paperId changes
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!paperId) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations/${paperId}`);
        if (res.ok) setAnnotations(await res.json());
      } catch (err) { console.error('Error fetching annotations', err); }
    })();
  }, [paperId]);

  /* ─────────────────────────────────────────────────────────
     Fullscreen
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!isFullscreen) containerRef.current.requestFullscreen();
    else document.exitFullscreen();
  }, [isFullscreen]);

  /* ─────────────────────────────────────────────────────────
     ResizeObserver to detect overlay size changes
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setPageSize({ width, height });
      }
    });

    if (overlayRef.current) {
      observer.observe(overlayRef.current);
    }

    return () => observer.disconnect();
  }, [pdfUrl]);

  /* ─────────────────────────────────────────────────────────
     Reset rendered page size when page or scale changes
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    setRenderedPageSize({ width: 0, height: 0 });
  }, [pageNumber, scale]);

  /* ─────────────────────────────────────────────────────────
     Keyboard nav
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowLeft')  setPageNumber(p => Math.max(p - 1, 1));
      if (e.key === 'ArrowRight') setPageNumber(p => Math.min(p + 1, numPages || 1));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [numPages]);

  const zoomIn  = () => setScale(p => Math.min(p + SCALE_STEP, MAX_SCALE));
  const zoomOut = () => setScale(p => Math.max(p - SCALE_STEP, MIN_SCALE));

  /* ─────────────────────────────────────────────────────────
     Toast helper
  ───────────────────────────────────────────────────────── */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  /* ─────────────────────────────────────────────────────────
     Tool button click
  ───────────────────────────────────────────────────────── */
  const handleToolClick = (tool) => {
    setCurrentTool(tool);
    if (!selection) {
      showToast('Please select an area on the PDF first, then click the tool.');
    } else {
      applyAnnotation(tool, selection);
    }
  };

  /* ─────────────────────────────────────────────────────────
     Drag to select
  ───────────────────────────────────────────────────────── */
  const getRatio = (e) => {
    const el = overlayRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    };
  };

  const handleOverlayMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target !== overlayRef.current) return;
    setSelection(null);
    setSelectedAnnotation(null);
    setOpenNoteId(null);
    setShowNoteMenu(false);
    const c = getRatio(e);
    if (!c) return;
    isDraggingRef.current = true;
    dragStartRef.current  = c;
    setDragPreview({ left: c.x, top: c.y, width: 0, height: 0 });
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDraggingRef.current || !dragStartRef.current) return;
      const c = getRatio(e); if (!c) return;
      const s = dragStartRef.current;
      setDragPreview({
        left: Math.min(s.x, c.x), top: Math.min(s.y, c.y),
        width: Math.abs(c.x - s.x), height: Math.abs(c.y - s.y),
      });
    };
    const onUp = (e) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const c = getRatio(e);
      const s = dragStartRef.current;
      dragStartRef.current = null;
      setDragPreview(null);
      if (!c || !s) return;
      const left = Math.min(s.x, c.x), top = Math.min(s.y, c.y);
      const width = Math.abs(c.x - s.x), height = Math.abs(c.y - s.y);
      if (width < 0.005 || height < 0.002) return;
      setSelection({ x: left, y: top, width, height });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  /* ─────────────────────────────────────────────────────────
     Save annotation
  ───────────────────────────────────────────────────────── */
  const saveAnnotation = async (type, position, content = '') => {
    const token = localStorage.getItem('access_token');
    let currentUserId = null;

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserId = payload.sub;
      } catch (e) {
        console.error('Failed to parse access token', e);
      }
    }

    if (!currentUserId) {
      showToast('Please log in to annotate.');
      return null;
    }

    const libraryId = locationStateRef.current?.libraryId || 'unknown';
    const dbPaperId = locationStateRef.current?.paperId   || null;

    const annotationData = {
      paperId,
      userId: currentUserId,
      libraryId,
      dbPaperId,
      pageNumber,
      type,
      position,
      content,
      color: currentColor,
    };

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotationData),
      });
      if (res.ok) {
        const newAnnotation = await res.json();
        setAnnotations(prev => [...prev, newAnnotation]);
        socket?.emit('annotationChanged', { paperId, annotation: newAnnotation });
        return newAnnotation;
      }
    } catch (err) { console.error('Error saving annotation', err); }
    return null;
  };

  /* ─────────────────────────────────────────────────────────
     Apply annotation
  ───────────────────────────────────────────────────────── */
  const applyAnnotation = async (type, sel) => {
    if (!sel) return;
    setSelection(null);
    const saved = await saveAnnotation(type, sel, noteEditText);
    if (!saved) return;
    if (type === 'note') {
      setOpenNoteId(saved._id);
      setEditingNoteId(saved._id);
      setNoteEditText('');
      setShowNoteMenu(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     Delete annotation
  ───────────────────────────────────────────────────────── */
  const deleteAnnotation = async (id) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAnnotations(prev => prev.filter(a => a._id !== id));
        socket?.emit('annotationChanged', { paperId, annotation: { id, deleted: true } });
      }
    } catch (err) { console.error('Error deleting annotation', err); }
    setSelectedAnnotation(null);
    setOpenNoteId(null);
    setShowNoteMenu(false);
    setEditingNoteId(null);
  };

  /* ─────────────────────────────────────────────────────────
     Save note edit
  ───────────────────────────────────────────────────────── */
  const saveNoteEdit = async (id, text) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAnnotations(prev => prev.map(a => a._id === id ? { ...a, content: text } : a));
        socket?.emit('annotationChanged', { paperId, annotation: updated });
      } else {
        setAnnotations(prev => prev.map(a => a._id === id ? { ...a, content: text } : a));
      }
    } catch (err) {
      console.error('Error updating note', err);
      setAnnotations(prev => prev.map(a => a._id === id ? { ...a, content: text } : a));
    }
    setEditingNoteId(null);
    setShowNoteMenu(false);
    setOpenNoteId(null);
  };

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  /* ─────────────────────────────────────────────────────────
     Callback to get exact rendered page dimensions
  ───────────────────────────────────────────────────────── */
  const onPageRenderSuccess = (page) => {
    const viewport = page.getViewport({ scale });
    setRenderedPageSize({ width: viewport.width, height: viewport.height });
  };

  /* ─────────────────────────────────────────────────────────
     Download annotated PDF — only highlights (including note areas)
     No note text or squares are drawn.
  ───────────────────────────────────────────────────────── */
  const downloadAnnotatedPDF = async () => {
    if (!pdfUrl) {
      showToast('No PDF available to download.');
      return;
    }

    showToast('Preparing PDF with annotations...');

    try {
      // 1. Fetch the original PDF as arrayBuffer
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error('Failed to fetch PDF');
      const pdfBytes = await response.arrayBuffer();

      // 2. Load PDF with pdf-lib
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      // 3. For each annotation, apply only the highlight rectangle
      for (const ann of annotations) {
        if (ann.isDeleted) continue;
        const pageIndex = ann.pageNumber - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;

        const page = pages[pageIndex];
        const { width: pageWidth, height: pageHeight } = page.getSize();

        // Convert percentage position to absolute points
        const x = ann.position.x * pageWidth;
        const y = pageHeight - ann.position.y * pageHeight; // flip Y
        const w = ann.position.width * pageWidth;
        const h = ann.position.height * pageHeight;

        // Parse color (#RRGGBB) to RGB components
        const colorHex = ann.color || '#FFFF00';
        const r = parseInt(colorHex.slice(1,3), 16) / 255;
        const g = parseInt(colorHex.slice(3,5), 16) / 255;
        const b = parseInt(colorHex.slice(5,7), 16) / 255;

        // Draw semi-transparent rectangle for both highlights and notes
        page.drawRectangle({
          x,
          y: y - h, // rectangle from bottom-left
          width: w,
          height: h,
          color: rgb(r, g, b),
          opacity: 0.45,
          blendMode: 'Multiply',
        });
      }

      // 4. Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();

      // 5. Trigger download
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `annotated-${paperId || 'document'}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      showToast('PDF downloaded with annotations!');
    } catch (err) {
      console.error('Error generating annotated PDF:', err);
      showToast('Failed to generate annotated PDF.');
    }
  };

  /* ─────────────────────────────────────────────────────────
     Render annotations
  ───────────────────────────────────────────────────────── */
  const renderAnnotations = () =>
    annotations
      .filter(a => a.pageNumber === pageNumber && !a.isDeleted)
      .map(ann => {
        const { x, y, width, height } = ann.position;

        if (ann.type === 'highlight') return (
          <div key={ann._id}
            onClick={(e) => { e.stopPropagation(); setSelectedAnnotation(ann); setOpenNoteId(null); }}
            style={{
              position: 'absolute',
              left: `${x * 100}%`, top: `${y * 100}%`,
              width: `${width * 100}%`, height: `${height * 100}%`,
              backgroundColor: ann.color || '#FFFF00',
              opacity: 0.45, mixBlendMode: 'multiply',
              cursor: 'pointer', pointerEvents: 'auto',
            }}
          />
        );

        if (ann.type === 'note') {
          const isOpen    = openNoteId === ann._id;
          const isEditing = editingNoteId === ann._id;

          return (
            <React.Fragment key={ann._id}>
              <div style={{
                position: 'absolute',
                left: `${x * 100}%`, top: `${y * 100}%`,
                width: `${width * 100}%`, height: `${height * 100}%`,
                backgroundColor: ann.color || '#FFFF00',
                opacity: 0.45, mixBlendMode: 'multiply',
                pointerEvents: 'none',
              }} />

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOpen) {
                    setOpenNoteId(null); setShowNoteMenu(false); setEditingNoteId(null);
                  } else {
                    setOpenNoteId(ann._id); setShowNoteMenu(false);
                    setEditingNoteId(null); setNoteEditText(ann.content || '');
                  }
                  setSelectedAnnotation(null);
                }}
                style={{
                  position: 'absolute',
                  left: `${x * 100}%`, top: `${y * 100}%`,
                  transform: 'translate(-2px, -100%)',
                  cursor: 'pointer', pointerEvents: 'auto', zIndex: 20,
                }}
              >
                <NoteIcon color={ann.color || '#FFFF00'} />
              </div>

              {isOpen && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, zIndex: 300, pointerEvents: 'auto', width: 340 }}
                >
                  {/* Note popup content (same as before) */}
                  <div style={{
                    background: `color-mix(in srgb, ${ann.color || '#FFFF00'} 10%, white)`,
                    border: '1px solid rgba(0,0,0,0.15)',
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    overflow: 'visible', position: 'relative',
                  }}>
                    <div style={{
                      display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                      padding: '8px 10px 0', gap: 8, position: 'relative',
                      background: `color-mix(in srgb, ${ann.color || '#FFFF00'} 60%, white)`,
                      borderRadius: '8px 8px 0 0',
                    }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowNoteMenu(v => !v); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888', padding: '0 4px', lineHeight: 1, letterSpacing: 1 }}
                        title="Options"
                      >···</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenNoteId(null); setShowNoteMenu(false); setEditingNoteId(null); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#888', padding: '0 2px', lineHeight: 1 }}
                        title="Close"
                      >✕</button>

                      {showNoteMenu && (
                        <div
                          onMouseDown={(e) => e.stopPropagation()}
                          style={{
                            position: 'absolute', top: 32, right: 0,
                            background: '#fff', border: '1px solid #e0e0e0',
                            borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
                            zIndex: 400, overflow: 'hidden', minWidth: 130,
                          }}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann._id); }}
                            style={{ width: '100%', padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#3E513E', borderBottom: '1px solid #f0f0f0', textAlign: 'left' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e8f0e8'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >Delete</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingNoteId(ann._id); setNoteEditText(ann.content || ''); setShowNoteMenu(false); }}
                            style={{ width: '100%', padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#333', textAlign: 'left' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >Edit</button>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '8px 16px 12px', minHeight: 120 }}>
                      {isEditing ? (
                        <textarea
                          autoFocus value={noteEditText}
                          onChange={(e) => {
                            const text = e.target.value;
                            setNoteEditText(text);
                            setAnnotations(prev =>
                              prev.map(a => a._id === ann._id ? { ...a, content: text } : a)
                            );
                          }}
                          style={{ width: '100%', minHeight: 100, border: 'none', background: 'transparent', fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none', color: '#333', boxSizing: 'border-box' }}
                          placeholder="Enter your comment here..."
                        />
                      ) : (
                        <div style={{ fontSize: 14, color: ann.content ? '#333' : '#bbb', minHeight: 100, whiteSpace: 'pre-wrap' }}>
                          {ann.content || 'Enter your comment here...'}
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 12px 10px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); saveNoteEdit(ann._id, noteEditText); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#555' }}
                          title="Save"
                        >✓</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        }

        return null;
      });

  /* ─────────────────────────────────────────────────────────
     Highlight delete popup
  ───────────────────────────────────────────────────────── */
  const renderHighlightDeletePopup = () => {
    if (!selectedAnnotation || selectedAnnotation.type !== 'highlight') return null;
    const { x, y, height } = selectedAnnotation.position;
    return (
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: `${x * 100}%`, top: `calc(${(y + height) * 100}% + 6px)`,
          zIndex: 200, pointerEvents: 'auto',
          background: '#fff', border: '1px solid #e0e0e0',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          padding: '12px 16px', minWidth: 180,
        }}
      >
        <div style={{ fontSize: 13, color: '#333', marginBottom: 10, fontWeight: 500 }}>
          Remove this highlight?
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => deleteAnnotation(selectedAnnotation._id)}
            style={{ padding: '6px 12px', background: '#3E513E', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
          >Delete</button>
          <button
            onClick={() => setSelectedAnnotation(null)}
            style={{ padding: '6px 12px', background: '#f0f0f0', color: '#333', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
          >Cancel</button>
        </div>
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────
     Loading / error states
  ───────────────────────────────────────────────────────── */
  if (loading) return (
    <>
      <Navbar />
      <div style={{ paddingTop: 80, paddingLeft: 40, paddingRight: 40, background: '#f0f0f0', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: 18, color: '#666' }}>Loading PDF viewer...</div>
      </div>
    </>
  );
  if (error) return (
    <>
      <Navbar />
      <div style={{ paddingTop: 80, paddingLeft: 40, paddingRight: 40, background: '#f0f0f0', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: 18, color: '#d32f2f' }}>Error: {error}</div>
      </div>
    </>
  );
  if (!pdfUrl) return (
    <>
      <Navbar />
      <div style={{ paddingTop: 80, paddingLeft: 40, paddingRight: 40, background: '#f0f0f0', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: 18, color: '#666' }}>No PDF URL available.</div>
      </div>
    </>
  );

  /* ─────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────── */
  return (
    <>
      <Navbar />

      {toast && (
        <div style={{
          position: 'fixed', top: 90, left: '50%', transform: 'translateX(-50%)',
          background: '#323232', color: '#fff', padding: '10px 20px',
          borderRadius: 6, fontSize: 13, zIndex: 9999, pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {toast}
        </div>
      )}

      <div style={{
        paddingTop: 80, paddingLeft: 40, paddingRight: 40, paddingBottom: 40,
        background: '#f0f0f0', minHeight: 'calc(100vh - 80px)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Toolbar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
          background: '#fff', padding: '12px 20px', borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', gap: 8, alignItems: 'center' }}>
            <button onClick={() => handleToolClick('highlight')} style={btnBase(currentTool === 'highlight')}>Highlight</button>
            <button onClick={() => handleToolClick('note')}      style={btnBase(currentTool === 'note')}>Note</button>
            <input type="color" value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              style={{ width: 32, height: 32, padding: 2, border: '1px solid #e0e0e0', borderRadius: 4, cursor: 'pointer', marginLeft: 4 }}
              title="Color"
            />
          </div>

          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={zoomOut} disabled={scale <= MIN_SCALE} style={navBtn(scale <= MIN_SCALE)}>−</button>
            <span style={{ fontSize: 12, color: '#333', minWidth: 50, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn}  disabled={scale >= MAX_SCALE} style={navBtn(scale >= MAX_SCALE)}>+</button>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
            <button onClick={toggleFullscreen} style={navBtn(false)} title="Fullscreen">⛶</button>
            <button onClick={downloadAnnotatedPDF} style={navBtn(false)} title="Download PDF with annotations (highlights only)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)} style={navBtn(pageNumber <= 1)} title="Previous page (←)">◀</button>
            <span style={{ fontSize: 12, color: '#333', whiteSpace: 'nowrap' }}>{pageNumber} / {numPages}</span>
            <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)} style={navBtn(pageNumber >= numPages)} title="Next page (→)">▶</button>
          </div>
        </div>

        {/* ── PDF viewer ── */}
        <div
          ref={containerRef}
          style={{
            flex: 1, overflow: 'auto', background: '#fff',
            borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            padding: 20, display: 'flex', justifyContent: 'center',
          }}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Document
              key={pdfUrl}
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading="Loading PDF..."
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onRenderSuccess={onPageRenderSuccess}
              />
            </Document>

            <div
              ref={overlayRef}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: renderedPageSize.width ? `${renderedPageSize.width}px` : '100%',
                height: renderedPageSize.height ? `${renderedPageSize.height}px` : '100%',
                cursor: 'crosshair', userSelect: 'none',
              }}
              onMouseDown={handleOverlayMouseDown}
            >
              {dragPreview && dragPreview.width > 0 && (
                <div style={{
                  position: 'absolute',
                  left: `${dragPreview.left * 100}%`, top: `${dragPreview.top * 100}%`,
                  width: `${dragPreview.width * 100}%`, height: `${dragPreview.height * 100}%`,
                  background: 'rgba(66,133,244,0.15)', border: '1.5px dashed #4285f4',
                  pointerEvents: 'none',
                }} />
              )}

              {selection && (
                <div style={{
                  position: 'absolute',
                  left: `${selection.x * 100}%`, top: `${selection.y * 100}%`,
                  width: `${selection.width * 100}%`, height: `${selection.height * 100}%`,
                  background: 'rgba(66,133,244,0.12)', border: '1.5px solid #4285f4',
                  pointerEvents: 'none',
                }} />
              )}

              {renderAnnotations()}
              {renderHighlightDeletePopup()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PDFViewer;