// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import { Document, Page, pdfjs } from 'react-pdf';
// import io from 'socket.io-client';
// import Navbar from '../components/Navbar';
// import { PDFDocument, rgb } from 'pdf-lib';

// pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// /* ─── style helpers ─────────────────────────────────────── */
// const btnBase = (active) => ({
//   padding: '6px 12px',
//   background: active ? '#e0e0e0' : '#fff',
//   border: '1px solid #e0e0e0',
//   borderRadius: 4,
//   fontSize: 12,
//   color: '#333',
//   cursor: 'pointer',
//   fontWeight: active ? 600 : 400,
// });

// const navBtn = (disabled) => ({
//   padding: '6px 10px',
//   background: disabled ? '#f0f0f0' : '#fff',
//   border: '1px solid #e0e0e0',
//   borderRadius: 4,
//   fontSize: 14,
//   color: disabled ? '#999' : '#333',
//   cursor: disabled ? 'not-allowed' : 'pointer',
//   fontWeight: 'bold',
//   lineHeight: 1,
//   display: 'inline-flex',
//   alignItems: 'center',
//   justifyContent: 'center',
// });

// /* ─── Hover tooltip ──────────────────────────────────────── */
// const HoverTooltip = ({ userName, color }) => (
//   <div style={{
//     position: 'absolute',
//     bottom: 'calc(100% + 6px)',
//     left: '50%',
//     transform: 'translateX(-50%)',
//     background: '#1a1a1a',
//     color: '#fff',
//     fontSize: 11,
//     fontWeight: 500,
//     padding: '4px 9px',
//     borderRadius: 5,
//     whiteSpace: 'nowrap',
//     pointerEvents: 'none',
//     zIndex: 500,
//     boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
//     display: 'flex',
//     alignItems: 'center',
//     gap: 5,
//   }}>
//     <span style={{
//       display: 'inline-block',
//       width: 8,
//       height: 8,
//       borderRadius: '50%',
//       background: color || '#FFFF00',
//       border: '1px solid rgba(255,255,255,0.3)',
//       flexShrink: 0,
//     }} />
//     {userName || 'Unknown'}
//     <span style={{
//       position: 'absolute',
//       top: '100%',
//       left: '50%',
//       transform: 'translateX(-50%)',
//       width: 0,
//       height: 0,
//       borderLeft: '5px solid transparent',
//       borderRight: '5px solid transparent',
//       borderTop: '5px solid #1a1a1a',
//     }} />
//   </div>
// );

// /* ─── Note icon SVG ──────────────────────────────────────── */
// const NoteIcon = ({ color = '#FFFF00' }) => (
//   <svg width="16" height="16" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <rect x="1" y="1" width="20" height="20" rx="3" fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth="1.2"/>
//     <rect x="1" y="1" width="20" height="6" rx="3" fill="rgba(0,0,0,0.18)" strokeWidth="0"/>
//     <rect x="1" y="4" width="20" height="3" fill="rgba(0,0,0,0.18)" strokeWidth="0"/>
//     <line x1="5" y1="11" x2="17" y2="11" stroke="rgba(0,0,0,0.35)" strokeWidth="1.2"/>
//     <line x1="5" y1="14" x2="17" y2="14" stroke="rgba(0,0,0,0.35)" strokeWidth="1.2"/>
//     <line x1="5" y1="17" x2="12" y2="17" stroke="rgba(0,0,0,0.35)" strokeWidth="1.2"/>
//   </svg>
// );

// /* ═══════════════════════════════════════════════════════════ */
// const PDFViewer = () => {
//   const { paperId } = useParams();
//   const navigate    = useNavigate();
//   const location    = useLocation();

//   /* ── core state ── */
//   const [numPages, setNumPages]     = useState(null);
//   const [pageNumber, setPageNumber] = useState(1);
//   const [pdfUrl, setPdfUrl]         = useState('');
//   const [loading, setLoading]       = useState(true);
//   const [error, setError]           = useState(null);

//   const [scale, setScale] = useState(1.0);
//   const MIN_SCALE = 0.5, MAX_SCALE = 3.0, SCALE_STEP = 0.25;

//   const containerRef = useRef(null);
//   const overlayRef   = useRef(null);
//   const [isFullscreen, setIsFullscreen] = useState(false);

//   /* ── annotations ── */
//   const [annotations, setAnnotations]   = useState([]);
//   const [currentTool, setCurrentTool]   = useState('highlight');
//   const [currentColor, setCurrentColor] = useState('#FFFF00');
//   const [selectedAnnotation, setSelectedAnnotation] = useState(null);

//   /* ── hover tooltip ── */
//   const [hoveredAnnotationId, setHoveredAnnotationId] = useState(null);

//   /* ── toast ── */
//   const [toast, setToast] = useState('');

//   /* ── drag-to-select ── */
//   const isDraggingRef = useRef(false);
//   const dragStartRef  = useRef(null);
//   const [dragPreview, setDragPreview] = useState(null);
//   const [selection, setSelection]     = useState(null);

//   /* ── note popup state ── */
//   const [openNoteId, setOpenNoteId]       = useState(null);
//   const [showNoteMenu, setShowNoteMenu]   = useState(false);
//   const [editingNoteId, setEditingNoteId] = useState(null);
//   const [noteEditText, setNoteEditText]   = useState('');

//   /* ── socket ── */
//   const [socket, setSocket] = useState(null);

//   /* ── track exact rendered page size (in pixels) ── */
//   const [renderedPageSize, setRenderedPageSize] = useState({ width: 0, height: 0 });
//   const [pageSize, setPageSize] = useState({ width: 0, height: 0 });

//   const locationStateRef = useRef(location.state);
//   useEffect(() => {
//     locationStateRef.current = location.state;
//   }, [location.state]);

//   /* ─────────────────────────────────────────────────────────
//      PDF URL
//   ───────────────────────────────────────────────────────── */
//   useEffect(() => {
//     setPdfUrl('');
//     setLoading(true);
//     setError(null);
//     setNumPages(null);
//     setPageNumber(1);
//     setAnnotations([]);
//     setSelection(null);
//     setSelectedAnnotation(null);
//     setOpenNoteId(null);
//     setShowNoteMenu(false);
//     setEditingNoteId(null);
//     setNoteEditText('');
//     setRenderedPageSize({ width: 0, height: 0 });
//     setHoveredAnnotationId(null);

//     const state = locationStateRef.current;

//     if (state?.pdfUrl) {
//       setPdfUrl(
//         `${process.env.REACT_APP_BACKEND_URL}/api/pdf-proxy?url=${encodeURIComponent(state.pdfUrl)}`
//       );
//       setLoading(false);
//     } else {
//       (async () => {
//         try {
//           const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/papers/${paperId}`);
//           if (res.ok) {
//             const data = await res.json();
//             const url = data.openAccessPdf?.url;
//             if (url) {
//               setPdfUrl(
//                 `${process.env.REACT_APP_BACKEND_URL}/api/pdf-proxy?url=${encodeURIComponent(url)}`
//               );
//             } else {
//               setError('No PDF available for this paper.');
//             }
//           } else {
//             setError('Failed to fetch paper details.');
//           }
//         } catch {
//           setError('Error fetching paper details.');
//         } finally {
//           setLoading(false);
//         }
//       })();
//     }
//   }, [paperId]);

//   /* ─────────────────────────────────────────────────────────
//      Socket
//   ───────────────────────────────────────────────────────── */
//   useEffect(() => {
//     const newSocket = io(process.env.REACT_APP_BACKEND_URL);
//     setSocket(newSocket);
//     newSocket.on('connect', () => newSocket.emit('joinPaper', { paperId }));
//     newSocket.on('annotationUpdate', (updatedAnnotation) => {
//       setAnnotations(prev => {
//         const idx = prev.findIndex(a => a._id === updatedAnnotation._id);
//         if (idx >= 0) { const next = [...prev]; next[idx] = updatedAnnotation; return next; }
//         return [...prev, updatedAnnotation];
//       });
//     });
//     newSocket.on('annotationDelete', ({ id }) => {
//       setAnnotations(prev => prev.filter(a => a._id !== id));
//     });
//     return () => newSocket.disconnect();
//   }, [paperId]);

//   /* ─────────────────────────────────────────────────────────
//      Fetch annotations — userName is now included by backend
//   ───────────────────────────────────────────────────────── */
//   useEffect(() => {
//     if (!paperId) return;
//     (async () => {
//       try {
//         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations/${paperId}`);
//         if (res.ok) setAnnotations(await res.json());
//       } catch (err) { console.error('Error fetching annotations', err); }
//     })();
//   }, [paperId]);

//   /* ─────────────────────────────────────────────────────────
//      Fullscreen
//   ───────────────────────────────────────────────────────── */
//   useEffect(() => {
//     const h = () => setIsFullscreen(!!document.fullscreenElement);
//     document.addEventListener('fullscreenchange', h);
//     return () => document.removeEventListener('fullscreenchange', h);
//   }, []);

//   const toggleFullscreen = useCallback(() => {
//     if (!containerRef.current) return;
//     if (!isFullscreen) containerRef.current.requestFullscreen();
//     else document.exitFullscreen();
//   }, [isFullscreen]);

//   /* ─────────────────────────────────────────────────────────
//      ResizeObserver
//   ───────────────────────────────────────────────────────── */
//   useEffect(() => {
//     const observer = new ResizeObserver((entries) => {
//       for (const entry of entries) {
//         const { width, height } = entry.contentRect;
//         setPageSize({ width, height });
//       }
//     });
//     if (overlayRef.current) observer.observe(overlayRef.current);
//     return () => observer.disconnect();
//   }, [pdfUrl]);

//   useEffect(() => {
//     setRenderedPageSize({ width: 0, height: 0 });
//   }, [pageNumber, scale]);

//   /* ─────────────────────────────────────────────────────────
//      Keyboard nav
//   ───────────────────────────────────────────────────────── */
//   useEffect(() => {
//     const h = (e) => {
//       if (e.key === 'ArrowLeft')  setPageNumber(p => Math.max(p - 1, 1));
//       if (e.key === 'ArrowRight') setPageNumber(p => Math.min(p + 1, numPages || 1));
//     };
//     window.addEventListener('keydown', h);
//     return () => window.removeEventListener('keydown', h);
//   }, [numPages]);

//   const zoomIn  = () => setScale(p => Math.min(p + SCALE_STEP, MAX_SCALE));
//   const zoomOut = () => setScale(p => Math.max(p - SCALE_STEP, MIN_SCALE));

//   /* ─────────────────────────────────────────────────────────
//      Toast
//   ───────────────────────────────────────────────────────── */
//   const showToast = (msg) => {
//     setToast(msg);
//     setTimeout(() => setToast(''), 2200);
//   };

//   /* ─────────────────────────────────────────────────────────
//      Tool button click
//   ───────────────────────────────────────────────────────── */
//   const handleToolClick = (tool) => {
//     setCurrentTool(tool);
//     if (!selection) {
//       showToast('Please select an area on the PDF first, then click the tool.');
//     } else {
//       applyAnnotation(tool, selection);
//     }
//   };

//   /* ─────────────────────────────────────────────────────────
//      Drag to select
//   ───────────────────────────────────────────────────────── */
//   const getRatio = (e) => {
//     const el = overlayRef.current;
//     if (!el) return null;
//     const r = el.getBoundingClientRect();
//     return {
//       x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
//       y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
//     };
//   };

//   const handleOverlayMouseDown = (e) => {
//     if (e.button !== 0) return;
//     if (e.target !== overlayRef.current) return;
//     setSelection(null);
//     setSelectedAnnotation(null);
//     setOpenNoteId(null);
//     setShowNoteMenu(false);
//     setHoveredAnnotationId(null);
//     const c = getRatio(e);
//     if (!c) return;
//     isDraggingRef.current = true;
//     dragStartRef.current  = c;
//     setDragPreview({ left: c.x, top: c.y, width: 0, height: 0 });
//     e.preventDefault();
//   };

//   useEffect(() => {
//     const onMove = (e) => {
//       if (!isDraggingRef.current || !dragStartRef.current) return;
//       const c = getRatio(e); if (!c) return;
//       const s = dragStartRef.current;
//       setDragPreview({
//         left: Math.min(s.x, c.x), top: Math.min(s.y, c.y),
//         width: Math.abs(c.x - s.x), height: Math.abs(c.y - s.y),
//       });
//     };
//     const onUp = (e) => {
//       if (!isDraggingRef.current) return;
//       isDraggingRef.current = false;
//       const c = getRatio(e);
//       const s = dragStartRef.current;
//       dragStartRef.current = null;
//       setDragPreview(null);
//       if (!c || !s) return;
//       const left = Math.min(s.x, c.x), top = Math.min(s.y, c.y);
//       const width = Math.abs(c.x - s.x), height = Math.abs(c.y - s.y);
//       if (width < 0.005 || height < 0.002) return;
//       setSelection({ x: left, y: top, width, height });
//     };
//     window.addEventListener('mousemove', onMove);
//     window.addEventListener('mouseup', onUp);
//     return () => {
//       window.removeEventListener('mousemove', onMove);
//       window.removeEventListener('mouseup', onUp);
//     };
//   }, []);

//   /* ─────────────────────────────────────────────────────────
//      Save annotation
//   ───────────────────────────────────────────────────────── */
//   const saveAnnotation = async (type, position, content = '') => {
//     const token = localStorage.getItem('access_token');
//     let currentUserId = null;

//     if (token) {
//       try {
//         const payload = JSON.parse(atob(token.split('.')[1]));
//         currentUserId = payload.sub;
//       } catch (e) {
//         console.error('Failed to parse access token', e);
//       }
//     }

//     if (!currentUserId) {
//       showToast('Please log in to annotate.');
//       return null;
//     }

//     const libraryId = locationStateRef.current?.libraryId || 'unknown';
//     const dbPaperId = locationStateRef.current?.paperId   || null;

//     const annotationData = {
//       paperId,
//       userId: currentUserId,
//       libraryId,
//       dbPaperId,
//       pageNumber,
//       type,
//       position,
//       content,
//       color: currentColor,
//     };

//     try {
//       const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(annotationData),
//       });
//       if (res.ok) {
//         const newAnnotation = await res.json();

//         // Attach the current user's name for immediate display (no re-fetch needed)
//         let userName = 'You';
//         try {
//           const userData = localStorage.getItem('user');
//           if (userData) userName = JSON.parse(userData).name || 'You';
//         } catch {}

//         const enriched = { ...newAnnotation, userName };
//         setAnnotations(prev => [...prev, enriched]);
//         socket?.emit('annotationChanged', { paperId, annotation: enriched });
//         return enriched;
//       }
//     } catch (err) { console.error('Error saving annotation', err); }
//     return null;
//   };

//   /* ─────────────────────────────────────────────────────────
//      Apply annotation
//   ───────────────────────────────────────────────────────── */
//   const applyAnnotation = async (type, sel) => {
//     if (!sel) return;
//     setSelection(null);
//     const saved = await saveAnnotation(type, sel, noteEditText);
//     if (!saved) return;
//     if (type === 'note') {
//       setOpenNoteId(saved._id);
//       setEditingNoteId(saved._id);
//       setNoteEditText('');
//       setShowNoteMenu(false);
//     }
//   };

//   /* ─────────────────────────────────────────────────────────
//      Delete annotation
//   ───────────────────────────────────────────────────────── */
//   const deleteAnnotation = async (id) => {
//     try {
//       const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations/${id}`, {
//         method: 'DELETE',
//       });
//       if (res.ok) {
//         setAnnotations(prev => prev.filter(a => a._id !== id));
//         socket?.emit('annotationChanged', { paperId, annotation: { id, deleted: true } });
//       }
//     } catch (err) { console.error('Error deleting annotation', err); }
//     setSelectedAnnotation(null);
//     setOpenNoteId(null);
//     setShowNoteMenu(false);
//     setEditingNoteId(null);
//     setHoveredAnnotationId(null);
//   };

//   /* ─────────────────────────────────────────────────────────
//      Save note edit
//   ───────────────────────────────────────────────────────── */
//   const saveNoteEdit = async (id, text) => {
//     try {
//       const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations/${id}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ content: text }),
//       });
//       if (res.ok) {
//         const updated = await res.json();
//         setAnnotations(prev => prev.map(a => a._id === id ? { ...a, content: text } : a));
//         socket?.emit('annotationChanged', { paperId, annotation: updated });
//       } else {
//         setAnnotations(prev => prev.map(a => a._id === id ? { ...a, content: text } : a));
//       }
//     } catch (err) {
//       console.error('Error updating note', err);
//       setAnnotations(prev => prev.map(a => a._id === id ? { ...a, content: text } : a));
//     }
//     setEditingNoteId(null);
//     setShowNoteMenu(false);
//     setOpenNoteId(null);
//   };

//   const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

//   const onPageRenderSuccess = (page) => {
//     const viewport = page.getViewport({ scale });
//     setRenderedPageSize({ width: viewport.width, height: viewport.height });
//   };

//   /* ─────────────────────────────────────────────────────────
//      Download annotated PDF
//   ───────────────────────────────────────────────────────── */
//   const downloadAnnotatedPDF = async () => {
//     if (!pdfUrl) { showToast('No PDF available to download.'); return; }
//     showToast('Preparing PDF with annotations...');
//     try {
//       const response = await fetch(pdfUrl);
//       if (!response.ok) throw new Error('Failed to fetch PDF');
//       const pdfBytes = await response.arrayBuffer();
//       const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
//       const pages = pdfDoc.getPages();
//       if (!pages || pages.length === 0) { showToast('Could not parse PDF pages for download.'); return; }

//       for (const ann of annotations) {
//         if (ann.isDeleted) continue;
//         const pageIndex = ann.pageNumber - 1;
//         if (pageIndex < 0 || pageIndex >= pages.length) continue;
//         const page = pages[pageIndex];
//         if (!page) continue;
//         const { width: pageWidth, height: pageHeight } = page.getSize();
//         const x = ann.position.x * pageWidth;
//         const y = pageHeight - ann.position.y * pageHeight;
//         const w = ann.position.width * pageWidth;
//         const h = ann.position.height * pageHeight;
//         const colorHex = ann.color || '#FFFF00';
//         const r = parseInt(colorHex.slice(1, 3), 16) / 255;
//         const g = parseInt(colorHex.slice(3, 5), 16) / 255;
//         const b = parseInt(colorHex.slice(5, 7), 16) / 255;
//         page.drawRectangle({ x, y: y - h, width: w, height: h, color: rgb(r, g, b), opacity: 0.45 });
//       }

//       const modifiedPdfBytes = await pdfDoc.save();
//       const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `annotated-${paperId || 'document'}.pdf`;
//       link.click();
//       window.URL.revokeObjectURL(url);
//       showToast('PDF downloaded with annotations!');
//     } catch (err) {
//       console.error('Error generating annotated PDF:', err);
//       showToast('Failed to generate annotated PDF: ' + err.message);
//     }
//   };

//   /* ─────────────────────────────────────────────────────────
//      Render annotations — with hover tooltip showing username
//   ───────────────────────────────────────────────────────── */
//   const renderAnnotations = () =>
//     annotations
//       .filter(a => a.pageNumber === pageNumber && !a.isDeleted)
//       .map(ann => {
//         const { x, y, width, height } = ann.position;
//         const isHovered = hoveredAnnotationId === ann._id;

//         if (ann.type === 'highlight') return (
//           <div
//             key={ann._id}
//             onClick={(e) => { e.stopPropagation(); setSelectedAnnotation(ann); setOpenNoteId(null); }}
//             onMouseEnter={() => setHoveredAnnotationId(ann._id)}
//             onMouseLeave={() => setHoveredAnnotationId(null)}
//             style={{
//               position: 'absolute',
//               left: `${x * 100}%`, top: `${y * 100}%`,
//               width: `${width * 100}%`, height: `${height * 100}%`,
//               backgroundColor: ann.color || '#FFFF00',
//               opacity: isHovered ? 0.65 : 0.45,
//               mixBlendMode: 'multiply',
//               cursor: 'pointer', pointerEvents: 'auto',
//               transition: 'opacity 0.15s ease',
//             }}
//           >
//             {isHovered && <HoverTooltip userName={ann.userName} color={ann.color} />}
//           </div>
//         );

//         if (ann.type === 'note') {
//           const isOpen    = openNoteId === ann._id;
//           const isEditing = editingNoteId === ann._id;

//           return (
//             <React.Fragment key={ann._id}>
//               {/* Highlighted area behind note */}
//               <div style={{
//                 position: 'absolute',
//                 left: `${x * 100}%`, top: `${y * 100}%`,
//                 width: `${width * 100}%`, height: `${height * 100}%`,
//                 backgroundColor: ann.color || '#FFFF00',
//                 opacity: 0.45, mixBlendMode: 'multiply',
//                 pointerEvents: 'none',
//               }} />

//               {/* Note icon — shows tooltip on hover when popup is closed */}
//               <div
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   if (isOpen) {
//                     setOpenNoteId(null); setShowNoteMenu(false); setEditingNoteId(null);
//                   } else {
//                     setOpenNoteId(ann._id); setShowNoteMenu(false);
//                     setEditingNoteId(null); setNoteEditText(ann.content || '');
//                   }
//                   setSelectedAnnotation(null);
//                 }}
//                 onMouseEnter={() => setHoveredAnnotationId(ann._id)}
//                 onMouseLeave={() => setHoveredAnnotationId(null)}
//                 style={{
//                   position: 'absolute',
//                   left: `${x * 100}%`, top: `${y * 100}%`,
//                   transform: 'translate(-2px, -100%)',
//                   cursor: 'pointer', pointerEvents: 'auto', zIndex: 20,
//                 }}
//               >
//                 <NoteIcon color={ann.color || '#FFFF00'} />
//                 {isHovered && !isOpen && (
//                   <HoverTooltip userName={ann.userName} color={ann.color} />
//                 )}
//               </div>

//               {/* Note popup — username shown in header */}
//               {isOpen && (
//                 <div
//                   onMouseDown={(e) => e.stopPropagation()}
//                   style={{
//                     position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`,
//                     zIndex: 300, pointerEvents: 'auto', width: 340,
//                   }}
//                 >
//                   <div style={{
//                     background: `color-mix(in srgb, ${ann.color || '#FFFF00'} 10%, white)`,
//                     border: '1px solid rgba(0,0,0,0.15)',
//                     borderRadius: 8,
//                     boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
//                     overflow: 'visible', position: 'relative',
//                   }}>
//                     {/* Header row: username left, actions right */}
//                     <div style={{
//                       display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                       padding: '8px 10px 6px 14px',
//                       background: `color-mix(in srgb, ${ann.color || '#FFFF00'} 60%, white)`,
//                       borderRadius: '8px 8px 0 0',
//                     }}>
//                       <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.6)', letterSpacing: 0.2 }}>
//                         {ann.userName || 'Unknown'}
//                       </span>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
//                         <button
//                           onClick={(e) => { e.stopPropagation(); setShowNoteMenu(v => !v); }}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888', padding: '0 4px', lineHeight: 1, letterSpacing: 1 }}
//                           title="Options"
//                         >···</button>
//                         <button
//                           onClick={(e) => { e.stopPropagation(); setOpenNoteId(null); setShowNoteMenu(false); setEditingNoteId(null); }}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#888', padding: '0 2px', lineHeight: 1 }}
//                           title="Close"
//                         >✕</button>

//                         {showNoteMenu && (
//                           <div
//                             onMouseDown={(e) => e.stopPropagation()}
//                             style={{
//                               position: 'absolute', top: 32, right: 0,
//                               background: '#fff', border: '1px solid #e0e0e0',
//                               borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
//                               zIndex: 400, overflow: 'hidden', minWidth: 130,
//                             }}
//                           >
//                             <button
//                               onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann._id); }}
//                               style={{ width: '100%', padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#3E513E', borderBottom: '1px solid #f0f0f0', textAlign: 'left' }}
//                               onMouseEnter={e => e.currentTarget.style.background = '#e8f0e8'}
//                               onMouseLeave={e => e.currentTarget.style.background = 'none'}
//                             >Delete</button>
//                             <button
//                               onClick={(e) => { e.stopPropagation(); setEditingNoteId(ann._id); setNoteEditText(ann.content || ''); setShowNoteMenu(false); }}
//                               style={{ width: '100%', padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#333', textAlign: 'left' }}
//                               onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
//                               onMouseLeave={e => e.currentTarget.style.background = 'none'}
//                             >Edit</button>
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     <div style={{ padding: '8px 16px 12px', minHeight: 120 }}>
//                       {isEditing ? (
//                         <textarea
//                           autoFocus value={noteEditText}
//                           onChange={(e) => {
//                             const text = e.target.value;
//                             setNoteEditText(text);
//                             setAnnotations(prev =>
//                               prev.map(a => a._id === ann._id ? { ...a, content: text } : a)
//                             );
//                           }}
//                           style={{ width: '100%', minHeight: 100, border: 'none', background: 'transparent', fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none', color: '#333', boxSizing: 'border-box' }}
//                           placeholder="Enter your comment here..."
//                         />
//                       ) : (
//                         <div style={{ fontSize: 14, color: ann.content ? '#333' : '#bbb', minHeight: 100, whiteSpace: 'pre-wrap' }}>
//                           {ann.content || 'Enter your comment here...'}
//                         </div>
//                       )}
//                     </div>

//                     {isEditing && (
//                       <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 12px 10px' }}>
//                         <button
//                           onClick={(e) => { e.stopPropagation(); saveNoteEdit(ann._id, noteEditText); }}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#555' }}
//                           title="Save"
//                         >✓</button>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </React.Fragment>
//           );
//         }

//         return null;
//       });

//   /* ─────────────────────────────────────────────────────────
//      Highlight delete popup
//   ───────────────────────────────────────────────────────── */
//   const renderHighlightDeletePopup = () => {
//     if (!selectedAnnotation || selectedAnnotation.type !== 'highlight') return null;
//     const { x, y, height } = selectedAnnotation.position;
//     return (
//       <div
//         onMouseDown={(e) => e.stopPropagation()}
//         style={{
//           position: 'absolute',
//           left: `${x * 100}%`, top: `calc(${(y + height) * 100}% + 6px)`,
//           zIndex: 200, pointerEvents: 'auto',
//           background: '#fff', border: '1px solid #e0e0e0',
//           borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
//           padding: '12px 16px', minWidth: 180,
//         }}
//       >
//         <div style={{ fontSize: 13, color: '#333', marginBottom: 10, fontWeight: 500 }}>
//           Remove this highlight?
//         </div>
//         <div style={{ display: 'flex', gap: 8 }}>
//           <button
//             onClick={() => deleteAnnotation(selectedAnnotation._id)}
//             style={{ padding: '6px 12px', background: '#3E513E', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
//           >Delete</button>
//           <button
//             onClick={() => setSelectedAnnotation(null)}
//             style={{ padding: '6px 12px', background: '#f0f0f0', color: '#333', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
//           >Cancel</button>
//         </div>
//       </div>
//     );
//   };

//   /* ─────────────────────────────────────────────────────────
//      Loading / error states
//   ───────────────────────────────────────────────────────── */
//   if (loading) return (
//     <>
//       <Navbar />
//       <div style={{ paddingTop: 80, paddingLeft: 40, paddingRight: 40, background: '#f0f0f0', minHeight: '100vh' }}>
//         <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: 18, color: '#666' }}>Loading PDF viewer...</div>
//       </div>
//     </>
//   );
//   if (error) return (
//     <>
//       <Navbar />
//       <div style={{ paddingTop: 80, paddingLeft: 40, paddingRight: 40, background: '#f0f0f0', minHeight: '100vh' }}>
//         <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: 18, color: '#d32f2f' }}>Error: {error}</div>
//       </div>
//     </>
//   );
//   if (!pdfUrl) return (
//     <>
//       <Navbar />
//       <div style={{ paddingTop: 80, paddingLeft: 40, paddingRight: 40, background: '#f0f0f0', minHeight: '100vh' }}>
//         <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: 18, color: '#666' }}>No PDF URL available.</div>
//       </div>
//     </>
//   );

//   /* ─────────────────────────────────────────────────────────
//      Render
//   ───────────────────────────────────────────────────────── */
//   return (
//     <>
//       <Navbar />

//       {toast && (
//         <div style={{
//           position: 'fixed', top: 90, left: '50%', transform: 'translateX(-50%)',
//           background: '#323232', color: '#fff', padding: '10px 20px',
//           borderRadius: 6, fontSize: 13, zIndex: 9999, pointerEvents: 'none',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
//         }}>
//           {toast}
//         </div>
//       )}

//       <div style={{
//         paddingTop: 80, paddingLeft: 40, paddingRight: 40, paddingBottom: 40,
//         background: '#f0f0f0', minHeight: 'calc(100vh - 80px)',
//         display: 'flex', flexDirection: 'column',
//       }}>

//         {/* ── Toolbar ── */}
//         <div style={{
//           display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
//           background: '#fff', padding: '12px 20px', borderRadius: 8,
//           boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//         }}>
//           <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', gap: 8, alignItems: 'center' }}>
//             <button onClick={() => handleToolClick('highlight')} style={btnBase(currentTool === 'highlight')}>Highlight</button>
//             <button onClick={() => handleToolClick('note')}      style={btnBase(currentTool === 'note')}>Note</button>
//             <input type="color" value={currentColor}
//               onChange={(e) => setCurrentColor(e.target.value)}
//               style={{ width: 32, height: 32, padding: 2, border: '1px solid #e0e0e0', borderRadius: 4, cursor: 'pointer', marginLeft: 4 }}
//               title="Color"
//             />
//           </div>

//           <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
//             <button onClick={zoomOut} disabled={scale <= MIN_SCALE} style={navBtn(scale <= MIN_SCALE)}>−</button>
//             <span style={{ fontSize: 12, color: '#333', minWidth: 50, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
//             <button onClick={zoomIn}  disabled={scale >= MAX_SCALE} style={navBtn(scale >= MAX_SCALE)}>+</button>
//           </div>

//           <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
//             <button onClick={toggleFullscreen} style={navBtn(false)} title="Fullscreen">⛶</button>
//             <button onClick={downloadAnnotatedPDF} style={navBtn(false)} title="Download PDF with annotations">
//               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
//                 <polyline points="7 10 12 15 17 10" />
//                 <line x1="12" y1="15" x2="12" y2="3" />
//               </svg>
//             </button>
//             <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)} style={navBtn(pageNumber <= 1)} title="Previous page (←)">◀</button>
//             <span style={{ fontSize: 12, color: '#333', whiteSpace: 'nowrap' }}>{pageNumber} / {numPages}</span>
//             <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)} style={navBtn(pageNumber >= numPages)} title="Next page (→)">▶</button>
//           </div>
//         </div>

//         {/* ── PDF viewer ── */}
//         <div
//           ref={containerRef}
//           style={{
//             flex: 1, overflow: 'auto', background: '#fff',
//             borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//             padding: 20, display: 'flex', justifyContent: 'center',
//           }}
//         >
//           <div style={{ position: 'relative', display: 'inline-block' }}>
//             <Document
//               key={pdfUrl}
//               file={pdfUrl}
//               onLoadSuccess={onDocumentLoadSuccess}
//               loading="Loading PDF..."
//             >
//               <Page
//                 pageNumber={pageNumber}
//                 scale={scale}
//                 renderTextLayer={false}
//                 renderAnnotationLayer={false}
//                 onRenderSuccess={onPageRenderSuccess}
//               />
//             </Document>

//             <div
//               ref={overlayRef}
//               style={{
//                 position: 'absolute', top: 0, left: 0,
//                 width: renderedPageSize.width ? `${renderedPageSize.width}px` : '100%',
//                 height: renderedPageSize.height ? `${renderedPageSize.height}px` : '100%',
//                 cursor: 'crosshair', userSelect: 'none',
//               }}
//               onMouseDown={handleOverlayMouseDown}
//             >
//               {dragPreview && dragPreview.width > 0 && (
//                 <div style={{
//                   position: 'absolute',
//                   left: `${dragPreview.left * 100}%`, top: `${dragPreview.top * 100}%`,
//                   width: `${dragPreview.width * 100}%`, height: `${dragPreview.height * 100}%`,
//                   background: 'rgba(66,133,244,0.15)', border: '1.5px dashed #4285f4',
//                   pointerEvents: 'none',
//                 }} />
//               )}

//               {selection && (
//                 <div style={{
//                   position: 'absolute',
//                   left: `${selection.x * 100}%`, top: `${selection.y * 100}%`,
//                   width: `${selection.width * 100}%`, height: `${selection.height * 100}%`,
//                   background: 'rgba(66,133,244,0.12)', border: '1.5px solid #4285f4',
//                   pointerEvents: 'none',
//                 }} />
//               )}

//               {renderAnnotations()}
//               {renderHighlightDeletePopup()}
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default PDFViewer;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import io from 'socket.io-client';
import Navbar from '../components/Navbar';
import { PDFDocument, rgb } from 'pdf-lib';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/* ─── Resolve current user from localStorage ─────────────────
   Tries every field Supabase / common auth patterns use.
   Call this as a function each time you need it so it's
   always fresh (not stale from a render-time snapshot).
──────────────────────────────────────────────────────────── */
const resolveCurrentUser = () => {
  try {
    // ── Strategy 1: your app's own 'user' key ──
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      // Log once so you can confirm which field has the name
      console.log('[resolveCurrentUser] user object:', u);

      const name =
        u?.name ??
        u?.full_name ??
        u?.fullName ??
        u?.display_name ??
        u?.displayName ??
        u?.user_metadata?.full_name ??
        u?.user_metadata?.name ??
        u?.identities?.[0]?.identity_data?.full_name ??
        u?.email ??
        null;

      const id =
        u?.id ??
        u?.sub ??
        u?.user_id ??
        u?.userId ??
        null;

      if (name?.trim()) return { name: name.trim(), id: id ?? null };
    }
  } catch (e) {
    console.warn('[resolveCurrentUser] parse error on "user" key:', e);
  }

  try {
    // ── Strategy 2: JWT access_token payload ──
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const name =
        payload?.user_metadata?.full_name ??
        payload?.user_metadata?.name ??
        payload?.name ??
        payload?.email ??
        null;
      if (name?.trim()) return { name: name.trim(), id: payload?.sub ?? null };
    }
  } catch (e) {
    console.warn('[resolveCurrentUser] JWT parse error:', e);
  }

  try {
    // ── Strategy 3: Supabase native auth storage ──
    const keys = Object.keys(localStorage);
    const sbKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (sbKey) {
      const sb = JSON.parse(localStorage.getItem(sbKey));
      const meta = sb?.user?.user_metadata;
      const name = meta?.full_name ?? meta?.name ?? sb?.user?.email ?? null;
      if (name?.trim()) return { name: name.trim(), id: sb?.user?.id ?? null };
    }
  } catch (e) {
    console.warn('[resolveCurrentUser] Supabase key parse error:', e);
  }

  return { name: 'Unknown', id: null };
};

/* ─── style helpers ─────────────────────────────────────── */
const btnBase = (active) => ({
  padding: '6px 12px',
  background: active ? '#e0e0e0' : '#fff',
  border: '1px solid #e0e0e0', borderRadius: 4,
  fontSize: 12, color: '#333',
  cursor: 'pointer', fontWeight: active ? 600 : 400,
});
const navBtn = (disabled) => ({
  padding: '6px 10px',
  background: disabled ? '#f0f0f0' : '#fff',
  border: '1px solid #e0e0e0', borderRadius: 4,
  fontSize: 14, color: disabled ? '#999' : '#333',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 'bold', lineHeight: 1,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
});

/* ─── SVG Icons (no emojis) ──────────────────────────────── */
const IconEdit = ({ size = 13, color = '#bbb' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = ({ size = 13, color = '#bbb' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

/* ─── IconButton wrapper ─────────────────────────────────── */
const IconBtn = ({ onClick, title, hoverColor, children }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 4,
        background: hovered ? (hoverColor === 'red' ? '#ffeaea' : '#eef4ee') : 'none',
        transition: 'background 0.12s',
      }}
    >
      {React.cloneElement(children, { color: hovered ? (hoverColor === 'red' ? '#e53935' : '#3E513E') : '#bbb' })}
    </button>
  );
};

/* ─── Avatar ─────────────────────────────────────────────── */
const Avatar = ({ name = '?', size = 28 }) => {
  const initials = (name || '?').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const palette  = ['#4a7c59','#5b6abf','#b5654a','#7c4a7c','#4a7c7c','#8a6f2e','#4a5e7c'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const color = palette[Math.abs(hash) % palette.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0, userSelect: 'none',
    }}>{initials}</div>
  );
};

/* ─── Hover tooltip ──────────────────────────────────────── */
const HoverTooltip = ({ userName, color }) => (
  <div style={{
    position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
    transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff',
    fontSize: 11, fontWeight: 500, padding: '4px 9px', borderRadius: 5,
    whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 500,
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 5,
  }}>
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color || '#FFFF00', border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0, display: 'inline-block' }} />
    {userName || 'Unknown'}
    <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1a1a1a' }} />
  </div>
);

/* ─── Note icon ──────────────────────────────────────────── */
const NoteIcon = ({ color = '#FFFF00', active = false }) => (
  <svg width="18" height="18" viewBox="0 0 22 22" fill="none"
    style={{ filter: active ? 'drop-shadow(0 0 3px rgba(0,0,0,0.4))' : 'none', transition: 'filter 0.15s' }}>
    <rect x="1" y="1" width="20" height="20" rx="3" fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth="1.2"/>
    <rect x="1" y="1" width="20" height="6" rx="3" fill="rgba(0,0,0,0.18)"/>
    <rect x="1" y="4" width="20" height="3" fill="rgba(0,0,0,0.18)"/>
    <line x1="5" y1="11" x2="17" y2="11" stroke="rgba(0,0,0,0.35)" strokeWidth="1.2"/>
    <line x1="5" y1="14" x2="17" y2="14" stroke="rgba(0,0,0,0.35)" strokeWidth="1.2"/>
    <line x1="5" y1="17" x2="12" y2="17" stroke="rgba(0,0,0,0.35)" strokeWidth="1.2"/>
  </svg>
);

const relativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
};

/* ═══════════════════════════════════════════════════════════
   NOTE SIDEBAR
═══════════════════════════════════════════════════════════ */
const NoteSidebar = ({ note, currentUserName, currentUserId, onClose, onAddReply, onDeleteReply, onEditReply, onDeleteNote }) => {
  const [showComposer, setShowComposer] = useState(false);
  const [replyText, setReplyText]       = useState('');
  const [editingIdx, setEditingIdx]     = useState(null);
  const [editingText, setEditingText]   = useState('');
  const textareaRef = useRef(null);
  const editRef     = useRef(null);
  const bottomRef   = useRef(null);

  useEffect(() => { setShowComposer(false); setReplyText(''); setEditingIdx(null); setEditingText(''); }, [note?._id]);
  useEffect(() => { if (showComposer) textareaRef.current?.focus(); }, [showComposer]);
  useEffect(() => { if (editingIdx !== null) editRef.current?.focus(); }, [editingIdx]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [note?.replies?.length]);

  const submitReply = () => {
    const t = replyText.trim(); if (!t) return;
    onAddReply(note._id, t);
    setReplyText(''); setShowComposer(false);
  };
  const saveEdit = (idx) => {
    const t = editingText.trim(); if (!t) return;
    onEditReply(note._id, idx, t);
    setEditingIdx(null); setEditingText('');
  };

  /* empty state */
  if (!note) return (
    <div style={{ width: '100%', background: '#fafafa', borderLeft: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      <span style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.6, color: '#ccc' }}>Click a note icon<br/>to view its thread</span>
    </div>
  );

  const replies = note.replies || [];

  return (
    <div style={{ width: '100%', background: '#fafafa', borderLeft: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #ececec', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#333', letterSpacing: 0.3 }}>NOTE THREAD</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setShowComposer(v => !v)} title="Add comment" style={{
            border: `1px solid ${showComposer ? '#3E513E' : '#e0e0e0'}`,
            background: showComposer ? '#f0f4f0' : 'none',
            borderRadius: 5, cursor: 'pointer', color: showComposer ? '#3E513E' : '#888',
            width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, transition: 'all 0.15s',
          }}>+</button>
          <button onClick={onClose} title="Close" style={{
            background: 'none', border: '1px solid #e0e0e0', borderRadius: 5,
            cursor: 'pointer', color: '#999', width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}>✕</button>
        </div>
      </div>

      {/* Thread */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 4px' }}>

        {/* Original note */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8e8e8', padding: '12px', marginBottom: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', borderLeft: `4px solid ${note.color || '#FFFF00'}` }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Avatar name={note.userName || '?'} size={26} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.userName || 'Unknown'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: '#bbb' }}>{relativeTime(note.createdAt)}</span>
                  {note.userId === currentUserId && (
                    <IconBtn onClick={() => onDeleteNote(note._id)} title="Delete note" hoverColor="red">
                      <IconTrash size={13} />
                    </IconBtn>
                  )}
                </div>
              </div>
              {note.content?.trim() && (
                <div style={{ fontSize: 13, color: '#333', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{note.content}</div>
              )}
            </div>
          </div>
        </div>

        {/* Replies */}
        {replies.map((reply, idx) => {
          const isOwner   = reply.userId === currentUserId;
          const isEditing = editingIdx === idx;
          return (
            <div key={idx} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8e8e8', padding: '10px 12px', marginBottom: 6, marginLeft: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Avatar name={reply.userName || '?'} size={22} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {reply.userName || 'Unknown'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: '#bbb' }}>{relativeTime(reply.createdAt)}</span>
                      {isOwner && !isEditing && (
                        <>
                          <IconBtn onClick={() => { setEditingIdx(idx); setEditingText(reply.text); }} title="Edit comment" hoverColor="green">
                            <IconEdit size={13} />
                          </IconBtn>
                          <IconBtn onClick={() => onDeleteReply(note._id, idx)} title="Delete comment" hoverColor="red">
                            <IconTrash size={13} />
                          </IconBtn>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <textarea ref={editRef} value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEdit(idx);
                          if (e.key === 'Escape') { setEditingIdx(null); setEditingText(''); }
                        }}
                        rows={2}
                        style={{ width: '100%', border: '1px solid #3E513E', borderRadius: 6, padding: '6px 8px', fontSize: 12, fontFamily: 'inherit', resize: 'none', outline: 'none', color: '#333', background: '#f9fdf9', lineHeight: 1.5, boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                        <button onClick={() => { setEditingIdx(null); setEditingText(''); }}
                          style={{ padding: '3px 10px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 4, fontSize: 11, cursor: 'pointer', color: '#555' }}>Cancel</button>
                        <button onClick={() => saveEdit(idx)} disabled={!editingText.trim()}
                          style={{ padding: '3px 10px', background: editingText.trim() ? '#3E513E' : '#ccc', border: 'none', borderRadius: 4, fontSize: 11, cursor: editingText.trim() ? 'pointer' : 'not-allowed', color: '#fff', fontWeight: 600 }}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#444', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{reply.text}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Composer */}
        {showComposer && (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #3E513E', padding: '10px 12px', marginBottom: 6, marginLeft: 10, boxShadow: '0 2px 8px rgba(62,81,62,0.1)' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Avatar name={currentUserName} size={22} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#3E513E' }}>{currentUserName}</span>
                <textarea ref={textareaRef} value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitReply();
                    if (e.key === 'Escape') { setShowComposer(false); setReplyText(''); }
                  }}
                  placeholder="Add a comment..."
                  rows={2}
                  style={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 6, padding: '7px 9px', fontSize: 12, fontFamily: 'inherit', resize: 'none', outline: 'none', color: '#333', background: '#fafafa', lineHeight: 1.5, boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#3E513E'}
                  onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: '#bbb' }}>⌘↵ to send · Esc to cancel</span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => { setShowComposer(false); setReplyText(''); }}
                      style={{ padding: '4px 10px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 5, fontSize: 11, cursor: 'pointer', color: '#555' }}>Cancel</button>
                    <button onClick={submitReply} disabled={!replyText.trim()}
                      style={{ padding: '4px 12px', background: replyText.trim() ? '#3E513E' : '#ccc', border: 'none', borderRadius: 5, fontSize: 11, cursor: replyText.trim() ? 'pointer' : 'not-allowed', color: '#fff', fontWeight: 600 }}>Comment</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} style={{ height: 8 }} />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   PDF VIEWER
═══════════════════════════════════════════════════════════ */
const PDFViewer = () => {
  const { paperId } = useParams();
  const location    = useLocation();

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

  const [annotations, setAnnotations]   = useState([]);
  const [currentTool, setCurrentTool]   = useState('highlight');
  const [currentColor, setCurrentColor] = useState('#FFFF00');
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState(null);

  const [sidebarNoteId, setSidebarNoteId] = useState(null);
  const [sidebarWidth, setSidebarWidth]   = useState(300);

  const [toast, setToast] = useState('');

  const isDraggingRef   = useRef(false);
  const dragStartRef    = useRef(null);
  const isResizingRef   = useRef(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWRef = useRef(300);

  const [dragPreview, setDragPreview] = useState(null);
  const [selection, setSelection]     = useState(null);
  const socketRef = useRef(null);
  const [renderedPageSize, setRenderedPageSize] = useState({ width: 0, height: 0 });
  const locationStateRef = useRef(location.state);
  useEffect(() => { locationStateRef.current = location.state; }, [location.state]);

  // Resolve once at mount — will be stable for this session
  const { name: currentUserName, id: currentUserId } = resolveCurrentUser();

  const sidebarNote = sidebarNoteId
    ? annotations.find(a => a._id === sidebarNoteId) || null
    : null;

  /* ── PDF URL ─────────────────────────────────────────── */
  useEffect(() => {
    setPdfUrl(''); setLoading(true); setError(null);
    setNumPages(null); setPageNumber(1); setAnnotations([]);
    setSelection(null); setSelectedAnnotation(null);
    setSidebarNoteId(null); setRenderedPageSize({ width: 0, height: 0 }); setHoveredAnnotationId(null);

    const state = locationStateRef.current;
    if (state?.pdfUrl) {
      setPdfUrl(`${process.env.REACT_APP_BACKEND_URL}/api/pdf-proxy?url=${encodeURIComponent(state.pdfUrl)}`);
      setLoading(false);
    } else {
      (async () => {
        try {
          const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/papers/${paperId}`);
          if (res.ok) {
            const data = await res.json();
            const url = data.openAccessPdf?.url;
            if (url) setPdfUrl(`${process.env.REACT_APP_BACKEND_URL}/api/pdf-proxy?url=${encodeURIComponent(url)}`);
            else setError('No PDF available for this paper.');
          } else setError('Failed to fetch paper details.');
        } catch { setError('Error fetching paper details.'); }
        finally { setLoading(false); }
      })();
    }
  }, [paperId]);

  /* ── Socket ──────────────────────────────────────────── */
  useEffect(() => {
    const socket = io(process.env.REACT_APP_BACKEND_URL, { transports: ['websocket'], reconnectionAttempts: 10, reconnectionDelay: 1000 });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('joinPaper', { paperId }));
    socket.on('annotationUpdate', (incoming) => {
      if (incoming.userId === currentUserId) return;
      setAnnotations(prev => {
        const idx = prev.findIndex(a => a._id === incoming._id);
        if (idx >= 0) { const n = [...prev]; n[idx] = incoming; return n; }
        return [...prev, incoming];
      });
    });
    socket.on('annotationDelete', ({ id }) => {
      setAnnotations(prev => prev.filter(a => a._id !== id));
      setSidebarNoteId(prev => prev === id ? null : prev);
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [paperId]);

  /* ── Fetch annotations ───────────────────────────────── */
  useEffect(() => {
    if (!paperId) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations/${paperId}`);
        if (res.ok) setAnnotations(await res.json());
      } catch (e) { console.error(e); }
    })();
  }, [paperId]);

  /* ── Fullscreen / keyboard ───────────────────────────── */
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }, [isFullscreen]);
  useEffect(() => { setRenderedPageSize({ width: 0, height: 0 }); }, [pageNumber, scale]);
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
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  /* ── Sidebar resize ──────────────────────────────────── */
  const handleResizeMouseDown = (e) => {
    isResizingRef.current = true; resizeStartXRef.current = e.clientX; resizeStartWRef.current = sidebarWidth;
    e.preventDefault();
  };
  useEffect(() => {
    const onMove = (e) => { if (!isResizingRef.current) return; setSidebarWidth(Math.max(220, Math.min(500, resizeStartWRef.current + (resizeStartXRef.current - e.clientX)))); };
    const onUp   = () => { isResizingRef.current = false; };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  /* ── Drag to select ──────────────────────────────────── */
  const getRatio = (e) => {
    const el = overlayRef.current; if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) };
  };
  const handleOverlayMouseDown = (e) => {
    if (e.button !== 0 || e.target !== overlayRef.current) return;
    setSelection(null); setSelectedAnnotation(null); setHoveredAnnotationId(null);
    const c = getRatio(e); if (!c) return;
    isDraggingRef.current = true; dragStartRef.current = c;
    setDragPreview({ left: c.x, top: c.y, width: 0, height: 0 }); e.preventDefault();
  };
  useEffect(() => {
    const onMove = (e) => {
      if (!isDraggingRef.current || !dragStartRef.current) return;
      const c = getRatio(e), s = dragStartRef.current; if (!c) return;
      setDragPreview({ left: Math.min(s.x, c.x), top: Math.min(s.y, c.y), width: Math.abs(c.x - s.x), height: Math.abs(c.y - s.y) });
    };
    const onUp = (e) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const c = getRatio(e), s = dragStartRef.current; dragStartRef.current = null; setDragPreview(null);
      if (!c || !s) return;
      const w = Math.abs(c.x - s.x), h = Math.abs(c.y - s.y);
      if (w < 0.005 || h < 0.002) return;
      setSelection({ x: Math.min(s.x, c.x), y: Math.min(s.y, c.y), width: w, height: h });
    };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  /* ── Save / delete annotation ────────────────────────── */
  const saveAnnotation = async (type, position, content = '') => {
    if (!currentUserId) { showToast('Please log in to annotate.'); return null; }
    const state = locationStateRef.current;
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, userId: currentUserId, libraryId: state?.libraryId || 'unknown', dbPaperId: state?.paperId || null, pageNumber, type, position, content, color: currentColor }),
      });
      if (res.ok) {
        const a = await res.json();
        const withName = { ...a, userName: a.userName || currentUserName, replies: a.replies || [] };
        setAnnotations(prev => [...prev, withName]);
        return withName;
      }
    } catch (e) { console.error(e); }
    return null;
  };

  const handleToolClick = (tool) => {
    setCurrentTool(tool);
    if (!selection) showToast('Select an area on the PDF first, then click the tool.');
    else { setSelection(null); saveAnnotation(tool, selection).then(saved => { if (saved && tool === 'note') setSidebarNoteId(saved._id); }); }
  };

  const deleteAnnotation = async (id) => {
    setAnnotations(prev => prev.filter(a => a._id !== id));
    setSelectedAnnotation(null); setSidebarNoteId(prev => prev === id ? null : prev); setHoveredAnnotationId(null);
    try { await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations/${id}`, { method: 'DELETE' }); } catch (e) { console.error(e); }
  };

  /* ── Reply CRUD ───────────────────────────────────────── */
  const handleAddReply = async (noteId, text) => {
    // Re-resolve at call time — guaranteed fresh
    const { name: uName, id: uId } = resolveCurrentUser();
    const reply = { text, userId: uId, userName: uName, createdAt: new Date().toISOString() };

    setAnnotations(prev => prev.map(a => a._id === noteId ? { ...a, replies: [...(a.replies || []), reply] } : a));

    try {
      const ann = annotations.find(a => a._id === noteId);
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations/${noteId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replies: [...(ann?.replies || []), reply] }),
      });
    } catch (e) { console.error(e); }
  };

  const handleDeleteReply = async (noteId, idx) => {
    setAnnotations(prev => prev.map(a => a._id !== noteId ? a : { ...a, replies: (a.replies || []).filter((_, i) => i !== idx) }));
    try {
      const ann = annotations.find(a => a._id === noteId);
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations/${noteId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replies: (ann?.replies || []).filter((_, i) => i !== idx) }),
      });
    } catch (e) { console.error(e); }
  };

  const handleEditReply = async (noteId, idx, newText) => {
    setAnnotations(prev => prev.map(a => a._id !== noteId ? a : { ...a, replies: (a.replies || []).map((r, i) => i === idx ? { ...r, text: newText, editedAt: new Date().toISOString() } : r) }));
    try {
      const ann = annotations.find(a => a._id === noteId);
      const replies = (ann?.replies || []).map((r, i) => i === idx ? { ...r, text: newText } : r);
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/annotations/${noteId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replies }),
      });
    } catch (e) { console.error(e); }
  };

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);
  const onPageRenderSuccess   = (page) => { const vp = page.getViewport({ scale }); setRenderedPageSize({ width: vp.width, height: vp.height }); };

  /* ── Download PDF ────────────────────────────────────── */
  const downloadAnnotatedPDF = async () => {
    if (!pdfUrl) { showToast('No PDF available.'); return; }
    showToast('Preparing PDF...');
    try {
      const pdfDoc = await PDFDocument.load(await (await fetch(pdfUrl)).arrayBuffer(), { ignoreEncryption: true });
      const pages  = pdfDoc.getPages();
      if (!pages?.length) { showToast('Could not parse PDF pages.'); return; }
      for (const ann of annotations) {
        if (ann.isDeleted) continue;
        const pi = ann.pageNumber - 1;
        if (pi < 0 || pi >= pages.length) continue;
        const page = pages[pi]; if (!page) continue;
        const { width: pw, height: ph } = page.getSize();
        const hex = ann.color || '#FFFF00';
        page.drawRectangle({ x: ann.position.x * pw, y: ph - ann.position.y * ph - ann.position.height * ph, width: ann.position.width * pw, height: ann.position.height * ph, color: rgb(parseInt(hex.slice(1,3),16)/255, parseInt(hex.slice(3,5),16)/255, parseInt(hex.slice(5,7),16)/255), opacity: 0.45 });
      }
      const url = window.URL.createObjectURL(new Blob([await pdfDoc.save()], { type: 'application/pdf' }));
      Object.assign(document.createElement('a'), { href: url, download: `annotated-${paperId}.pdf` }).click();
      window.URL.revokeObjectURL(url);
      showToast('Downloaded!');
    } catch (e) { showToast('Failed: ' + e.message); }
  };

  /* ── Render annotations ──────────────────────────────── */
  const renderAnnotations = () =>
    annotations.filter(a => a.pageNumber === pageNumber && !a.isDeleted).map(ann => {
      const { x, y, width, height } = ann.position;
      const isHovered = hoveredAnnotationId === ann._id;
      const isActive  = sidebarNoteId === ann._id;

      if (ann.type === 'highlight') return (
        <div key={ann._id}
          onClick={e => { e.stopPropagation(); setSelectedAnnotation(ann); setSidebarNoteId(null); }}
          onMouseEnter={() => setHoveredAnnotationId(ann._id)}
          onMouseLeave={() => setHoveredAnnotationId(null)}
          style={{ position: 'absolute', left: `${x*100}%`, top: `${y*100}%`, width: `${width*100}%`, height: `${height*100}%`, backgroundColor: ann.color || '#FFFF00', opacity: isHovered ? 0.65 : 0.45, mixBlendMode: 'multiply', cursor: 'pointer', pointerEvents: 'auto', transition: 'opacity 0.15s' }}
        >
          {isHovered && <HoverTooltip userName={ann.userName} color={ann.color} />}
        </div>
      );

      if (ann.type === 'note') return (
        <React.Fragment key={ann._id}>
          <div style={{ position: 'absolute', left: `${x*100}%`, top: `${y*100}%`, width: `${width*100}%`, height: `${height*100}%`, backgroundColor: ann.color || '#FFFF00', opacity: isActive ? 0.62 : 0.45, mixBlendMode: 'multiply', pointerEvents: 'none', transition: 'opacity 0.15s', outline: isActive ? `2px solid ${ann.color || '#FFFF00'}` : 'none', outlineOffset: 1 }} />
          <div
            onClick={e => { e.stopPropagation(); setSidebarNoteId(prev => prev === ann._id ? null : ann._id); setSelectedAnnotation(null); }}
            onMouseEnter={() => setHoveredAnnotationId(ann._id)}
            onMouseLeave={() => setHoveredAnnotationId(null)}
            style={{ position: 'absolute', left: `${x*100}%`, top: `${y*100}%`, transform: 'translate(-2px, -100%)', cursor: 'pointer', pointerEvents: 'auto', zIndex: 20 }}
          >
            <NoteIcon color={ann.color || '#FFFF00'} active={isActive} />
            {ann.replies?.length > 0 && (
              <div style={{ position: 'absolute', top: -6, right: -6, background: '#3E513E', color: '#fff', borderRadius: '50%', width: 14, height: 14, fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff' }}>
                {ann.replies.length > 9 ? '9+' : ann.replies.length}
              </div>
            )}
            {isHovered && !isActive && <HoverTooltip userName={ann.userName} color={ann.color} />}
          </div>
        </React.Fragment>
      );
      return null;
    });

  const renderHighlightPopup = () => {
    if (!selectedAnnotation || selectedAnnotation.type !== 'highlight') return null;
    const { x, y, height } = selectedAnnotation.position;
    return (
      <div onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', left: `${x*100}%`, top: `calc(${(y+height)*100}% + 6px)`, zIndex: 200, pointerEvents: 'auto', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', padding: '12px 16px', minWidth: 180 }}>
        <div style={{ fontSize: 13, color: '#333', marginBottom: 10, fontWeight: 500 }}>Remove this highlight?</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => deleteAnnotation(selectedAnnotation._id)} style={{ padding: '6px 12px', background: '#3E513E', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Delete</button>
          <button onClick={() => setSelectedAnnotation(null)} style={{ padding: '6px 12px', background: '#f0f0f0', color: '#333', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Cancel</button>
        </div>
      </div>
    );
  };

  if (loading) return <><Navbar /><div style={{ paddingTop: 80, background: '#f0f0f0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#666', fontSize: 16 }}>Loading PDF viewer...</span></div></>;
  if (error)   return <><Navbar /><div style={{ paddingTop: 80, background: '#f0f0f0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#d32f2f', fontSize: 16 }}>Error: {error}</span></div></>;
  if (!pdfUrl) return <><Navbar /><div style={{ paddingTop: 80, background: '#f0f0f0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#666', fontSize: 16 }}>No PDF URL available.</span></div></>;

  return (
    <>
      <Navbar />
      {toast && <div style={{ position: 'fixed', top: 90, left: '50%', transform: 'translateX(-50%)', background: '#323232', color: '#fff', padding: '10px 20px', borderRadius: 6, fontSize: 13, zIndex: 9999, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>{toast}</div>}

      <div style={{ paddingTop: 80, background: '#f0f0f0', minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', zIndex: 10, flexShrink: 0 }}>
          <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => handleToolClick('highlight')} style={btnBase(currentTool === 'highlight')}>Highlight</button>
            <button onClick={() => handleToolClick('note')}      style={btnBase(currentTool === 'note')}>Note</button>
            <input type="color" value={currentColor} onChange={e => setCurrentColor(e.target.value)} style={{ width: 32, height: 32, padding: 2, border: '1px solid #e0e0e0', borderRadius: 4, cursor: 'pointer', marginLeft: 4 }} />
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={zoomOut} disabled={scale <= MIN_SCALE} style={navBtn(scale <= MIN_SCALE)}>−</button>
            <span style={{ fontSize: 12, color: '#333', minWidth: 50, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn}  disabled={scale >= MAX_SCALE} style={navBtn(scale >= MAX_SCALE)}>+</button>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
            <button onClick={toggleFullscreen} style={navBtn(false)} title="Fullscreen">⛶</button>
            <button onClick={downloadAnnotatedPDF} style={navBtn(false)} title="Download">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
            <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)} style={navBtn(pageNumber <= 1)}>◀</button>
            <span style={{ fontSize: 12, color: '#333', whiteSpace: 'nowrap' }}>{pageNumber} / {numPages}</span>
            <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)} style={navBtn(pageNumber >= numPages)}>▶</button>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          <div ref={containerRef} style={{ flex: 1, overflow: 'auto', background: '#f0f0f0', padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <div style={{ background: '#fff', borderRadius: 8, display: 'inline-block', position: 'relative', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
              <Document key={pdfUrl} file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading="Loading PDF...">
                <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} onRenderSuccess={onPageRenderSuccess} />
              </Document>
              <div ref={overlayRef} style={{ position: 'absolute', top: 0, left: 0, width: renderedPageSize.width ? `${renderedPageSize.width}px` : '100%', height: renderedPageSize.height ? `${renderedPageSize.height}px` : '100%', cursor: 'crosshair', userSelect: 'none' }} onMouseDown={handleOverlayMouseDown}>
                {dragPreview?.width > 0 && <div style={{ position: 'absolute', left: `${dragPreview.left*100}%`, top: `${dragPreview.top*100}%`, width: `${dragPreview.width*100}%`, height: `${dragPreview.height*100}%`, background: 'rgba(66,133,244,0.15)', border: '1.5px dashed #4285f4', pointerEvents: 'none' }} />}
                {selection && <div style={{ position: 'absolute', left: `${selection.x*100}%`, top: `${selection.y*100}%`, width: `${selection.width*100}%`, height: `${selection.height*100}%`, background: 'rgba(66,133,244,0.12)', border: '1.5px solid #4285f4', pointerEvents: 'none' }} />}
                {renderAnnotations()}
                {renderHighlightPopup()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          {sidebarNoteId && (
            <>
              <div onMouseDown={handleResizeMouseDown} style={{ width: 5, cursor: 'col-resize', flexShrink: 0, borderLeft: '1px solid #e0e0e0' }}
                onMouseEnter={e => e.currentTarget.style.background = '#d0d0d0'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'} />
              <div style={{ width: sidebarWidth, minWidth: sidebarWidth, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
                <NoteSidebar
                  note={sidebarNote}
                  currentUserName={currentUserName}
                  currentUserId={currentUserId}
                  onClose={() => setSidebarNoteId(null)}
                  onAddReply={handleAddReply}
                  onDeleteReply={handleDeleteReply}
                  onEditReply={handleEditReply}
                  onDeleteNote={deleteAnnotation}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PDFViewer;