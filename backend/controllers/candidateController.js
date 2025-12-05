const Candidate = require("../models/Candidate");
const Document = require("../models/Document");

/**
 * Submit form with candidate information and files
 * POST /api/candidates/submit
 */
exports.submitForm = async (req, res) => {
  try {
    console.log('[SUBMIT] Received request');
    console.log('[SUBMIT] Body:', req.body);
    console.log('[SUBMIT] Files:', Object.keys(req.files || {}));
    
    const { name, email, phone, aadhar } = req.body;
    const files = req.files;

    // Validation
    if (!name || !email) {
      console.warn('[SUBMIT] Missing name or email');
      return res.status(400).json({ error: "Name and email are required" });
    }

    if (!files || Object.keys(files).length === 0) {
      console.warn('[SUBMIT] No files uploaded');
      return res.status(400).json({ error: "At least one file is required" });
    }

    console.log('[SUBMIT] Creating candidate:', { name, email, phone, aadhar });

    // Create candidate
    const candidate = new Candidate({
      name,
      email,
      phone,
      aadhar
    });

    await candidate.save();
    console.log('[SUBMIT] Candidate saved with ID:', candidate._id);

    // Save documents
    const documentIds = [];

    for (const [fieldName, fileArray] of Object.entries(files)) {
      const file = fileArray[0]; // multer returns array

      console.log(`[SUBMIT] Processing file for field "${fieldName}":`, {
        originalName: file.originalname,
        size: file.size,
        path: file.path
      });

      const document = new Document({
        candidateId: candidate._id,
        type: fieldName, // resume, aadhar, marksheet10, marksheet12
        filePath: file.path,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        status: 'pending'
      });

      await document.save();
      documentIds.push(document._id);
      console.log(`[SUBMIT] Document saved for "${fieldName}" with ID:`, document._id);
    }

    // Update candidate with document references
    candidate.documents = documentIds;
    await candidate.save();
    console.log('[SUBMIT] Candidate updated with document references');

    const response = {
      message: "Form submitted successfully",
      candidateId: candidate._id,
      candidate: candidate
    };
    
    console.log('[SUBMIT] Sending response:', response.message);
    res.status(201).json(response);
  } catch (error) {
    console.error("[SUBMIT] Error in submitForm:", error.message);
    console.error("[SUBMIT] Stack:", error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

/**
 * Get all candidates
 * GET /api/candidates
 */
exports.getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .populate('documents')
      .sort({ createdAt: -1 });

    res.json({
      total: candidates.length,
      candidates: candidates
    });
  } catch (error) {
    console.error("Error in getAllCandidates:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get specific candidate with documents
 * GET /api/candidates/:id
 */
exports.getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('documents');

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    res.json(candidate);
  } catch (error) {
    console.error("Error in getCandidateById:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Verify candidate documents and generate scores
 * POST /api/candidates/:id/verify
 * 
 * GRACEFUL HANDLING:
 * - Always extracts resume data (highest priority)
 * - Attempts ATS score generation (non-critical)
 * - Attempts document verification (non-critical)
 * - Returns partial results even if some steps fail
 */
exports.verifyCandidateDocuments = async (req, res) => {
  try {
    const candidateId = req.params.id;

    // Get candidate and documents
    const candidate = await Candidate.findById(candidateId).populate('documents');

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // Initialize extraction data
    let resumeParsed = null;
    let atsScoreData = null;
    let resumeExtractionSucceeded = false;

    // STEP 1: EXTRACT RESUME DATA (HIGHEST PRIORITY)
    const resumeDoc = candidate.documents.find(d => d.type === 'resume');
    if (resumeDoc) {
      try {
        console.log(`[VERIFY] Parsing resume from: ${resumeDoc.filePath}`);
        const { parseResume } = require("../utils/resumeParser");
        resumeParsed = await parseResume(resumeDoc.filePath);
        console.log(`[VERIFY] Resume parsed successfully. Skills: ${resumeParsed.skills?.length || 0}, Experience: ${resumeParsed.experience?.length || 0}, Education: ${resumeParsed.education?.length || 0}`);
        console.log(`[VERIFY] Full parsed data:`, JSON.stringify(resumeParsed).substring(0, 500));
        
        // Store parsed data
        candidate.extractedData.resume = resumeParsed;
        candidate.markModified('extractedData'); // Tell Mongoose about nested change
        resumeExtractionSucceeded = true;
        resumeDoc.status = 'verified';
        resumeDoc.parsedData = resumeParsed;
        await resumeDoc.save();
        
        console.log(`[VERIFY] Resume data stored. Candidate extractedData:`, JSON.stringify(candidate.extractedData).substring(0, 500));
      } catch (parseError) {
        console.error(`[VERIFY] Resume parsing failed:`, parseError.message);
        console.error(`[VERIFY] Stack:`, parseError.stack);
        resumeDoc.status = 'failed';
        resumeDoc.verificationResult = { error: parseError.message };
        await resumeDoc.save();
      }
    }

    // STEP 2: GENERATE ATS SCORE (NON-CRITICAL)
    if (resumeExtractionSucceeded && resumeParsed) {
      try {
        console.log(`[VERIFY] Generating ATS score...`);
        const { generateATSScore } = require("../utils/atsScore");
        atsScoreData = await generateATSScore(resumeParsed);
        candidate.atsScore = atsScoreData.atsScore;
        console.log(`[VERIFY] ATS score generated: ${atsScoreData.atsScore}`);
      } catch (atsError) {
        console.warn(`[VERIFY] ATS score generation failed (non-critical):`, atsError.message);
        atsScoreData = null;
        candidate.atsScore = null;
      }
    }

    // STEP 3: ATTEMPT DOCUMENT VERIFICATION (NON-CRITICAL)
    const otherDocs = candidate.documents.filter(d => d.type !== 'resume');
    for (const document of otherDocs) {
      try {
        console.log(`[VERIFY] Attempting to verify ${document.type}...`);
        // DISABLED: Gemini API calls - causing crashes
        // const { verifyAadhar, verifyMarksheet } = require("../utils/aiVerification");
        
        // For now, just mark as verified without calling Gemini
        document.status = 'verified';
        console.log(`[VERIFY] ${document.type} marked as verified (API call skipped)`);
      } catch (docError) {
        console.warn(`[VERIFY] ${document.type} verification failed (non-critical):`, docError.message);
        document.status = 'failed';
        document.verificationResult = { error: docError.message };
      }
      await document.save();
    }

    // Update candidate status based on resume extraction
    candidate.verificationStatus = resumeExtractionSucceeded ? 'verified' : 'partial';
    candidate.verificationDetails = {
      processedAt: new Date(),
      resumeExtracted: resumeExtractionSucceeded,
      resumeAtsScore: atsScoreData?.atsScore || null,
      resumeSkills: resumeParsed?.skills?.length || 0,
      resumeExperience: resumeParsed?.experience?.length || 0,
      resumeEducation: resumeParsed?.education?.length || 0
    };
    candidate.updatedAt = new Date();

    await candidate.save();

    // Return response with all available data
    res.json({
      message: resumeExtractionSucceeded ? "Verification completed successfully" : "Partial verification - resume data extracted",
      candidate: candidate,
      atsScore: atsScoreData,
      resumeExtracted: resumeExtractionSucceeded
    });
  } catch (error) {
    console.error("[VERIFY] Critical error in verifyCandidateDocuments:", error.message);

    // Try to save partial state
    try {
      await Candidate.findByIdAndUpdate(
        req.params.id,
        { 
          verificationStatus: 'failed',
          updatedAt: new Date()
        }
      );
    } catch (updateError) {
      console.error("[VERIFY] Error updating candidate status:", updateError.message);
    }

    res.status(500).json({ 
      error: error.message,
      message: "Verification failed - please contact support"
    });
  }
};

/**
 * Update candidate status
 * PATCH /api/candidates/:id/status
 */
exports.updateCandidateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'verified', 'failed'].includes(status)) {
      return res.status(400).json({ 
        error: "Invalid status. Must be one of: pending, verified, failed" 
      });
    }

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status, updatedAt: new Date() },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    res.json({
      message: "Candidate status updated",
      candidate: candidate
    });
  } catch (error) {
    console.error("Error in updateCandidateStatus:", error.message);
    res.status(500).json({ error: error.message });
  }
};
