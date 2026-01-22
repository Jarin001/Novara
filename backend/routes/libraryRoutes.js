const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');

// Import from both controllers
const {
  createLibrary,
  getUserLibraries,
  getLibrary,
  updateLibrary,
  deleteLibrary
} = require('../controllers/libraryController');

const {
  savePaperToLibrary,
  getLibraryPapers,
  removePaperFromLibrary,
  updateReadingStatus,
  updatePaperNote
} = require('../controllers/libraryPaperController');

// All routes require authentication
router.use(authenticate);

// Library CRUD
router.post('/', createLibrary);                    // Create library
router.get('/', getUserLibraries);                  // Get all user's libraries (my + shared)
router.get('/:library_id', getLibrary);             // Get single library
router.put('/:library_id', updateLibrary);          // Update library (both owner & collaborator)
router.delete('/:library_id', deleteLibrary);       // Delete library (ONLY owner)

// Library papers management
router.post('/:library_id/papers', savePaperToLibrary);           // Add paper to library
router.get('/:library_id/papers', getLibraryPapers);              // Get all papers in library
router.delete('/:library_id/papers/:paper_id', removePaperFromLibrary); // Remove paper

// Additional paper operations
router.patch('/:library_id/papers/:paper_id/status', updateReadingStatus); // Update reading status
router.patch('/:library_id/papers/:paper_id/note', updatePaperNote);       // Update user note

module.exports = router;