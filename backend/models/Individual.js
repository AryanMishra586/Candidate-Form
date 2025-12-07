const mongoose = require('mongoose');

const individualSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phone: String,
  location: String,
  bio: String,
  profilePicture: String,
  
  // Resume data
  resume: {
    fileId: String, // Google Drive or local ID
    fileName: String,
    uploadedAt: Date,
    storageType: { type: String, enum: ['local', 'drive'], default: 'local' },
    extractedData: {
      rawText: String,
      skills: [String],
      experience: [{
        company: String,
        title: String,
        period: String,
        description: [String]
      }],
      education: [String],
      projects: [String],
      achievements: [String]
    },
    atsScore: Number,
    verificationStatus: { 
      type: String, 
      enum: ['pending', 'verified', 'rejected'], 
      default: 'pending' 
    }
  },
  
  // Document verification
  documents: {
    aadhar: {
      fileId: String,
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      scoreBoost: { type: Number, default: 0 }
    },
    marksheet10: {
      fileId: String,
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      scoreBoost: { type: Number, default: 0 }
    },
    marksheet12: {
      fileId: String,
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      scoreBoost: { type: Number, default: 0 }
    }
  },
  
  // Application tracking
  appliedJobs: [{
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting' },
    appliedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['applied', 'shortlisted', 'rejected', 'accepted'], default: 'applied' }
  }],
  
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting' }],
  
  // Profile completeness
  profileComplete: { type: Boolean, default: false },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Individual', individualSchema);
