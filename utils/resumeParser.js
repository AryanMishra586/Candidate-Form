const fs = require('fs');
const pdfParse = require('pdf-parse');
const path = require('path');

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
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

/**
 * Parse resume and extract key information
 */
async function parseResume(filePath) {
  try {
    const text = await extractTextFromPDF(filePath);
    
    // Extract key sections and information
    const parsed = {
      rawText: text,
      contact: extractContact(text),
      skills: extractSkills(text),
      experience: extractExperience(text),
      education: extractEducation(text),
      summary: extractSummary(text)
    };

    return parsed;
  } catch (error) {
    console.error('Error in parseResume:', error.message);
    throw error;
  }
}

/**
 * Extract contact information (email, phone, linkedin)
 */
function extractContact(text) {
  const contact = {};

  // Email extraction
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const emails = text.match(emailRegex);
  if (emails) {
    contact.email = emails[0];
  }

  // Phone number extraction (various formats)
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phones = text.match(phoneRegex);
  if (phones) {
    contact.phone = phones[0];
  }

  // LinkedIn extraction
  const linkedinRegex = /linkedin\.com\/in\/([a-zA-Z0-9-]+)/i;
  const linkedinMatch = text.match(linkedinRegex);
  if (linkedinMatch) {
    contact.linkedin = linkedinMatch[0];
  }

  return contact;
}

/**
 * Extract skills section
 */
function extractSkills(text) {
  const skills = [];
  const skillsKeywords = ['Skills', 'Technical Skills', 'Competencies'];
  
  for (const keyword of skillsKeywords) {
    const regex = new RegExp(`${keyword}[:\\s]*([^\\n]*(?:\\n(?!\\w+[:\\s])[^\\n]*)*)`);
    const match = text.match(regex);
    
    if (match) {
      const skillsText = match[1];
      // Split by common delimiters and clean up
      const extractedSkills = skillsText
        .split(/[,•\n]/g)
        .map(s => s.trim())
        .filter(s => s.length > 0 && s.length < 50);
      
      skills.push(...extractedSkills);
      break;
    }
  }

  return [...new Set(skills)]; // Remove duplicates
}

/**
 * Extract experience/work history
 */
function extractExperience(text) {
  const experience = [];
  
  // Look for job titles and companies (heuristic approach)
  const lines = text.split('\n');
  let currentJob = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for common job title patterns
    if (line.match(/^(.*?)(Developer|Engineer|Manager|Designer|Analyst|Specialist|Consultant|Lead|Senior|Junior).*/i)) {
      if (currentJob) {
        experience.push(currentJob);
      }
      
      currentJob = {
        title: line.substring(0, 100),
        description: []
      };
    } else if (currentJob && line.length > 0 && !line.match(/^\d{4}/)) {
      currentJob.description.push(line);
    } else if (line.match(/^\d{4}/)) {
      // Likely a date, mark as new entry
      if (currentJob) {
        currentJob.period = line;
      }
    }
  }

  if (currentJob) {
    experience.push(currentJob);
  }

  return experience.slice(0, 10); // Return last 10 jobs
}

/**
 * Extract education information
 */
function extractEducation(text) {
  const education = [];
  const educationKeywords = ['Education', 'Academic', 'Degree'];
  
  const degrees = ['B.E', 'B.Tech', 'B.S', 'B.A', 'M.Tech', 'M.S', 'MBA', 'M.A', 'Ph.D', 'Bachelor', 'Master', 'Diploma'];
  
  for (const degree of degrees) {
    const regex = new RegExp(`(${degree}[^\\n]{0,100})`, 'gi');
    const matches = text.match(regex);
    
    if (matches) {
      education.push(...matches.map(m => m.trim()));
    }
  }

  return [...new Set(education)].slice(0, 5); // Remove duplicates, return top 5
}

/**
 * Extract professional summary
 */
function extractSummary(text) {
  const summaryKeywords = ['Summary', 'Professional Summary', 'Objective', 'About'];
  
  for (const keyword of summaryKeywords) {
    const regex = new RegExp(`${keyword}[:\\s]*([^\\n]{0,300})`);
    const match = text.match(regex);
    
    if (match) {
      return match[1].trim();
    }
  }

  // If no summary found, return first 300 characters
  return text.substring(0, 300).trim();
}

module.exports = {
  parseResume,
  extractTextFromPDF
};
