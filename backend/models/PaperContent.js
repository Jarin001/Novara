const mongoose = require('mongoose');

const PaperContentSchema = new mongoose.Schema(
  {
    paperId: {
      type: String,
      required: true,
      unique: true,  // maps to PostgreSQL paper ID
    },
    s2PaperId: {
      type: String,
      required: true,
    },
    abstract: {
      type: String,
      default: '',
    },
    bibtex: {
      type: String,
      default: '',
    }
  },
  { timestamps: true } // createdAt, updatedAt
);

module.exports = mongoose.model('PaperContent', PaperContentSchema);
