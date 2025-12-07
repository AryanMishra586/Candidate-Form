const Individual = require('../models/Individual');
const User = require('../models/User');
const { parseResume } = require('../utils/resumeParser');
const { generateATSScore } = require('../utils/atsScore');
const { callGeminiForAtsScore } = require('../utils/geminiAtsScore');
const fs = require('fs');
const path = require('path');

/**
 * Get Individual Profile
 * GET /api/individual/profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('[INDIVIDUAL] Getting profile for user:', userId);

    const individual = await Individual.findOne({ userId }).populate('userId', 'email firstName lastName isVerified');
    
    if (!individual) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      success: true,
      profile: individual
    });
  } catch (error) {
    console.error('[INDIVIDUAL] Error getting profile:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update Individual Profile
 * PUT /api/individual/profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, phone, location, bio, profilePicture } = req.body;

    console.log('[INDIVIDUAL] Updating profile for user:', userId);
    console.log('[INDIVIDUAL] Full req.user object:', req.user);

    let individual = await Individual.findOne({ userId });
    console.log('[INDIVIDUAL] Query result for userId', userId, ':', individual ? 'Found' : 'Not found');
    
    if (!individual) {
      // Debug: Try to find ANY individual profile
      const allProfiles = await Individual.find({});
      console.log('[INDIVIDUAL] Total profiles in DB:', allProfiles.length);
      console.log('[INDIVIDUAL] Profile userId values:', allProfiles.map(p => p.userId));
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Update only provided fields
    if (firstName) individual.firstName = firstName;
    if (lastName) individual.lastName = lastName;
    if (phone) individual.phone = phone;
    if (location) individual.location = location;
    if (bio) individual.bio = bio;
    if (profilePicture) individual.profilePicture = profilePicture;

    individual.updatedAt = new Date();
    await individual.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: individual
    });
  } catch (error) {
    console.error('[INDIVIDUAL] Error updating profile:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Upload and Parse Resume
 * POST /api/individual/upload-resume
 */
const uploadResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    console.log('[RESUME] Received resume upload from user:', userId);
    console.log('[RESUME] File:', req.file.filename, 'Size:', req.file.size);

    const filePath = req.file.path;

    // Parse resume
    console.log('[RESUME] Starting resume parsing...');
    const parsedData = await parseResume(filePath);
    
    if (!parsedData || !parsedData.rawText) {
      return res.status(400).json({ error: 'Failed to parse resume' });
    }

    const { rawText } = parsedData;

    // Calculate ATS Score (try Gemini first, fallback to hybrid)
    console.log('[RESUME] Calculating ATS score...');
    let atsScore = 0;
    
    try {
      const geminiResult = await callGeminiForAtsScore({
        rawText,
        ...parsedData
      });
      
      if (geminiResult && geminiResult.atsScore) {
        atsScore = geminiResult.atsScore;
        console.log('[RESUME] ✅ Gemini ATS Score:', atsScore);
      } else {
        const hybridResult = await generateATSScore({
          skills: parsedData.skills,
          experience: parsedData.experience,
          education: parsedData.education
        });
        atsScore = hybridResult.atsScore || 0;
        console.log('[RESUME] ⚠️ Fallback Hybrid ATS Score:', atsScore);
      }
    } catch (geminiError) {
      console.error('[RESUME] Gemini API error, using fallback:', geminiError.message);
      const hybridResult = await generateATSScore({
        skills: parsedData.skills,
        experience: parsedData.experience,
        education: parsedData.education
      });
      atsScore = hybridResult.atsScore || 0;
      console.log('[RESUME] Fallback Hybrid ATS Score:', atsScore);
    }

    // Update Individual profile with resume data
    let individual = await Individual.findOne({ userId });
    if (!individual) {
      return res.status(404).json({ error: 'Individual profile not found' });
    }

    // Sanitize and validate parsed data
    const sanitizedSkills = Array.isArray(parsedData.skills) 
      ? parsedData.skills.filter(s => typeof s === 'string').slice(0, 50)
      : [];
    
    const sanitizedExperience = Array.isArray(parsedData.experience)
      ? parsedData.experience.filter(e => e && typeof e === 'object').slice(0, 20)
      : [];
    
    const sanitizedEducation = Array.isArray(parsedData.education)
      ? parsedData.education.filter(e => typeof e === 'string').slice(0, 10)
      : [];
    
    const sanitizedProjects = Array.isArray(parsedData.projects)
      ? parsedData.projects.filter(p => typeof p === 'string').slice(0, 20)
      : [];
    
    const sanitizedAtsScore = typeof atsScore === 'number' && !isNaN(atsScore) 
      ? Math.round(Math.max(0, Math.min(100, atsScore)))
      : 0;

    console.log('[RESUME] Sanitized data - Skills:', sanitizedSkills.length, 'Exp:', sanitizedExperience.length, 'Score:', sanitizedAtsScore);

    individual.resume = {
      fileName: req.file.originalname,
      uploadedAt: new Date(),
      storageType: 'local',
      extractedData: {
        rawText: rawText.substring(0, 50000), // Limit to prevent oversized documents
        skills: sanitizedSkills,
        experience: sanitizedExperience,
        education: sanitizedEducation,
        projects: sanitizedProjects,
        achievements: Array.isArray(parsedData.achievements) ? parsedData.achievements.slice(0, 20) : []
      },
      atsScore: sanitizedAtsScore,
      verificationStatus: 'pending'
    };

    // Mark profile as more complete
    individual.profileComplete = true;
    individual.updatedAt = new Date();
    
    await individual.save();

    console.log('[RESUME] ✅ Resume saved successfully. ATS Score:', sanitizedAtsScore);

    res.json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
      resume: {
        fileName: individual.resume.fileName,
        uploadedAt: individual.resume.uploadedAt,
        atsScore: individual.resume.atsScore,
        extractedData: {
          skills: individual.resume.extractedData.skills,
          experience: individual.resume.extractedData.experience,
          education: individual.resume.extractedData.education,
          projects: individual.resume.extractedData.projects
        }
      }
    });

    // Clean up uploaded file after processing
    setTimeout(() => {
      try {
        fs.unlinkSync(filePath);
        console.log('[RESUME] Temp file cleaned up');
      } catch (err) {
        console.error('[RESUME] Error cleaning temp file:', err.message);
      }
    }, 1000);

  } catch (error) {
    console.error('[RESUME] Error uploading resume:', error.message);
    
    // Clean up file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('[RESUME] Error cleaning temp file:', err.message);
      }
    }
    
    res.status(500).json({ error: error.message });
  }
};

/**
 * Upload Background Verification Documents
 * POST /api/individual/upload-background-docs
 */
const uploadBackgroundDocs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { docType } = req.body; // 'aadhar', 'marksheet10', 'marksheet12'

    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded' });
    }

    if (!['aadhar', 'marksheet10', 'marksheet12'].includes(docType)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    console.log('[BACKGROUND] Uploading', docType, 'for user:', userId);

    const individual = await Individual.findOne({ userId });
    if (!individual) {
      return res.status(404).json({ error: 'Individual profile not found' });
    }

    // Store document file id/path
    individual.documents[docType] = {
      fileId: req.file.filename,
      verified: false,
      verifiedAt: null,
      scoreBoost: 0
    };

    individual.updatedAt = new Date();
    await individual.save();

    console.log('[BACKGROUND] ✅', docType, 'uploaded successfully');

    res.json({
      success: true,
      message: `${docType} uploaded successfully`,
      document: {
        type: docType,
        uploadedAt: new Date(),
        verificationStatus: 'pending'
      }
    });

  } catch (error) {
    console.error('[BACKGROUND] Error uploading document:', error.message);
    
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('[BACKGROUND] Error cleaning temp file:', err.message);
      }
    }
    
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get Background Verification Status
 * GET /api/individual/background-status
 */
const getBackgroundStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    const individual = await Individual.findOne({ userId });
    if (!individual) {
      return res.status(404).json({ error: 'Individual profile not found' });
    }

    res.json({
      success: true,
      backgroundStatus: {
        aadhar: {
          uploaded: !!individual.documents.aadhar?.fileId,
          verified: individual.documents.aadhar?.verified || false,
          verifiedAt: individual.documents.aadhar?.verifiedAt
        },
        marksheet10: {
          uploaded: !!individual.documents.marksheet10?.fileId,
          verified: individual.documents.marksheet10?.verified || false,
          verifiedAt: individual.documents.marksheet10?.verifiedAt
        },
        marksheet12: {
          uploaded: !!individual.documents.marksheet12?.fileId,
          verified: individual.documents.marksheet12?.verified || false,
          verifiedAt: individual.documents.marksheet12?.verifiedAt
        },
        overallVerificationStatus: calculateVerificationStatus(individual.documents)
      }
    });

  } catch (error) {
    console.error('[BACKGROUND] Error getting verification status:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get Resume Data
 * GET /api/individual/resume
 */
const getResumeData = async (req, res) => {
  try {
    const userId = req.user.userId;

    const individual = await Individual.findOne({ userId });
    if (!individual) {
      return res.status(404).json({ error: 'Individual profile not found' });
    }

    if (!individual.resume) {
      return res.status(404).json({ error: 'No resume uploaded yet' });
    }

    res.json({
      success: true,
      resume: {
        fileName: individual.resume.fileName,
        uploadedAt: individual.resume.uploadedAt,
        atsScore: individual.resume.atsScore,
        extractedData: individual.resume.extractedData,
        verificationStatus: individual.resume.verificationStatus
      }
    });

  } catch (error) {
    console.error('[INDIVIDUAL] Error getting resume:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Calculate overall verification status
 */
function calculateVerificationStatus(documents) {
  const aadharVerified = documents.aadhar?.verified || false;
  const m10Verified = documents.marksheet10?.verified || false;
  const m12Verified = documents.marksheet12?.verified || false;

  if (aadharVerified && m10Verified && m12Verified) {
    return 'fully_verified';
  } else if (aadharVerified || m10Verified || m12Verified) {
    return 'partially_verified';
  } else {
    return 'not_verified';
  }
}

module.exports = {
  getProfile,
  updateProfile,
  uploadResume,
  uploadBackgroundDocs,
  getBackgroundStatus,
  getResumeData
};
