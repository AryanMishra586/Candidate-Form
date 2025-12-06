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

  console.log(`\n[EXTRACT_SECTION] Looking for: ${sectionNames.join(', ')}`);
  console.log(`[EXTRACT_SECTION] Total lines: ${lines.length}`);

  // Find section start (case-insensitive, handle uppercase/lowercase)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineLower = line.toLowerCase();
    
    // Log ALL lines that contain keywords for debugging
    if (lineLower.includes('experience') || lineLower.includes('education') || lineLower.includes('skill')) {
      console.log(`  [LINE ${i}] "${line}"`);
      
      // Show which keywords this line matches
      for (const name of sectionNames) {
        if (lineLower.includes(name.toLowerCase())) {
          console.log(`    ✓ MATCHES: "${name}"`);
        }
      }
    }
    
    if (sectionNames.some(name => lineLower.includes(name.toLowerCase()))) {
      console.log(`[✓ SECTION FOUND] at line ${i}: "${line}"`);
      sectionStart = i + 1;
      break;
    }
  }

  if (sectionStart === -1) {
    console.log(`[✗ SECTION NOT FOUND] None of these keywords found in any line: ${sectionNames.join(', ')}`);
    
    // Show ALL lines containing the first character of each keyword to help debug
    console.log(`\n[DEBUG] All lines in document:`);
    lines.slice(0, 50).forEach((line, i) => {
      if (line.trim().length > 0) {
        console.log(`  Line ${i}: "${line.trim()}"`);
      }
    });
    
    return null;
  }

  // Find section end (next major section header - uppercase or title case)
  const sectionHeaders = ['experience', 'education', 'skills', 'projects', 'achievements', 'certifications', 'languages', 'summary', 'objective', 'contact', 'references'];
  for (let i = sectionStart; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineLower = line.toLowerCase();
    
    // Skip empty lines
    if (line.length === 0) continue;
    
    // TRUE SECTION HEADER pattern:
    // 1. Line is SHORT (< 60 chars) - headers are brief
    // 2. Line starts with a section keyword (at position 0 after lowercase)
    // 3. Keyword takes up >= 70% of line (nearly entire line is the header)
    // 4. No typical content patterns (dates, bullets, job descriptions)
    // 5. Likely ALL CAPS or Title Case (not mixed case like normal sentences)
    
    const isShort = line.length < 60;
    
    // Check if line STARTS with any section keyword
    const headerMatch = sectionHeaders.find(h => lineLower.startsWith(h));
    
    if (headerMatch && isShort) {
      const keywordLength = headerMatch.length;
      const keywordPercentage = (keywordLength / line.length) * 100;
      
      // Content patterns that indicate this is NOT a header
      const hasContentPattern = /\d{1,2}\/\d{4}|[A-Za-z]+\s*\d{4}|•|\-\s|@|gmail|email|\d{4}\s*-\s*\d{4}|remote|location|at\s|in\s/i.test(line);
      
      // Check if line is mostly header (keyword is dominant)
      const isMostlyHeader = keywordPercentage >= 70;
      
      // Additional check: after keyword, only punctuation or short words like "and", "or", etc.
      const afterKeyword = line.substring(headerMatch.length).trim().toLowerCase();
      const afterKeywordOk = afterKeyword.length === 0 || /^[\(\)&and\/or,]*$|^\d+$/.test(afterKeyword);
      
      if (isMostlyHeader && !hasContentPattern && afterKeywordOk) {
        sectionEnd = i;
        console.log(`[SECTION END] Found next section at line ${i}: "${line}" (keyword: "${headerMatch}", ${keywordPercentage.toFixed(0)}% of line)`);
        break;
      }
    }
  }

  const result = lines.slice(sectionStart, sectionEnd).join('\n').trim();
  console.log(`[SECTION EXTRACTED] Lines ${sectionStart}-${sectionEnd}, Length: ${result.length}`);
  console.log(`[SECTION CONTENT PREVIEW] ${result.substring(0, 200)}...`);
  return result;
}

/**
 * Parse resume using section-based approach
 */
async function parseResume(filePath) {
  try {
    console.log(`\n========== RESUME PARSING STARTED ==========`);
    console.log(`File: ${filePath}`);
    
    const text = await extractTextFromPDF(filePath);
    console.log(`\n[EXTRACT] Raw text length: ${text.length} characters`);
    
    // Show first part of extracted text
    console.log(`\n[EXTRACTED TEXT - FIRST 3000 CHARS]:\n`);
    console.log(text.substring(0, 3000));
    console.log(`\n[END PREVIEW]\n`);
    
    // Extract key sections first
    const contactSection = extractSection(text, ['contact', 'personal']);
    const summarySection = extractSection(text, ['summary', 'objective', 'professional summary']);
    const skillsSection = extractSection(text, ['skills', 'technical skills', 'competencies']);
    const experienceSection = extractSection(text, ['experience', 'work experience', 'employment', 'professional experience', 'professional work', 'career history', 'professional history', 'work history']);
    const educationSection = extractSection(text, ['education', 'academic', 'qualifications']);
    const projectsSection = extractSection(text, ['projects', 'portfolio']);
    const achievementsSection = extractSection(text, ['achievements', 'awards', 'certifications']);
    
    // Log diagnostic info about experience section
    if (!experienceSection) {
      console.log(`\n[DIAGNOSTIC] Experience section NOT found!`);
      console.log(`\n[CHECKING] Looking for date patterns in text...`);
      const datePattern = /([A-Za-z]+-[A-Za-z]+,?\s*\d{4}|\d{1,2}\/\d{4}\s*-\s*\d{1,2}\/\d{4}|\d{4}\s*-\s*\d{4})/g;
      const dateMatches = text.match(datePattern);
      if (dateMatches) {
        console.log(`[DATES FOUND] ${dateMatches.length} date patterns found in resume:`);
        dateMatches.slice(0, 5).forEach(d => console.log(`  - "${d}"`));
      } else {
        console.log(`[NO DATES] No date patterns found in resume at all!`);
      }
    }

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

    console.log(`\n========== RESUME PARSING COMPLETED ==========`);
    console.log(`✓ Skills: ${parsed.skills.length}`);
    console.log(`✓ Experiences: ${parsed.experience.length}`);
    console.log(`✓ Education: ${parsed.education.length}`);
    console.log(`✓ Projects: ${parsed.projects.length}\n`);
    
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
 * Handles resume formats like:
 * Company Name
 * Job Title   Date Range   Location
 * • Bullet description
 * • Bullet description
 */
function extractExperienceFromSection(section) {
  if (!section) return [];
  
  const experience = [];
  const lines = section.split('\n');
  
  console.log(`[EXPERIENCE_PARSE] Processing ${lines.length} lines`);
  
  // Date pattern: January-February, 2025 OR 01/2023-12/2023 OR 2023-2024 OR Feb 2025 – May 2025
  const datePattern = /([A-Za-z]+\s*\d{4}\s*[–\-]\s*[A-Za-z]+\s*\d{4}|[A-Za-z]+-[A-Za-z]+,?\s*\d{4}|\d{1,2}\/\d{4}\s*-\s*\d{1,2}\/\d{4}|\d{4}\s*-\s*\d{4}|Present|Current)/i;
  
  let i = 0;
  let lastJobLineIndex = -1; // Track the line where we found a date
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Skip completely empty lines
    if (line.length === 0) {
      i++;
      continue;
    }
    
    console.log(`[LINE ${i}] "${line}"`);
    
    const hasDate = line.match(datePattern);
    const isNumbered = line.match(/^(\d+)\./);
    const isBullet = line.startsWith('•') || line.startsWith('-');
    
    // CRITICAL: A NEW JOB ENTRY can ONLY start if:
    // 1. Line has a date OR is numbered (like "1. Job Title")
    // 2. NOT a bullet point
    if ((hasDate || isNumbered) && !isBullet) {
      console.log(`[JOB FOUND] Line ${i} has date/number`);
      lastJobLineIndex = i;
      
      // Look back to see if previous line is company name
      let companyName = '';
      if (i > 0) {
        const prevLine = lines[i - 1].trim();
        // Previous line is company if it doesn't have a date and isn't a bullet
        if (prevLine.length > 0 && !prevLine.match(datePattern) && !prevLine.startsWith('•') && !prevLine.startsWith('-')) {
          companyName = prevLine;
          console.log(`[COMPANY] Line ${i-1}: "${companyName}"`);
        }
      }
      
      // Parse this job line
      let jobTitle = line;
      let period = '';
      
      // Extract date from line
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        period = dateMatch[0];
        jobTitle = line.replace(dateMatch[0], '').trim();
        console.log(`[PERIOD] "${period}"`);
      }
      
      // Remove numbering if present
      if (isNumbered) {
        jobTitle = jobTitle.replace(/^(\d+)\./, '').trim();
      }
      
      const entry = {
        title: jobTitle.substring(0, 150),
        company: companyName.substring(0, 100),
        period: period,
        description: []
      };
      
      console.log(`[ENTRY] Company: "${entry.company}" | Title: "${entry.title}" | Period: "${entry.period}"`);
      
      // Collect all lines until we hit ANOTHER line with a date
      i++;
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        
        // If empty, skip but continue looking
        if (nextLine.length === 0) {
          i++;
          continue;
        }
        
        // STOP if this line has a date (next job starts)
        if (nextLine.match(datePattern)) {
          console.log(`[STOP] Next job found at line ${i}: "${nextLine}"`);
          break;
        }
        
        // STOP if section header
        if (nextLine.match(/^(Experience|Education|Skills|Projects|Achievements|Awards)/i) && nextLine.length < 50) {
          console.log(`[STOP] Section header at line ${i}: "${nextLine}"`);
          break;
        }
        
        // Add to description: bullets, non-bullets, everything except dates
        if (nextLine.length > 0) {
          const cleanLine = nextLine.replace(/^[•\-]\s*/, '').trim();
          if (cleanLine.length > 0 && cleanLine.length < 500) {
            entry.description.push(cleanLine);
            console.log(`[DESC] Added: "${cleanLine.substring(0, 60)}..."`);
          }
        }
        
        i++;
      }
      
      experience.push(entry);
      continue;
    }
    
    i++;
  }
  
  console.log(`[EXPERIENCE_EXTRACTION] Total: ${experience.length}`);
  return experience.slice(0, 15);
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
  let i = 0;
  
  // Date pattern for education (graduation years)
  const datePattern = /(\d{4}\s*[-–]\s*\d{4}|[A-Za-z]+\s*\d{4}|graduation\s+\d{4})/i;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    i++;

    if (trimmed.length === 0 || trimmed.length > 200) continue;

    // Check if line has a date (degree graduation date)
    const hasDate = datePattern.test(trimmed);
    
    // Check if line contains a degree pattern
    let hasDegree = false;
    for (const pattern of degreePatterns) {
      if (trimmed.match(new RegExp(pattern, 'i'))) {
        hasDegree = true;
        break;
      }
    }
    
    // Check if line looks like an institution
    const looksLikeInstitution = /university|college|institute|school|academy/i.test(trimmed);
    
    // EDUCATION ENTRY is identified by: institution name OR degree OR (institution + date line)
    // We want to capture: Institution name (previous line) + Degree line OR Degree line with dates
    
    if (hasDate || hasDegree || looksLikeInstitution) {
      let entry = '';
      
      // If this line has institution name, look ahead for degree/dates
      if (looksLikeInstitution) {
        entry = trimmed; // Start with institution
        
        // Look ahead for degree and dates
        if (i < lines.length) {
          const nextLine = lines[i].trim();
          
          // Check if next line has degree or dates
          let nextHasDegree = false;
          for (const pattern of degreePatterns) {
            if (nextLine.match(new RegExp(pattern, 'i'))) {
              nextHasDegree = true;
              break;
            }
          }
          
          const nextHasDate = datePattern.test(nextLine);
          
          // Combine institution with degree/dates
          if (nextHasDegree || nextHasDate) {
            entry = `${trimmed}, ${nextLine}`;
            i++;
          }
        }
      } else if (hasDegree || hasDate) {
        // This line has degree or dates
        entry = trimmed;
        
        // Look back to see if previous line was institution
        if (i > 1) {
          const prevLine = lines[i - 2].trim();
          if (/university|college|institute|school|academy/i.test(prevLine)) {
            // Prepend institution name
            entry = `${prevLine}, ${trimmed}`;
          }
        }
      }
      
      if (entry && entry.length > 5) {
        education.push(entry);
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
