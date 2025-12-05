const axios = require('axios');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(fileBuffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error.message);
    return null;
  }
}

/**
 * Call Gemini API to extract and verify data
 */
async function callGeminiAPI(text, docType) {
  try {
    if (!GEMINI_API_KEY) {
      console.warn('⚠️ GOOGLE_API_KEY not set - skipping Gemini verification');
      return null;
    }

    let prompt = '';
    if (docType === 'aadhar') {
      prompt = `Extract information from this Aadhar document text. Return a JSON object with:
{
  "aadharNumber": "12-digit number or null",
  "name": "extracted name or null",
  "dob": "date of birth or null",
  "address": "extracted address or null",
  "isValid": true/false
}
Only return valid JSON, no other text.
Document text: ${text}`;
    } else if (docType === 'marksheet10' || docType === 'marksheet12') {
      prompt = `Extract information from this ${docType === 'marksheet10' ? '10th' : '12th'} standard marksheet text. Return a JSON object with:
{
  "rollNumber": "roll number or null",
  "name": "student name or null",
  "percentage": percentage number or null,
  "board": "board name or null",
  "totalMarks": number or null,
  "obtainedMarks": number or null,
  "subjects": ["array of subjects or empty"]
}
Only return valid JSON, no other text.
Document text: ${text}`;
    }

    const response = await axios.post(
      `${API_BASE_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    const responseText = response.data.candidates[0].content.parts[0].text;
    console.log(`[GEMINI] Response for ${docType}:`, responseText);
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error(`[GEMINI] API call failed for ${docType}:`, error.message);
    return null;
  }
}

/**
 * Verify Aadhar document
 */
async function verifyAadhar(filePath) {
  try {
    console.log(`[VERIFY] Extracting Aadhar data from: ${filePath}`);
    
    const text = await extractTextFromPDF(filePath);
    if (!text) {
      return {
        error: 'Could not extract text from PDF',
        extractedInfo: {}
      };
    }

    const extractedData = await callGeminiAPI(text, 'aadhar');
    
    if (extractedData) {
      console.log(`[VERIFY] Aadhar extraction successful:`, extractedData);
      return {
        extractedInfo: extractedData,
        aiVerification: {
          isVerified: extractedData.isValid !== false,
          status: 'Verified via AI'
        }
      };
    } else {
      return {
        extractedInfo: {
          aadharNumber: null,
          name: null,
          dob: null
        },
        aiVerification: {
          isVerified: false,
          status: 'Extraction failed'
        }
      };
    }
  } catch (error) {
    console.error('Error in verifyAadhar:', error.message);
    return {
      error: error.message,
      extractedInfo: {}
    };
  }
}

/**
 * Verify marksheet document
 */
async function verifyMarksheet(filePath, marksheetType) {
  try {
    console.log(`[VERIFY] Extracting ${marksheetType} data from: ${filePath}`);
    
    const text = await extractTextFromPDF(filePath);
    if (!text) {
      return {
        error: 'Could not extract text from PDF',
        type: marksheetType,
        extractedInfo: {}
      };
    }

    const extractedData = await callGeminiAPI(text, marksheetType);
    
    if (extractedData) {
      console.log(`[VERIFY] ${marksheetType} extraction successful:`, extractedData);
      return {
        type: marksheetType,
        extractedInfo: extractedData,
        aiVerification: {
          isVerified: true,
          status: 'Verified via AI'
        }
      };
    } else {
      return {
        type: marksheetType,
        extractedInfo: {
          rollNumber: null,
          name: null,
          percentage: null,
          board: null
        },
        aiVerification: {
          isVerified: false,
          status: 'Extraction failed'
        }
      };
    }
  } catch (error) {
    console.error('Error in verifyMarksheet:', error.message);
    return {
      type: marksheetType,
      error: error.message,
      extractedInfo: {}
    };
  }
}

module.exports = {
  verifyAadhar,
  verifyMarksheet
};
