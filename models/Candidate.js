const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  phone: { type: String },

  documents: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Document" }
  ],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Candidate", CandidateSchema);
