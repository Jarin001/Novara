const Annotations = require('../models/Annotations');

// Create annotation
exports.createAnnotation = async (req, res) => {
  try {
    const annotation = await Annotations.create(req.body);
    // Emit Socket.IO event here if needed
    res.status(201).json(annotation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get annotations for a paper
exports.getAnnotations = async (req, res) => {
  try {
    const { paperId } = req.params;
    const annotations = await Annotations.find({ paperId });
    res.json(annotations);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update annotation
exports.updateAnnotation = async (req, res) => {
  try {
    const { id } = req.params;
    const annotation = await Annotations.findByIdAndUpdate(id, req.body, { new: true });
    // Emit Socket.IO event here if needed
    res.json(annotation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete annotation
exports.deleteAnnotation = async (req, res) => {
  try {
    const { id } = req.params;
    await Annotations.findByIdAndDelete(id);
    // Emit Socket.IO event here if needed
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
