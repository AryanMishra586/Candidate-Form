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
    return `[PDF Parsing Failed] File: ${filePath}. Please check file format.`;
  }
}

/**
 * Find and extract a section from text
 * Looks for section headers and extracts content until next section
 */
function extractSection(text, sectionNames) {
  const lines = text.split('\n');
  let sectionStart = -1;
  let sectionEnd = lines.length;

  // Find section start (case-insensitive, handle uppercase/lowercase)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineLower = line.toLowerCase();
    
    // Log section header lines for debugging
    if (lineLower.includes('experience') || lineLower.includes('education') || lineLower.includes('skill')) {
      console.log(`[SECTION DETECTION] Line ${i}: "${line}"`);
    }
    
    if (sectionNames.some(name => lineLower.includes(name.toLowerCase()))) {
      console.log(`[SECTION FOUND] "${sectionNames.join('|')}" at line ${i}: "${line}"`);
      sectionStart = i + 1;
      break;
    }
  }

  if (sectionStart === -1) {
    console.log(`[SECTION NOT FOUND] Looking for: ${sectionNames.join(', ')}`);
    return null;
  }

  // Find section end (next major section header - uppercase or title case)
  const sectionHeaders = ['experience', 'education', 'skills', 'projects', 'achievements', 'certifications', 'languages', 'summary', 'objective', 'contact', 'references'];
  for (let i = sectionStart; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineLower = line.toLowerCase();
    
    // Match both uppercase headers (like "EDUCATION", "PROFESSIONAL EXPERIENCE") and lowercase
    if (sectionHeaders.some(header => {
      return lineLower.includes(header) && (line.length < 50 || line === line.toUpperCase());
    })) {
      sectionEnd = i;
      console.log(`[SECTION END] Found next section at line ${i}: "${line}"`);
      break;
    }
  }

  const result = lines.slice(sectionStart, sectionEnd).join('\n').trim();
  console.log(`[SECTION EXTRACTED] Lines ${sectionStart}-${sectionEnd}, Length: ${result.length}`);
  return result;
}

/**
 * Parse resume using section-based approach
 */
async function parseResume(filePath) {
  try {
    console.log(`Starting resume parsing for: ${filePath}`);
    const text = await extractTextFromPDF(filePath);
    console.log(`Extracted text length: ${text.length}`);
    
    // Extract key sections first
    const contactSection = extractSection(text, ['contact', 'personal']);
    const summarySection = extractSection(text, ['summary', 'objective', 'professional summary']);
    const skillsSection = extractSection(text, ['skills', 'technical skills', 'competencies']);
    const experienceSection = extractSection(text, ['experience', 'work experience', 'employment', 'professional experience', 'professional work']);
    const educationSection = extractSection(text, ['education', 'academic', 'qualifications']);
    const projectsSection = extractSection(text, ['projects', 'portfolio']);
    const achievementsSection = extractSection(text, ['achievements', 'awards', 'certifications']);

    const parsed = {
      rawText: text,
      contact: extractContact(contactSection || text),
      summary: extractSummaryFromSection(summarySection),
      skills: extractSkillsFromSection(skillsSection),
      experience: extractExperienceFromSection(experienceSection),
      education: extractEducationFromSection(educationSection),
      projects: extractProjectsFromSection(projectsSection),
      achievements: extractAchievementsFromSection(achievementsSection)
    };

    console.log(`Resume parsing completed successfully`);
    console.log(`Found: ${parsed.skills.length} skills, ${parsed.experience.length} experiences, ${parsed.education.length} education entries`);
    console.log(`Experience Section Raw:\n${experienceSection ? experienceSection.substring(0, 500) : 'NOT FOUND'}`);
    
    return parsed;
  } catch (error) {
    console.error('Error in parseResume:', error.message);
    return {
      rawText: '',
      contact: {},
      summary: '',
      skills: [],
      experience: [],
      education: [],
      projects: [],
      achievements: [],
      error: error.message
    };
  }
}

/**
 * Extract contact information from section or full text
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
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})|(\+91[-.\s]?[0-9]{10})/g;
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

  // GitHub extraction
  const githubRegex = /github\.com\/([a-zA-Z0-9-]+)/i;
  const githubMatch = text.match(githubRegex);
  if (githubMatch) {
    contact.github = githubMatch[0];
  }

  return contact;
}

/**
 * Extract skills from skills section
 */
function extractSkillsFromSection(section) {
  if (!section) return [];
  
  const skills = [];
  const lines = section.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.length > 100) continue;

    // Split by common delimiters
    const items = trimmed
      .split(/[,•·\-\|]/g)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 50 && !s.match(/^\d+\./));

    skills.push(...items);
  }

  // Remove duplicates and sort by frequency
  const uniqueSkills = [...new Set(skills)];
  return uniqueSkills.slice(0, 30); // Top 30 skills
}

/**
 * Extract experience from experience section
 */
function extractExperienceFromSection(section) {
  if (!section) return [];
  
  const experience = [];
  const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentEntry = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line starts with a number (1.Banter, 2.StudyNotion format)
    const numberedMatch = line.match(/^(\d+)\.(.*)/);
    
    if (numberedMatch) {
      // Save previous entry if exists
      if (currentEntry && currentEntry.title) {
        experience.push(currentEntry);
      }

      // Extract the rest of the line after the number
      let restOfLine = numberedMatch[2].trim();
      
      // Try to find date at the end of the line (usually far right with spaces)
      const dateAtEndMatch = restOfLine.match(/^(.+?)\s{2,}([A-Za-z]+-[A-Za-z]+,\s*\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}\s*-\s*\d{4})$/);
      
      let titleAndCompany = restOfLine;
      let period = '';
      
      if (dateAtEndMatch) {
        titleAndCompany = dateAtEndMatch[1].trim();
        period = dateAtEndMatch[2].trim();
      } else {
        // Try to find date at the end even without multiple spaces
        const dateAtEndMatch2 = restOfLine.match(/^(.+?)\s+([A-Za-z]+-[A-Za-z]+,\s*\d{4})$/);
        if (dateAtEndMatch2) {
          titleAndCompany = dateAtEndMatch2[1].trim();
          period = dateAtEndMatch2[2].trim();
        }
      }

      // Split title and company/links (usually separated by space or pipes)
      // Format: "Banter GITHUB | LIVE SITE" or "Banter"
      const parts = titleAndCompany.split(/\s+GITHUB|\s+LIVE SITE|[|]/);
      const title = parts[0].trim();

      currentEntry = {
        title: title.substring(0, 100),
        company: '',
        location: '',
        period: period,
        description: []
      };
    } else if (currentEntry && line.startsWith('•')) {
      // Bullet point - add as description
      const bulletText = line.replace(/^•\s*/, '').trim();
      if (bulletText.length > 0) {
        currentEntry.description.push(bulletText);
      }
    } else if (currentEntry && line.length > 0 && !line.startsWith('•')) {
      // Any other non-empty line that's not a bullet - might be description
      if (currentEntry.description.length > 0 || line.length > 20) {
        currentEntry.description.push(line);
      }
    }
  }

  // Don't forget the last entry
  if (currentEntry && currentEntry.title) {
    experience.push(currentEntry);
  }

  return experience.slice(0, 10);
}

/**
 * Extract education from education section
 */
function extractEducationFromSection(section) {
  if (!section) return [];
  
  const education = [];
  const degreePatterns = [
    'bachelor|b\\.e|b\\.tech|b\\.s|b\\.a|b\\.com',
    'master|m\\.tech|m\\.s|m\\.a|mba',
    'ph\\.d|phd',
    'diploma',
    'associate',
    'certificate'
  ];

  const lines = section.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.length > 150) continue;

    // Check if line contains a degree pattern
    for (const pattern of degreePatterns) {
      if (trimmed.match(new RegExp(pattern, 'i'))) {
        education.push(trimmed);
        break;
      }
    }
  }

  return [...new Set(education)].slice(0, 5);
}

/**
 * Extract projects from projects section
 */
function extractProjectsFromSection(section) {
  if (!section) return [];
  
  const projects = [];
  const lines = section.split('\n');
  let currentProject = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    // Project titles are usually short, non-indented lines
    if (!trimmed.match(/^\s/) && trimmed.length < 80 && trimmed.length > 5) {
      if (currentProject) {
        projects.push(currentProject);
      }
      currentProject = {
        title: trimmed,
        description: []
      };
    } else if (currentProject && trimmed.length > 10) {
      currentProject.description.push(trimmed);
    }
  }

  if (currentProject && currentProject.title) {
    projects.push(currentProject);
  }

  return projects.slice(0, 5);
}

/**
 * Extract achievements/certifications
 */
function extractAchievementsFromSection(section) {
  if (!section) return [];
  
  const achievements = [];
  const lines = section.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 10 && trimmed.length < 150) {
      achievements.push(trimmed);
    }
  }

  return achievements.slice(0, 10);
}

/**
 * Extract summary from summary section
 */
function extractSummaryFromSection(section) {
  if (!section) return '';
  
  const lines = section.split('\n');
  const summaryLines = lines
    .map(l => l.trim())
    .filter(l => l.length > 0 && l.length < 200)
    .slice(0, 3);

  return summaryLines.join(' ').substring(0, 500);
}

module.exports = {
  parseResume,
  extractTextFromPDF
};
