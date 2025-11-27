const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Generate ATS score for a resume
 * ATS (Applicant Tracking System) score indicates how well a resume is optimized
 */
async function generateATSScore(resumeData) {
  try {
    // Prepare resume text for analysis
    const resumeText = formatResumeForAnalysis(resumeData);

    const prompt = `You are an expert ATS (Applicant Tracking System) analyst. Analyze the following resume and generate an ATS score.

Consider:
1. Resume Format & Structure (clarity, readability, proper sections)
2. Keyword Optimization (industry-specific keywords, technical terms)
3. Content Quality (achievements, measurable results, relevant experience)
4. Contact Information (email, phone, LinkedIn presence)
5. Skills Section (relevant and well-organized skills)
6. Experience Section (clear job titles, company names, dates)
7. Education Section (degrees, institutions, graduation year)
8. Grammar & Spelling (no errors, professional language)

Resume Content:
${resumeText}

Provide a detailed ATS analysis in JSON format with:
{
  "atsScore": <number from 0-100>,
  "scoreBreakdown": {
    "format": <0-15>,
    "keywords": <0-15>,
    "content": <0-20>,
    "contactInfo": <0-10>,
    "skills": <0-15>,
    "experience": <0-15>,
    "education": <0-10>
  },
  "strengths": [<array of positive aspects>],
  "weaknesses": [<array of areas to improve>],
  "recommendations": [<array of specific improvements>]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const atsData = JSON.parse(jsonMatch[0]);
      return atsData;
    }

    throw new Error('Failed to parse ATS response');
  } catch (error) {
    console.error('Error in generateATSScore:', error.message);
    throw new Error(`ATS score generation failed: ${error.message}`);
  }
}

/**
 * Generate job match score - how well the resume matches a job description
 */
async function generateJobMatchScore(resumeData, jobDescription) {
  try {
    const resumeText = formatResumeForAnalysis(resumeData);

    const prompt = `You are an expert recruiter. Compare the following resume against the job description and provide a detailed match analysis.

Resume:
${resumeText}

Job Description:
${jobDescription}

Provide analysis in JSON format with:
{
  "matchScore": <number from 0-100>,
  "keywordMatches": {
    "matched": [<required keywords found in resume>],
    "missing": [<required keywords NOT found in resume>]
  },
  "skillsAnalysis": {
    "matched": [<skills the candidate has that job requires>],
    "missing": [<skills the job requires that candidate lacks>]
  },
  "experienceRelevance": <0-100>,
  "overallAssessment": "<brief paragraph>",
  "recommendations": [<suggestions for candidate to improve fit>]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to parse job match response');
  } catch (error) {
    console.error('Error in generateJobMatchScore:', error.message);
    throw new Error(`Job match analysis failed: ${error.message}`);
  }
}

/**
 * Extract key metrics from resume for scoring
 */
function extractMetrics(resumeData) {
  const metrics = {
    hasEmail: !!resumeData.contact?.email,
    hasPhone: !!resumeData.contact?.phone,
    hasLinkedIn: !!resumeData.contact?.linkedin,
    skillsCount: resumeData.skills?.length || 0,
    experienceCount: resumeData.experience?.length || 0,
    educationCount: resumeData.education?.length || 0,
    hasSummary: !!resumeData.summary && resumeData.summary.length > 20
  };

  return metrics;
}

/**
 * Quick heuristic-based ATS score (for fast analysis without AI)
 */
function quickATSScore(resumeData) {
  let score = 0;

  const metrics = extractMetrics(resumeData);

  // Contact information (10 points)
  if (metrics.hasEmail) score += 3;
  if (metrics.hasPhone) score += 2;
  if (metrics.hasLinkedIn) score += 5;

  // Skills section (15 points)
  score += Math.min(metrics.skillsCount * 1, 15);

  // Experience section (30 points)
  score += Math.min(metrics.experienceCount * 5, 30);

  // Education section (15 points)
  score += Math.min(metrics.educationCount * 5, 15);

  // Professional summary (15 points)
  if (metrics.hasSummary) score += 15;

  // Content quality (15 points) - based on text length
  const textLength = JSON.stringify(resumeData).length;
  if (textLength > 1000) score += 15;
  else if (textLength > 500) score += 10;
  else if (textLength > 200) score += 5;

  return Math.min(score, 100);
}

/**
 * Format resume data for analysis
 */
function formatResumeForAnalysis(resumeData) {
  let text = '';

  if (resumeData.contact) {
    text += '\n=== CONTACT INFORMATION ===\n';
    if (resumeData.contact.email) text += `Email: ${resumeData.contact.email}\n`;
    if (resumeData.contact.phone) text += `Phone: ${resumeData.contact.phone}\n`;
    if (resumeData.contact.linkedin) text += `LinkedIn: ${resumeData.contact.linkedin}\n`;
  }

  if (resumeData.summary) {
    text += '\n=== PROFESSIONAL SUMMARY ===\n';
    text += resumeData.summary + '\n';
  }

  if (resumeData.experience && resumeData.experience.length > 0) {
    text += '\n=== EXPERIENCE ===\n';
    resumeData.experience.forEach((exp, idx) => {
      text += `\n${idx + 1}. ${exp.title}\n`;
      if (exp.period) text += `Period: ${exp.period}\n`;
      if (exp.description) {
        text += `Description:\n`;
        exp.description.forEach(desc => text += `- ${desc}\n`);
      }
    });
  }

  if (resumeData.education && resumeData.education.length > 0) {
    text += '\n=== EDUCATION ===\n';
    resumeData.education.forEach((edu, idx) => {
      text += `${idx + 1}. ${edu}\n`;
    });
  }

  if (resumeData.skills && resumeData.skills.length > 0) {
    text += '\n=== SKILLS ===\n';
    text += resumeData.skills.join(', ') + '\n';
  }

  text += '\n=== RAW TEXT ===\n';
  text += resumeData.rawText?.substring(0, 2000) || 'N/A';

  return text;
}

module.exports = {
  generateATSScore,
  generateJobMatchScore,
  extractMetrics,
  quickATSScore
};
