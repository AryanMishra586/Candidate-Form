const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({

  candidateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Candidate",
    required: true
  },

  type: { type: String, enum: ['aadhar', 'marksheet10', 'marksheet12', 'resume'], required: true },
  filePath: { type: String },           // Local file path after upload
  originalName: { type: String },       // Original filename
  mimeType: { type: String },           // File MIME type
  fileSize: { type: Number },           // File size in bytes
  
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'verified', 'failed'],
    default: "pending"
  },

  parsedData: { type: Object, default: {} },    // OCR/Parsed output from AI
  verificationResult: { type: Object, default: {} },
  atsScore: { type: Number },                    // If this is a resume

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model("Document", DocumentSchema);
