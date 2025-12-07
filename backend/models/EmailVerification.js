const mongoose = require('mongoose');
const crypto = require('crypto');

const emailVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Auto-delete expired tokens
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Max 5 verification attempts
  },
  lastAttemptAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate verification token (called before saving)
emailVerificationSchema.methods.generateToken = function() {
  // Generate a random token
  const token = crypto.randomBytes(32).toString('hex');
  // Hash it for storage
  this.tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  // Set expiration to 24 hours
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  // Return plain token (only this can verify)
  return token;
};

// Verify token method
emailVerificationSchema.methods.verifyToken = function(providedToken) {
  const hash = crypto.createHash('sha256').update(providedToken).digest('hex');
  return this.tokenHash === hash;
};

// Check if token is expired
emailVerificationSchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt;
};

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
