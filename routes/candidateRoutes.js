const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
  submitForm,
  getCandidateById,
  verifyCandidateDocuments,
  getAllCandidates,
  updateCandidateStatus
} = require("../controllers/candidateController");

/**
 * POST /api/candidates/submit
 * Submit form with candidate information and files
 * Files: resume, aadhar, marksheet10, marksheet12
 */
router.post("/submit", upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "aadhar", maxCount: 1 },
  { name: "marksheet10", maxCount: 1 },
  { name: "marksheet12", maxCount: 1 }
]), submitForm);

/**
 * POST /api/candidates/:id/verify
 * Trigger AI verification for a specific candidate
 * - Parse resume and generate ATS score
 * - Run OCR on aadhar, marksheet10, marksheet12
 * - Verify document authenticity
 */
router.post("/:id/verify", verifyCandidateDocuments);

/**
 * PATCH /api/candidates/:id/status
 * Update candidate verification status
 * Body: { status: 'pending' | 'verified' | 'failed' }
 */
router.patch("/:id/status", updateCandidateStatus);

/**
 * GET /api/candidates
 * Get all candidates (for admin dashboard)
 */
router.get("/", getAllCandidates);

/**
 * GET /api/candidates/:id
 * Get specific candidate with their documents and verification results
 */
router.get("/:id", getCandidateById);

module.exports = router;
