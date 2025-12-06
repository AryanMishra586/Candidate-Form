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

  // Find section start
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();
    if (sectionNames.some(name => line.includes(name.toLowerCase()))) {
      sectionStart = i + 1;
      break;
    }
  }

  if (sectionStart === -1) return null;

  // Find section end (next major section header)
  const sectionHeaders = ['experience', 'education', 'skills', 'projects', 'achievements', 'certifications', 'languages', 'summary', 'objective', 'contact', 'references'];
  for (let i = sectionStart; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();
    if (sectionHeaders.some(header => line.includes(header) && line.length < 50)) {
      sectionEnd = i;
      break;
    }
  }

  return lines.slice(sectionStart, sectionEnd).join('\n').trim();
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
    const experienceSection = extractSection(text, ['experience', 'work experience', 'employment', 'professional experience']);
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
  let currentJob = null;
  let jobBuffer = []; // Buffer to group related lines

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line contains date pattern (marks end of job entry header)
    const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}\s*-\s*\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}\s*-\s*\d{1,2}\s*(months?|years?))/i);
    
    // Check if line contains job title keywords
    const hasJobKeyword = line.match(/(developer|engineer|manager|designer|analyst|specialist|consultant|lead|architect|senior|junior|associate|director|coordinator|officer|supervisor|admin|support|executive|president|founder|intern|trainee|lead|head|chief)/i);
    
    // Check if line is likely a company name (title case, no job keywords, reasonable length)
    const isLikelyCompany = !hasJobKeyword && line.match(/^[A-Z][A-Za-z0-9\s&,\.\-()]+$/) && line.length < 80 && line.length > 2;

    if (dateMatch) {
      // This line has a date - likely the period line
      if (jobBuffer.length > 0) {
        // Process accumulated job lines
        currentJob = parseJobLines(jobBuffer);
        currentJob.period = line;
        if (currentJob.title) {
          experience.push(currentJob);
        }
        jobBuffer = [];
        currentJob = null;
      }
    } else if (hasJobKeyword || isLikelyCompany) {
      // This could be a job title or company name
      jobBuffer.push(line);
    } else if (jobBuffer.length > 0 && line.length > 10) {
      // Description line after job/company
      if (currentJob) {
        currentJob.description.push(line);
      } else {
        // Save accumulated job info first
        currentJob = parseJobLines(jobBuffer);
        currentJob.description.push(line);
        jobBuffer = [];
      }
    } else if (jobBuffer.length > 0) {
      // Short line, add to buffer (might be part of title/company)
      jobBuffer.push(line);
    }
  }

  // Process any remaining job
  if (jobBuffer.length > 0) {
    currentJob = parseJobLines(jobBuffer);
    if (currentJob && currentJob.title) {
      experience.push(currentJob);
    }
  }

  return experience.slice(0, 10);
}

/**
 * Helper: Parse accumulated job lines into title/company/location
 */
function parseJobLines(lines) {
  const job = {
    title: '',
    company: '',
    location: '',
    description: [],
    period: ''
  };

  if (lines.length === 0) return job;

  // Heuristic: lines with job keywords are titles, others are companies/locations
  const titleLines = [];
  const companyLines = [];

  for (const line of lines) {
    const hasJobKeyword = line.match(/(developer|engineer|manager|designer|analyst|specialist|consultant|lead|architect|senior|junior|associate|director|coordinator|officer|supervisor|admin|support|executive|president|founder|intern|trainee|lead|head|chief)/i);
    
    if (hasJobKeyword) {
      titleLines.push(line);
    } else {
      companyLines.push(line);
    }
  }

  // Assign parsed values
  job.title = titleLines.join(' ').substring(0, 100) || lines[0].substring(0, 100);
  
  if (companyLines.length > 0) {
    job.company = companyLines[0];
    if (companyLines.length > 1) {
      job.location = companyLines[1];
    }
  } else if (titleLines.length > 1) {
    // If we have multiple title lines, last might be company
    job.company = lines[lines.length - 1];
  }

  return job;
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
