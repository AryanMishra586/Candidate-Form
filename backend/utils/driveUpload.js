const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Initialize Google Drive API with API key
// For production, use service account auth; for now using API key
const drive = google.drive({
  version: 'v3',
  auth: process.env.GOOGLE_API_KEY
});

/**
 * Upload file to Google Drive with fallback to local storage
 * @param {Object} file - Multer file object
 * @param {String} candidateId - Candidate ID for organization
 * @returns {Promise<Object>} - { fileId, driveLink, filePath, storageType }
 */
async function uploadFileToGoogle(file, candidateId) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      console.log('[DRIVE] No Google API key, using local storage');
      return {
        fileId: null,
        driveLink: null,
        filePath: file.path,
        storageType: 'local'
      };
    }

    console.log(`[DRIVE] Uploading ${file.originalname} to Google Drive`);

    // Check if file exists locally
    if (!fs.existsSync(file.path)) {
      throw new Error(`File not found: ${file.path}`);
    }

    // Create metadata with candidate ID in description
    const fileMetadata = {
      name: `${candidateId}_${file.originalname}`,
      description: `Candidate ID: ${candidateId}, Original upload: ${new Date().toISOString()}`
    };

    // Create media object from file
    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path)
    };

    // Upload to Drive
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink'
    });

    const fileId = response.data.id;
    const driveLink = response.data.webViewLink;

    console.log(`[DRIVE] ✅ Uploaded successfully. File ID: ${fileId}`);

    // Make file publicly accessible (optional - for shared access)
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
      console.log(`[DRIVE] File made publicly accessible`);
    } catch (permErr) {
      console.log(`[DRIVE] Could not set public permissions:`, permErr.message);
      // Continue anyway, file is still accessible
    }

    return {
      fileId: fileId,
      driveLink: driveLink,
      filePath: file.path, // Keep local copy for immediate processing
      storageType: 'google-drive'
    };
  } catch (error) {
    console.error(`[DRIVE] Upload failed, falling back to local storage:`, error.message);
    
    // Fallback to local storage
    return {
      fileId: null,
      driveLink: null,
      filePath: file.path,
      storageType: 'local',
      error: error.message
    };
  }
}

/**
 * Download file from Google Drive for processing
 * @param {String} fileId - Google Drive file ID
 * @param {String} outputPath - Where to save the file
 * @returns {Promise<String>} - Path to downloaded file
 */
async function downloadFileFromGoogle(fileId, outputPath) {
  try {
    if (!fileId) {
      throw new Error('No file ID provided');
    }

    console.log(`[DRIVE] Downloading file ${fileId}`);

    const dest = fs.createWriteStream(outputPath);
    
    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: 'media'
      },
      { responseType: 'stream' }
    );

    return new Promise((resolve, reject) => {
      response.data.on('error', (err) => {
        console.error(`[DRIVE] Download error:`, err.message);
        reject(err);
      });

      dest.on('error', (err) => {
        console.error(`[DRIVE] File write error:`, err.message);
        reject(err);
      });

      response.data.pipe(dest);
      
      dest.on('finish', () => {
        console.log(`[DRIVE] Downloaded to ${outputPath}`);
        resolve(outputPath);
      });
    });
  } catch (error) {
    console.error(`[DRIVE] Download failed:`, error.message);
    throw error;
  }
}

/**
 * Delete file from Google Drive
 * @param {String} fileId - Google Drive file ID
 */
async function deleteFileFromGoogle(fileId) {
  try {
    if (!fileId) return;

    console.log(`[DRIVE] Deleting file ${fileId}`);
    await drive.files.delete({ fileId: fileId });
    console.log(`[DRIVE] ✅ File deleted`);
  } catch (error) {
    console.error(`[DRIVE] Delete failed:`, error.message);
    // Don't throw, just log
  }
}

/**
 * Clean up local file after successful Drive upload (optional)
 * @param {String} filePath - Local file path
 */
function cleanupLocalFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[DRIVE] Local file cleaned up: ${filePath}`);
    }
  } catch (error) {
    console.log(`[DRIVE] Could not clean up local file:`, error.message);
  }
}

module.exports = {
  uploadFileToGoogle,
  downloadFileFromGoogle,
  deleteFileFromGoogle,
  cleanupLocalFile
};
