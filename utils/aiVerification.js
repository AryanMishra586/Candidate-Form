const Tesseract = require('tesseract.js');
const { OpenAI } = require('openai');
const fs = require('fs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Extract text from image using OCR (Tesseract)
 */
async function extractTextFromImage(imagePath) {
  try {
    const result = await Tesseract.recognize(imagePath, 'eng');
    return result.data.text;
  } catch (error) {
    console.error('OCR Error:', error.message);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
}

/**
 * Verify Aadhar document using OCR and AI
 */
async function verifyAadhar(filePath) {
  try {
    const ocrText = await extractTextFromImage(filePath);
    
    // Extract key Aadhar information using regex and AI
    const aadharData = {
      rawOCR: ocrText,
      extractedInfo: {}
    };

    // Extract Aadhar number (12 digit pattern)
    const aadharMatch = ocrText.match(/\b[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\b/);
    if (aadharMatch) {
      aadharData.extractedInfo.aadharNumber = aadharMatch[0].replace(/\s/g, '');
    }

    // Extract name (usually in capitals)
    const nameMatch = ocrText.match(/Name\s*[:]*\s*([A-Z][A-Za-z\s]+)/i);
    if (nameMatch) {
      aadharData.extractedInfo.name = nameMatch[1].trim();
    }

    // Extract DOB
    const dobMatch = ocrText.match(/DOB\s*[:]*\s*(\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})/i);
    if (dobMatch) {
      aadharData.extractedInfo.dob = dobMatch[1];
    }

    // Use AI to verify and extract additional details
    aadharData.aiVerification = await verifyWithAI('aadhar', ocrText);

    return aadharData;
  } catch (error) {
    console.error('Error in verifyAadhar:', error.message);
    throw error;
  }
}

/**
 * Verify marksheet document using OCR and AI
 */
async function verifyMarksheet(filePath, marksheetType) {
  // marksheetType: 'marksheet10' or 'marksheet12'
  try {
    const ocrText = await extractTextFromImage(filePath);
    
    const marksheetData = {
      type: marksheetType,
      rawOCR: ocrText,
      extractedInfo: {}
    };

    // Extract common marksheet information
    const rollMatch = ocrText.match(/Roll\s*(?:No|Number|Number)\s*[:]*\s*([A-Za-z0-9]+)/i);
    if (rollMatch) {
      marksheetData.extractedInfo.rollNumber = rollMatch[1].trim();
    }

    const nameMatch = ocrText.match(/Name\s*[:]*\s*([A-Z][A-Za-z\s]+)/i);
    if (nameMatch) {
      marksheetData.extractedInfo.name = nameMatch[1].trim();
    }

    // Extract percentage/grade
    const percentMatch = ocrText.match(/(?:Total|Percentage|Grade|%)\s*[:]*\s*(\d+(?:\.\d{2})?)\s*%?/i);
    if (percentMatch) {
      marksheetData.extractedInfo.percentage = parseFloat(percentMatch[1]);
    }

    // Extract board/school
    const boardMatch = ocrText.match(/(?:Board|School|Board of Education)\s*[:]*\s*([^\n]+)/i);
    if (boardMatch) {
      marksheetData.extractedInfo.board = boardMatch[1].trim();
    }

    // Use AI for detailed verification
    marksheetData.aiVerification = await verifyWithAI(marksheetType, ocrText);

    return marksheetData;
  } catch (error) {
    console.error('Error in verifyMarksheet:', error.message);
    throw error;
  }
}

/**
 * Use OpenAI to verify and extract data
 */
async function verifyWithAI(docType, ocrText) {
  try {
    let prompt = '';

    if (docType === 'aadhar') {
      prompt = `You are an expert at reading and verifying Aadhar documents. 
      
Analyze the following OCR text from an Aadhar card and extract/verify:
1. Aadhar number (12 digits)
2. Name
3. Date of Birth
4. Gender
5. Address
6. Any issues or suspicious elements

OCR Text:
${ocrText}

Respond in JSON format with keys: aadharNumber, name, dob, gender, address, isLegitimate (true/false), issues (array of strings)`;
    } else if (docType === 'marksheet10' || docType === 'marksheet12') {
      const standard = docType === 'marksheet10' ? '10th' : '12th';
      prompt = `You are an expert at reading ${standard} standard marksheets.

Analyze the following OCR text from a ${standard} marksheet and extract:
1. Student Name
2. Roll Number
3. Total Percentage/Marks
4. Board/School Name
5. Year of Examination
6. Subject-wise marks (if available)

OCR Text:
${ocrText}

Respond in JSON format with keys: name, rollNumber, percentage, board, year, subjects (object with subject names as keys and marks as values)`;
    }

    const message = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    // Parse JSON response
    const responseText = message.choices[0].message.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { rawResponse: responseText };
  } catch (error) {
    console.error('Error in verifyWithAI:', error.message);
    throw new Error(`AI verification failed: ${error.message}`);
  }
}

/**
 * Main function to process all documents for a candidate
 */
async function processAllDocuments(documents) {
  try {
    const results = {};

    for (const doc of documents) {
      if (doc.type === 'aadhar') {
        results.aadhar = await verifyAadhar(doc.filePath);
      } else if (doc.type === 'marksheet10') {
        results.marksheet10 = await verifyMarksheet(doc.filePath, 'marksheet10');
      } else if (doc.type === 'marksheet12') {
        results.marksheet12 = await verifyMarksheet(doc.filePath, 'marksheet12');
      }
    }

    return results;
  } catch (error) {
    console.error('Error in processAllDocuments:', error.message);
    throw error;
  }
}

module.exports = {
  verifyAadhar,
  verifyMarksheet,
  verifyWithAI,
  processAllDocuments,
  extractTextFromImage
};
