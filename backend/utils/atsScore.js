/**
 * HYBRID ATS SCORE CALCULATION
 * 
 * Scoring Breakdown:
 * - Skills Match (40%): Number of unique skills
 * - Experience Score (30%): Years of experience + role level
 * - Education Score (20%): Education level
 * - Keyword Bonus (10%): Additional quality keywords
 */

// Common keywords that boost ATS score
const KEYWORD_WEIGHTS = {
  // Programming Languages
  'java': 5, 'python': 5, 'javascript': 5, 'csharp': 4, 'cpp': 4,
  'typescript': 5, 'golang': 4, 'rust': 4, 'ruby': 3, 'php': 3,
  
  // Web Technologies
  'react': 5, 'angular': 5, 'vue': 4, 'nodejs': 5, 'express': 4,
  'django': 4, 'fastapi': 4, 'spring': 5, 'sql': 5, 'mongodb': 4,
  
  // Cloud & DevOps
  'aws': 5, 'azure': 5, 'gcp': 5, 'docker': 5, 'kubernetes': 5,
  'terraform': 4, 'ci/cd': 5, 'jenkins': 4, 'gitlab': 4,
  
  // Methodologies & Practices
  'agile': 4, 'scrum': 4, 'kanban': 3, 'tdd': 4, 'microservices': 5,
  'rest api': 5, 'graphql': 4, 'git': 5, 'github': 4,
  
  // Soft Skills
  'leadership': 3, 'communication': 3, 'teamwork': 2, 'problem solving': 3,
  'project management': 3, 'mentoring': 3
};

/**
 * Calculate skill density score (0-40)
 * Weighs the number and quality of skills
 */
function calculateSkillsScore(skills) {
  if (!skills || skills.length === 0) return 0;
  
  const skillCount = skills.length;
  
  // Base score on skill count
  let score = 0;
  if (skillCount < 3) {
    score = skillCount * 8; // 0-24 for low skills
  } else if (skillCount < 8) {
    score = 24 + (skillCount - 3) * 3; // 24-39 for medium skills
  } else {
    score = 39 + Math.min((skillCount - 8) * 0.1, 1); // 39-40 for high skills
  }
  
  return Math.min(score, 40);
}

/**
 * Calculate experience score (0-30)
 * Based on years of experience and number of positions
 */
function calculateExperienceScore(experience) {
  if (!experience || experience.length === 0) return 0;
  
  const positionCount = experience.length;
  
  // Estimate years based on job count (rough approximation)
  // Assume average 2 years per position
  const estimatedYears = positionCount * 2;
  
  let score = 0;
  if (estimatedYears < 1) {
    score = estimatedYears * 10; // 0-10 for fresh graduates
  } else if (estimatedYears < 3) {
    score = 10 + (estimatedYears - 1) * 5; // 10-20 for junior
  } else if (estimatedYears < 7) {
    score = 20 + (estimatedYears - 3) * 2.5; // 20-30 for mid-level
  } else {
    score = 30; // Cap at 30 for senior+
  }
  
  return Math.min(score, 30);
}

/**
 * Calculate education score (0-20)
 * Based on education entries quality
 */
function calculateEducationScore(education) {
  if (!education || education.length === 0) return 0;
  
  let score = 0;
  
  education.forEach(edu => {
    // Check for degree level indicators
    const eduLower = edu.toLowerCase();
    
    if (eduLower.includes('phd') || eduLower.includes('doctorate')) {
      score += 20;
    } else if (eduLower.includes('master') || eduLower.includes('m.')) {
      score += 15;
    } else if (eduLower.includes('bachelor') || eduLower.includes('b.')) {
      score += 10;
    } else if (eduLower.includes('diploma') || eduLower.includes('certificate')) {
      score += 5;
    } else {
      score += 3; // Generic education entry
    }
  });
  
  return Math.min(score, 20);
}

/**
 * Calculate keyword bonus score (0-10)
 * Scans for high-value industry keywords
 */
function calculateKeywordBonus(resumeData) {
  let keywordScore = 0;
  let keywordsFound = [];
  
  // Combine all text for keyword search
  const allText = [];
  if (resumeData.skills) allText.push(...resumeData.skills);
  if (resumeData.experience) {
    resumeData.experience.forEach(exp => {
      if (exp.title) allText.push(exp.title);
      if (exp.description) {
        if (Array.isArray(exp.description)) {
          allText.push(...exp.description);
        } else {
          allText.push(exp.description);
        }
      }
    });
  }
  if (resumeData.summary) allText.push(resumeData.summary);
  
  const combinedText = allText.join(' ').toLowerCase();
  
  // Check for weighted keywords
  Object.entries(KEYWORD_WEIGHTS).forEach(([keyword, weight]) => {
    if (combinedText.includes(keyword.toLowerCase())) {
      keywordScore += Math.min(weight / 10, 1); // Normalize to max 1 per keyword
      keywordsFound.push(keyword);
    }
  });
  
  return {
    score: Math.min(keywordScore, 10),
    keywords: keywordsFound.slice(0, 5) // Return top 5
  };
}

/**
 * Main ATS Score Generation Function
 */
async function generateATSScore(resumeData) {
  try {
    console.log('[ATS] Starting hybrid ATS calculation...');
    
    if (!resumeData) {
      return {
        atsScore: 0,
        scoreBreakdown: {
          skills: 0,
          experience: 0,
          education: 0,
          keywords: 0
        },
        error: 'No resume data provided'
      };
    }

    // Calculate individual scores
    const skillsScore = calculateSkillsScore(resumeData.skills);
    const experienceScore = calculateExperienceScore(resumeData.experience);
    const educationScore = calculateEducationScore(resumeData.education);
    const keywordData = calculateKeywordBonus(resumeData);

    // Calculate final hybrid score
    const finalScore = Math.round(
      (skillsScore * 0.40) +
      (experienceScore * 0.30) +
      (educationScore * 0.20) +
      (keywordData.score * 0.10)
    );

    const result = {
      atsScore: Math.min(100, finalScore),
      scoreBreakdown: {
        skills: Math.round(skillsScore),
        experience: Math.round(experienceScore),
        education: Math.round(educationScore),
        keywords: Math.round(keywordData.score),
        weights: {
          skills: '40%',
          experience: '30%',
          education: '20%',
          keywords: '10%'
        }
      },
      keywordsFound: keywordData.keywords,
      resumeMetrics: {
        totalSkills: resumeData.skills ? resumeData.skills.length : 0,
        totalExperience: resumeData.experience ? resumeData.experience.length : 0,
        educationEntries: resumeData.education ? resumeData.education.length : 0
      }
    };

    console.log(`[ATS] Final Score: ${result.atsScore}/100`);
    console.log(`[ATS] Breakdown:`, result.scoreBreakdown);

    return result;
  } catch (error) {
    console.error('[ATS] Error calculating ATS score:', error.message);
    return {
      atsScore: 0,
      error: error.message
    };
  }
}

module.exports = {
  generateATSScore
};
