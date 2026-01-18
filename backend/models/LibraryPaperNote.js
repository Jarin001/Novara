const mongoose = require('mongoose');

const LibraryPaperNoteSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    libraryId: {
      type: String,
      required: true,
    },
    paperId: {
      type: String,
      required: true,
    },
    userNote: {
      type: String,
      default: '',
    }
  },
  { timestamps: true }
);

// Ensure uniqueness per user + library + paper
LibraryPaperNoteSchema.index({ userId: 1, libraryId: 1, paperId: 1 }, { unique: true });

module.exports = mongoose.model('LibraryPaperNote', LibraryPaperNoteSchema);
