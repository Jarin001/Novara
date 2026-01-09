import React, { useState } from 'react';
import { FolderOpen, Plus, Edit2, Trash2, FileText, TrendingUp, X, Save, StickyNote } from 'lucide-react';
import Navbar from "../components/Navbar";


const ResearchLibrary = () => {
  const [libraries, setLibraries] = useState([
    { id: 'all', name: 'All Papers', isDefault: true },
    { id: '1', name: 'Influential Papers', isDefault: false },
    { id: '2', name: 'Machine Learning', isDefault: false }
  ]);

  const [papers, setPapers] = useState([
    {
      id: 'p1',
      title: 'LLMs instead of Human Judges? A Large Scale Empirical Study across 20 NLP Evaluation Tasks',
      authors: ['A. Bavaresco', 'Raffaella Bernardi', '+17 authors', 'A. Testoni'],
      venue: 'Annual Meeting of the Association for...',
      date: '26 June 2024',
      citations: 169,
      source: 'arXiv',
      abstract: 'There is an increasing trend towards evaluating NLP models with LLMs instead of human judgments, raising questions about the validity of these evaluations, as well as their reproducibility in the...',
      libraryId: '1',
      readingStatus: 'unread',
      notes: '',
      addedDate: new Date('2024-06-26'),
      field: 'Computer Science, Linguistics'
    },
    {
      id: 'p2',
      title: 'LLM-Assisted Content Analysis: Using Large Language Models to Support Deductive Coding',
      authors: ['Robert F. Chew', 'John Bollenbacher', 'Michael Wenger', 'Jessica Speer', 'Annice Kim'],
      venue: 'Computer Science',
      date: '23 June 2023',
      citations: 114,
      source: 'arXiv',
      abstract: 'Deductive coding is a widely used qualitative research method for determining the prevalence of themes across documents. While useful, deductive coding is often burdensome and time consuming since it...',
      libraryId: '1',
      readingStatus: 'in-progress',
      notes: 'Interesting methodology for qualitative analysis',
      addedDate: new Date('2023-06-23'),
      field: 'Computer Science'
    }
  ]);

  const [selectedLibrary, setSelectedLibrary] = useState('all');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [showNewLibraryModal, setShowNewLibraryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState(null);
  const [newLibraryName, setNewLibraryName] = useState('');
  const [notesModal, setNotesModal] = useState({ show: false, paperId: null, notes: '' });

  const filteredPapers = papers.filter(p => 
    selectedLibrary === 'all' || p.libraryId === selectedLibrary
  );

  const sortedPapers = [...filteredPapers].sort((a, b) => {
    switch(sortBy) {
      case 'citations':
        return b.citations - a.citations;
      case 'dateAdded':
        return b.addedDate - a.addedDate;
      case 'datePublished':
        return new Date(b.date) - new Date(a.date);
      default:
        return 0;
    }
  });

  const handleCreateLibrary = () => {
    if (newLibraryName.trim()) {
      setLibraries([...libraries, {
        id: Date.now().toString(),
        name: newLibraryName,
        isDefault: false
      }]);
      setNewLibraryName('');
      setShowNewLibraryModal(false);
    }
  };

  const handleEditLibrary = () => {
    if (newLibraryName.trim() && editingLibrary) {
      setLibraries(libraries.map(lib => 
        lib.id === editingLibrary.id ? { ...lib, name: newLibraryName } : lib
      ));
      setNewLibraryName('');
      setEditingLibrary(null);
      setShowEditModal(false);
    }
  };

  const handleDeleteLibrary = (id) => {
    if (window.confirm('Are you sure you want to delete this library?')) {
      setLibraries(libraries.filter(lib => lib.id !== id));
      if (selectedLibrary === id) setSelectedLibrary('all');
    }
  };

  const handleRemovePaper = (paperId) => {
    setPapers(papers.filter(p => p.id !== paperId));
  };

  const handleReadingStatusChange = (paperId, status) => {
    setPapers(papers.map(p => 
      p.id === paperId ? { ...p, readingStatus: status } : p
    ));
  };

  const openNotesModal = (paperId) => {
    const paper = papers.find(p => p.id === paperId);
    setNotesModal({ show: true, paperId, notes: paper?.notes || '' });
  };

  const saveNotes = () => {
    setPapers(papers.map(p => 
      p.id === notesModal.paperId ? { ...p, notes: notesModal.notes } : p
    ));
    setNotesModal({ show: false, paperId: null, notes: '' });
  };

  const deleteNotes = () => {
    setPapers(papers.map(p => 
      p.id === notesModal.paperId ? { ...p, notes: '' } : p
    ));
    setNotesModal({ show: false, paperId: null, notes: '' });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'read': return { backgroundColor: '#d1f4e0', color: '#166534' };
      case 'in-progress': return { backgroundColor: '#fef3c7', color: '#854d0e' };
      case 'unread': return { backgroundColor: '#f3f4f6', color: '#1f2937' };
      default: return { backgroundColor: '#f3f4f6', color: '#1f2937' };
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F5F5F0' }}>
      <link 
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" 
        rel="stylesheet"
      />
      
      {/* Navbar */}
      <Navbar />

      {/* Main Content - with top padding for fixed navbar */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', marginTop: '64px' }}>
        {/* Sidebar */}
        <div style={{ width: '256px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.0rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0', textAlign: 'left' }}>
                All Libraries
            </h2>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {libraries.map(library => (
              <div
                key={library.id}
                className="library-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: selectedLibrary === library.id ? '#E8EDE8' : 'white',
                  borderLeft: selectedLibrary === library.id ? '4px solid #3E513E' : 'none'
                }}
                onClick={() => setSelectedLibrary(library.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <FolderOpen 
                    size={18} 
                    style={{ color: selectedLibrary === library.id ? '#3E513E' : '#9ca3af' }}
                  />
                  <span 
                    style={{
                      fontSize: '0.875rem',
                      color: selectedLibrary === library.id ? '#3E513E' : '#374151',
                      fontWeight: selectedLibrary === library.id ? 500 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {library.name}
                  </span>
                </div>
                
                {!library.isDefault && (
                  <div className="library-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0, transition: 'opacity 0.2s' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLibrary(library);
                        setNewLibraryName(library.name);
                        setShowEditModal(true);
                      }}
                      style={{ padding: '4px', border: 'none', background: 'transparent', borderRadius: '4px', cursor: 'pointer' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Edit2 size={14} style={{ color: '#6b7280' }} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLibrary(library.id);
                      }}
                      style={{ padding: '4px', border: 'none', background: 'transparent', borderRadius: '4px', cursor: 'pointer' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Trash2 size={14} style={{ color: '#6b7280' }} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={() => setShowNewLibraryModal(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 16px',
                color: 'white',
                backgroundColor: '#3E513E',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Plus size={18} />
              New Library
            </button>
          </div>
        </div>

        {/* Papers List */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'white' }}>
          {/* Header */}
          <div style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FolderOpen size={24} style={{ color: '#3E513E' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  {libraries.find(l => l.id === selectedLibrary)?.name || 'All Papers'}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#3E513E',
                    backgroundColor: '#E8EDE8',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Share
                </button>
                <button 
                  style={{
                    padding: '8px 16px',
                    color: '#6b7280',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Settings
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, maxWidth: '448px' }}>
                <input
                  type="text"
                  placeholder="Search Papers"
                  className="form-control"
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-select"
                style={{
                  width: 'auto',
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
              >
                <option value="dateAdded">Sort by Date Added</option>
                <option value="citations">Sort by Citations</option>
                <option value="datePublished">Sort by Publication Date</option>
              </select>
            </div>
          </div>

          {/* Papers */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
            {sortedPapers.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                <FileText size={64} style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '1.125rem' }}>No papers in this library</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {sortedPapers.map(paper => (
                  <div key={paper.id} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '24px' }}>
                    {/* Title with Note Icon */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                      <h3 
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 400,
                          color: '#3E513E',
                          cursor: 'pointer',
                          flex: 1,
                          margin: 0
                        }}
                        onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >
                        {paper.title}
                      </h3>
                      <button
                        onClick={() => openNotesModal(paper.id)}
                        title="Add/Edit Notes"
                        style={{
                          padding: '4px',
                          border: 'none',
                          background: 'transparent',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <StickyNote 
                          size={18} 
                          style={{ color: paper.notes ? '#ca8a04' : '#9ca3af' }}
                          fill={paper.notes ? '#fef3c7' : 'none'}
                        />
                      </button>
                    </div>

                    {/* Authors */}
                    <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '8px' }}>
                      {paper.authors.join(', ')}
                    </div>

                    {/* Field */}
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>
                      {paper.field}
                    </div>

                    {/* Venue and Date */}
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '12px' }}>
                      {paper.venue} · {paper.date}
                    </div>

                    {/* Abstract */}
                    <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '12px' }}>
                      {paper.abstract} <span 
                        style={{ color: '#3E513E', cursor: 'pointer' }}
                        onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >Expand</span>
                    </p>

                    {/* Bottom Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <TrendingUp size={16} style={{ color: '#6b7280' }} />
                          <span style={{ fontWeight: 600, color: '#374151' }}>{paper.citations}</span>
                        </div>
                        {/* <button 
                          style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#111827'}
                          onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
                        >{paper.source}</button> */}
                        {/* <button 
                          style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#111827'}
                          onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
                        >Alert</button> */}
                        <button 
                          style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#111827'}
                          onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
                        >Cite</button>
                        {/* <button 
                          style={{ fontWeight: 500, color: '#3E513E', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          Influential Papers
                        </button> */}
                        <button 
                          onClick={() => handleRemovePaper(paper.id)}
                          style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#991b1b'}
                          onMouseOut={(e) => e.currentTarget.style.color = '#dc2626'}
                        >
                          Remove
                        </button>
                      </div>

                      <select
                        value={paper.readingStatus}
                        onChange={(e) => handleReadingStatusChange(paper.id, e.target.value)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          border: 'none',
                          cursor: 'pointer',
                          ...getStatusColor(paper.readingStatus)
                        }}
                      >
                        <option value="unread">Unread</option>
                        <option value="in-progress">In Progress</option>
                        <option value="read">Read</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes Modal - Beautiful Design */}
      {notesModal.show && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '100%',
            maxWidth: '896px',
            height: '85vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 32px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#E8EDE8'
                }}>
                  <StickyNote size={20} style={{ color: '#3E513E' }} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', margin: 0 }}>Edit Note</h3>
              </div>
              <button 
                onClick={() => setNotesModal({ show: false, paperId: null, notes: '' })}
                style={{
                  padding: '8px',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: '50%',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={24} style={{ color: '#6b7280' }} />
              </button>
            </div>

            {/* Note Title Section */}
            <div style={{ padding: '16px 32px', borderBottom: '1px solid #e5e7eb' }}>
              <input
                type="text"
                placeholder="Note Title (Optional)"
                className="form-control"
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 500,
                  border: 'none',
                  padding: 0
                }}
              />
            </div>
            
            {/* Main Content Area */}
            <div style={{
              flex: 1,
              padding: '32px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  <FileText size={16} style={{ marginRight: '8px' }} />
                  Note Content
                </label>
              </div>
              <textarea
                value={notesModal.notes}
                onChange={(e) => setNotesModal({ ...notesModal, notes: e.target.value })}
                placeholder="Write your notes here... You can add your thoughts, important findings, questions, or any observations about this research paper."
                className="form-control"
                style={{
                  flex: 1,
                  padding: '16px 20px',
                  border: '2px solid',
                  borderColor: notesModal.notes ? '#3E513E' : '#e5e7eb',
                  borderRadius: '12px',
                  resize: 'none',
                  fontSize: '1rem',
                  lineHeight: '1.75'
                }}
                autoFocus
              />
            </div>
            
            {/* Footer with Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'space-between',
              padding: '20px 32px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px'
            }}>
              <div>
                {notesModal.notes && (
                  <button
                    onClick={deleteNotes}
                    style={{
                      padding: '10px 20px',
                      color: '#dc2626',
                      backgroundColor: 'transparent',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Delete Note
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setNotesModal({ show: false, paperId: null, notes: '' })}
                  style={{
                    padding: '10px 24px',
                    color: '#374151',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  Cancel
                </button>
                <button
                  onClick={saveNotes}
                  style={{
                    padding: '10px 24px',
                    color: 'white',
                    backgroundColor: '#3E513E',
                    border: 'none',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Save size={18} />
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Library Modal */}
      {showNewLibraryModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '384px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Create New Library</h3>
              <button 
                onClick={() => setShowNewLibraryModal(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={20} style={{ color: '#9ca3af' }} />
              </button>
            </div>
            <input
              type="text"
              value={newLibraryName}
              onChange={(e) => setNewLibraryName(e.target.value)}
              placeholder="Library name"
              className="form-control"
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                marginBottom: '16px'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateLibrary()}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNewLibraryModal(false)}
                style={{
                  padding: '8px 16px',
                  color: '#374151',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLibrary}
                style={{
                  padding: '8px 16px',
                  color: 'white',
                  backgroundColor: '#3E513E',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Library Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '384px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Edit Library</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={20} style={{ color: '#9ca3af' }} />
              </button>
            </div>
            <input
              type="text"
              value={newLibraryName}
              onChange={(e) => setNewLibraryName(e.target.value)}
              placeholder="Library name"
              className="form-control"
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                marginBottom: '16px'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleEditLibrary()}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: '8px 16px',
                  color: '#374151',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleEditLibrary}
                style={{
                  padding: '8px 16px',
                  color: 'white',
                  backgroundColor: '#3E513E',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .library-item:hover .library-actions {
          opacity: 1 !important;
        }
        .form-control:focus {
          border-color: #3E513E;
          box-shadow: 0 0 0 0.2rem rgba(62, 81, 62, 0.25);
        }
        .form-select:focus {
          border-color: #3E513E;
          box-shadow: 0 0 0 0.2rem rgba(62, 81, 62, 0.25);
        }
      `}</style>
    </div>
  );
};

export default ResearchLibrary;