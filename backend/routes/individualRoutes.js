const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  uploadResume,
  uploadBackgroundDocs,
  getBackgroundStatus,
  getResumeData
} = require('../controllers/individualController');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/individual/profile
 * Get Individual profile
 */
router.get('/profile', getProfile);

/**
 * PUT /api/individual/profile
 * Update Individual profile
 */
router.put('/profile', updateProfile);

/**
 * POST /api/individual/upload-resume
 * Upload and parse resume
 */
router.post('/upload-resume', upload.single('resume'), uploadResume);

/**
 * POST /api/individual/upload-background-docs
 * Upload background verification documents (aadhar, marksheet10, marksheet12)
 */
router.post('/upload-background-docs', upload.single('document'), uploadBackgroundDocs);

/**
 * GET /api/individual/background-status
 * Get background verification status
 */
router.get('/background-status', getBackgroundStatus);

/**
 * GET /api/individual/resume
 * Get resume data
 */
router.get('/resume', getResumeData);

module.exports = router;
