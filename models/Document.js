const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({

  candidateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Candidate" 
  },

  type: { type: String },       // aadhaar, marksheet10, marksheet12, resume
  fileId: { type: String },     // Google Drive file ID
  fileUrl: { type: String },    // URL from Google Form
  status: { 
    type: String, 
    default: "pending"          // pending, processing, verified, failed
  },

  aiExtracted: { type: Object, default: {} },    // raw OCR
  verificationResult: { type: Object, default: {} },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model("Document", DocumentSchema);
