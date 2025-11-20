const Candidate = require("../models/Candidate");
const Document = require("../models/Document");

// exports.handleFormSubmission = async (req, res) => {
//   try {
//     console.log("Incoming form submission:", req.body);

//     const { name, email, phone, files } = req.body;

//     // 1. Create candidate
//     const candidate = await Candidate.create({ name, email, phone });

//     // 2. Create documents for each uploaded file
//     const docTypes = Object.keys(files);

//     for (let type of docTypes) {
//       await Document.create({
//         candidateId: candidate._id,
//         type: type,
//         fileUrl: files[type],
//         fileId: extractFileId(files[type]), // we will add this helper
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Form data saved successfully",
//       candidateId: candidate._id,
//     });

//   } catch (err) {
//     console.error("Form submission error:", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };



const { downloadFile } = require("../utils/googleDrive");

exports.handleFormSubmission = async (req, res) => {
  try {
    const { name, email, phone, files } = req.body;

    // Test one file (Aadhaar)
    const fileId = extractFileId(files.aadhaar);

    const fileBuffer = await downloadFile(fileId);

    console.log("Downloaded file size:", fileBuffer?.length);

    res.json({
      success: true,
      message: "Form received",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};


// Extract Google Drive ID from a link
function extractFileId(url) {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}