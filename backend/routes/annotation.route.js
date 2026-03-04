const express = require('express');
const router = express.Router();
const annotationController = require('../controllers/annotation.controller');

// Create annotation
router.post('/', annotationController.createAnnotation);
// Get annotations for a paper
router.get('/:paperId', annotationController.getAnnotations);
// Update annotation
router.put('/:id', annotationController.updateAnnotation);
// Delete annotation
router.delete('/:id', annotationController.deleteAnnotation);

module.exports = router;
