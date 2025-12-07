const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 86400 // Automatically delete after 24 hours
    },
    reason: {
      type: String,
      enum: ['logout', 'password_change', 'admin_action'],
      default: 'logout'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
