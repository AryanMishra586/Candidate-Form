const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  aadhar: { type: String },

  documents: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Document" }
  ],

  extractedData: {
    resume: { type: Object, default: {} },      // Parsed resume data
    aadhar: { type: Object, default: {} },      // OCR from aadhar
    marksheet10: { type: Object, default: {} }, // OCR from 10th marksheet
    marksheet12: { type: Object, default: {} }  // OCR from 12th marksheet
  },

  atsScore: { type: Number },
  verificationStatus: { type: String, enum: ['pending', 'verified', 'failed'], default: 'pending' },
  verificationDetails: { type: Object, default: {} },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Candidate", CandidateSchema);
