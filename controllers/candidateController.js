const Candidate = require("../models/Candidate");
const Document = require("../models/Document");
const { parseResume } = require("../utils/resumeParser");
const { processAllDocuments } = require("../utils/aiVerification");
const { generateATSScore, quickATSScore } = require("../utils/atsScore");

/**
 * Submit form with candidate information and files
 * POST /api/candidates/submit
 */
exports.submitForm = async (req, res) => {
  try {
    const { name, email, phone, aadhar } = req.body;
    const files = req.files;

    // Validation
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ error: "At least one file is required" });
    }

    // Create candidate
    const candidate = new Candidate({
      name,
      email,
      phone,
      aadhar
    });

    await candidate.save();

    // Save documents
    const documentIds = [];

    for (const [fieldName, fileArray] of Object.entries(files)) {
      const file = fileArray[0]; // multer returns array

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
    }

    // Update candidate with document references
    candidate.documents = documentIds;
    await candidate.save();

    res.status(201).json({
      message: "Form submitted successfully",
      candidateId: candidate._id,
      candidate: candidate
    });
  } catch (error) {
    console.error("Error in submitForm:", error.message);
    res.status(500).json({ error: error.message });
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
 */
exports.verifyCandidateDocuments = async (req, res) => {
  try {
    const candidateId = req.params.id;

    // Get candidate and documents
    const candidate = await Candidate.findById(candidateId).populate('documents');

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // Update all documents to 'processing' status
    await Document.updateMany(
      { candidateId: candidateId },
      { status: 'processing' }
    );

    // Process each document type
    let resumeParsed = null;
    let atsScoreData = null;
    let documentsVerified = {};

    for (const document of candidate.documents) {
      try {
        console.log(`Processing document: ${document.type}, filePath: ${document.filePath}`);
        
        if (document.type === 'resume') {
          // Parse resume
          console.log('Parsing resume...');
          resumeParsed = await parseResume(document.filePath);
          console.log('Resume parsed successfully');
          
          candidate.extractedData.resume = resumeParsed;

          // Generate ATS score
          try {
            console.log('Generating ATS score...');
            atsScoreData = await generateATSScore(resumeParsed);
            console.log('ATS score generated successfully:', atsScoreData.atsScore);
            candidate.atsScore = atsScoreData.atsScore;
            document.atsScore = atsScoreData.atsScore;
          } catch (atsError) {
            console.error('ATS score generation error:', atsError.message);
            atsScoreData = { atsScore: null, scoreBreakdown: {}, error: atsError.message };
            candidate.atsScore = null;
            document.atsScore = null;
          }

          document.parsedData = resumeParsed;
          document.status = 'verified';
        } else {
          // Verify other documents (aadhar, marksheet10, marksheet12)
          console.log(`Verifying ${document.type}...`);
          documentsVerified[document.type] = await verifyDocument(document);
          console.log(`${document.type} verified successfully`);
          
          if (document.type === 'aadhar') {
            candidate.extractedData.aadhar = documentsVerified[document.type].extractedInfo;
          } else if (document.type === 'marksheet10') {
            candidate.extractedData.marksheet10 = documentsVerified[document.type].extractedInfo;
          } else if (document.type === 'marksheet12') {
            candidate.extractedData.marksheet12 = documentsVerified[document.type].extractedInfo;
          }

          document.parsedData = documentsVerified[document.type];
          document.verificationResult = documentsVerified[document.type].aiVerification;
          document.status = 'verified';
        }

        await document.save();
      } catch (docError) {
        console.error(`Error processing ${document.type}:`, docError.message);
        document.status = 'failed';
        document.verificationResult = { error: docError.message };
        await document.save();
      }
    }

    // Update candidate status
    candidate.verificationStatus = 'verified';
    candidate.verificationDetails = {
      processedAt: new Date(),
      resumeAtsScore: atsScoreData?.atsScore || null,
      documentsVerified: Object.keys(documentsVerified)
    };
    candidate.updatedAt = new Date();

    await candidate.save();

    res.json({
      message: "Verification completed",
      candidate: candidate,
      atsScore: atsScoreData,
      documentsVerified: documentsVerified
    });
  } catch (error) {
    console.error("Error in verifyCandidateDocuments:", error.message);

    // Mark candidate as failed
    try {
      await Candidate.findByIdAndUpdate(
        req.params.id,
        { verificationStatus: 'failed' }
      );
    } catch (updateError) {
      console.error("Error updating candidate status:", updateError.message);
    }

    res.status(500).json({ error: error.message });
  }
};

/**
 * Helper function to verify individual document
 */
async function verifyDocument(document) {
  const { verifyAadhar, verifyMarksheet } = require("../utils/aiVerification");

  if (document.type === 'aadhar') {
    return await verifyAadhar(document.filePath);
  } else if (document.type === 'marksheet10') {
    return await verifyMarksheet(document.filePath, 'marksheet10');
  } else if (document.type === 'marksheet12') {
    return await verifyMarksheet(document.filePath, 'marksheet12');
  }

  throw new Error(`Unknown document type: ${document.type}`);
}

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
