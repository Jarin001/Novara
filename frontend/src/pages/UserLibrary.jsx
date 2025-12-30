import React, { useState } from 'react';
import { 
  FolderOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  FileText, 
  TrendingUp, 
  X, 
  Save, 
  StickyNote,
  Search
} from 'lucide-react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Badge,
  InputGroup,
  Dropdown,
  ListGroup,
  Nav,
  Navbar
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPapers = papers.filter(p => 
    (selectedLibrary === 'all' || p.libraryId === selectedLibrary) &&
    (searchQuery === '' || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.field.toLowerCase().includes(searchQuery.toLowerCase()))
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

  const getStatusVariant = (status) => {
    switch(status) {
      case 'read': return 'success';
      case 'in-progress': return 'warning';
      case 'unread': return 'secondary';
      default: return 'secondary';
    }
  };

  const selectedLibraryName = libraries.find(l => l.id === selectedLibrary)?.name || 'All Papers';

  return (
    <Container fluid className="vh-100 p-0 bg-light">
      {/* Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="px-4">
        <Navbar.Brand href="#" className="d-flex align-items-center gap-3">
          <FileText size={24} />
          <span className="h4 mb-0">Research Library</span>
        </Navbar.Brand>
      </Navbar>

      <Row className="g-0 h-100">
        {/* Sidebar */}
        <Col md={3} lg={2} className="border-end bg-white">
          <div className="d-flex flex-column h-100">
            <div className="p-3 border-bottom">
              <h6 className="text-muted text-uppercase fw-semibold mb-0">Libraries</h6>
            </div>
            
            <ListGroup variant="flush" className="flex-grow-1 overflow-auto">
              {libraries.map(library => (
                <ListGroup.Item
                  key={library.id}
                  action
                  active={selectedLibrary === library.id}
                  onClick={() => setSelectedLibrary(library.id)}
                  className="border-0 rounded-0 py-3 d-flex align-items-center justify-content-between"
                >
                  <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
                    <FolderOpen 
                      size={18} 
                      className={selectedLibrary === library.id ? 'text-primary' : 'text-muted'} 
                    />
                    <span className="text-truncate">{library.name}</span>
                  </div>
                  
                  {!library.isDefault && (
                    <div className="d-flex gap-1 opacity-0 hover-opacity-100">
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLibrary(library);
                          setNewLibraryName(library.name);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLibrary(library.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>

            <div className="p-3 border-top">
              <Button 
                variant="primary" 
                className="w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={() => setShowNewLibraryModal(true)}
              >
                <Plus size={18} />
                New Library
              </Button>
            </div>
          </div>
        </Col>

        {/* Main Content */}
        <Col md={9} lg={10} className="d-flex flex-column">
          <div className="p-4 border-bottom bg-white">
            <Row className="align-items-center mb-3">
              <Col>
                <div className="d-flex align-items-center gap-3">
                  <FolderOpen size={24} className="text-primary" />
                  <h2 className="h4 mb-0 fw-semibold">{selectedLibraryName}</h2>
                </div>
              </Col>
              <Col xs="auto">
                <div className="d-flex gap-2">
                  <Button variant="outline-primary" size="sm">Share</Button>
                  <Button variant="outline-secondary" size="sm">Settings</Button>
                </div>
              </Col>
            </Row>

            <Row className="align-items-center">
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <Search size={18} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search Papers"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={3} className="ms-auto">
                <Form.Select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  size="sm"
                >
                  <option value="dateAdded">Sort by Date Added</option>
                  <option value="citations">Sort by Citations</option>
                  <option value="datePublished">Sort by Publication Date</option>
                </Form.Select>
              </Col>
            </Row>
          </div>

          {/* Papers List */}
          <div className="flex-grow-1 overflow-auto p-4">
            {sortedPapers.length === 0 ? (
              <Card className="text-center py-5 my-5 border-0">
                <Card.Body>
                  <FileText size={64} className="text-muted mb-3" />
                  <h5 className="text-muted">No papers in this library</h5>
                  {searchQuery && (
                    <p className="text-muted mt-2">Try a different search term</p>
                  )}
                </Card.Body>
              </Card>
            ) : (
              <div className="row g-4">
                {sortedPapers.map(paper => (
                  <Col xs={12} key={paper.id}>
                    <Card className="border">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <Card.Title as="h5" className="mb-1">
                            <a href="#" className="text-decoration-none text-primary">
                              {paper.title}
                            </a>
                          </Card.Title>
                          <Button
                            variant="link"
                            className="p-0 text-decoration-none"
                            onClick={() => openNotesModal(paper.id)}
                            title="Add/Edit Notes"
                          >
                            <StickyNote 
                              size={18} 
                              className={paper.notes ? 'text-warning' : 'text-muted'}
                            />
                          </Button>
                        </div>

                        <Card.Subtitle className="mb-2 text-muted">
                          {paper.authors.join(', ')}
                        </Card.Subtitle>

                        <Badge bg="light" text="dark" className="mb-2">
                          {paper.field}
                        </Badge>

                        <p className="text-muted mb-3 small">
                          {paper.venue} · {paper.date}
                        </p>

                        <p className="mb-3">
                          {paper.abstract}{' '}
                          <a href="#" className="text-decoration-none">Expand</a>
                        </p>

                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center gap-1">
                              <TrendingUp size={16} className="text-muted" />
                              <span className="fw-semibold">{paper.citations} citations</span>
                            </div>
                            <Button variant="link" size="sm" className="p-0 text-decoration-none">
                              {paper.source}
                            </Button>
                            <Button variant="link" size="sm" className="p-0 text-decoration-none">
                              Alert
                            </Button>
                            <Button variant="link" size="sm" className="p-0 text-decoration-none">
                              Cite
                            </Button>
                            <Button variant="link" size="sm" className="p-0 text-decoration-none text-primary">
                              Influential Papers
                            </Button>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 text-decoration-none text-danger"
                              onClick={() => handleRemovePaper(paper.id)}
                            >
                              Remove
                            </Button>
                          </div>

                          <Dropdown>
                            <Dropdown.Toggle 
                              variant={getStatusVariant(paper.readingStatus)} 
                              size="sm"
                              className="text-capitalize"
                            >
                              {paper.readingStatus.replace('-', ' ')}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleReadingStatusChange(paper.id, 'unread')}>
                                Unread
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleReadingStatusChange(paper.id, 'in-progress')}>
                                In Progress
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleReadingStatusChange(paper.id, 'read')}>
                                Read
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Notes Modal */}
      <Modal
        show={notesModal.show}
        onHide={() => setNotesModal({ show: false, paperId: null, notes: '' })}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Personal Notes</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <Form.Control
            as="textarea"
            value={notesModal.notes}
            onChange={(e) => setNotesModal({ ...notesModal, notes: e.target.value })}
            placeholder="Write your notes here..."
            className="border-0 p-4"
            style={{ minHeight: '300px', resize: 'none' }}
            autoFocus
          />
        </Modal.Body>
        <Modal.Footer>
          {notesModal.notes && (
            <Button variant="outline-danger" onClick={deleteNotes}>
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={() => setNotesModal({ show: false, paperId: null, notes: '' })}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveNotes}>
            <Save size={18} className="me-2" />
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* New Library Modal */}
      <Modal
        show={showNewLibraryModal}
        onHide={() => setShowNewLibraryModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Create New Library</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            type="text"
            value={newLibraryName}
            onChange={(e) => setNewLibraryName(e.target.value)}
            placeholder="Library name"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateLibrary()}
            autoFocus
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewLibraryModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateLibrary}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Library Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Library</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            type="text"
            value={newLibraryName}
            onChange={(e) => setNewLibraryName(e.target.value)}
            placeholder="Library name"
            onKeyPress={(e) => e.key === 'Enter' && handleEditLibrary()}
            autoFocus
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditLibrary}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ResearchLibrary;