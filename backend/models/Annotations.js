const mongoose = require("mongoose");

const annotationSchema = new mongoose.Schema(
  {
    libraryId: { type: String, required: true }, // SQL UUID
    paperId: { type: String, required: true },   // SQL UUID
    userId: { type: String, required: true },    // SQL UUID

    pageNumber: { type: Number, required: true },

    type: {
      type: String,
      enum: ["highlight", "note"],
      required: true
    },

    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    },

    replies: [
      {
        text: { type: String, default: '' },
        userId: { type: String },
        userName: { type: String },
        createdAt: { type: Date, default: Date.now },
      }
    ],

    content: { type: String, default: "" },
    color: { type: String, default: "#FFFF00" }, // default highlight color
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

module.exports = mongoose.model("Annotation", annotationSchema);