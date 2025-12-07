const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: true
  },
  industry: String,
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
  },
  website: String,
  logo: String,
  description: String,
  email: String,
  phone: String,
  address: String,
  city: String,
  state: String,
  country: String,
  
  // Company verified status
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  
  // Job postings
  jobPostings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting'
  }],
  
  // Company stats
  totalJobsPosted: { type: Number, default: 0 },
  totalApplications: { type: Number, default: 0 },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Company', companySchema);
