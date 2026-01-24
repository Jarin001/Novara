// const express = require('express');
// const router = express.Router();

// const {
//   fetchPaperPreview,
//   addUserPublication,
//   getUserPublications,
//   removeUserPublication
// } = require('../controllers/paperController');

// const { authenticate } = require('../middlewares/authMiddleware');

// // All routes require authentication
// router.use(authenticate);

// // Preview paper details (before adding)
// router.post('/preview', fetchPaperPreview);

// // User publications management
// router.post('/publications', addUserPublication);              // Add paper to user's publications
// router.get('/publications', getUserPublications);              // Get all user's publications
// router.delete('/publications/:publication_id', removeUserPublication); // Remove publication

// module.exports = router;


const express = require('express');
const router = express.Router();

const {
  fetchPaperPreview,
  addUserPublication,
  getUserPublications,
  removeUserPublication
} = require('../controllers/paperController');

const { authenticate } = require('../middlewares/authMiddleware');

// PUBLIC ROUTES (no authentication)


// PROTECTED ROUTES (require authentication)
router.post('/preview', authenticate , fetchPaperPreview);
router.post('/publications', authenticate, addUserPublication);
router.get('/publications', authenticate, getUserPublications);
router.delete('/publications/:publication_id', authenticate, removeUserPublication);

module.exports = router;