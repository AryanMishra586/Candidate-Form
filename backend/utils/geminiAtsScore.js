/**
 * GEMINI AI-POWERED ATS SCORE CALCULATION
 * 
 * Uses Gemini API for intelligent ATS scoring with fallback to hybrid calculation
 * if API call fails.
 */

const axios = require('axios');
const { generateATSScore } = require('./atsScore');

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Call Gemini API for intelligent ATS scoring with retry logic
 */
async function callGeminiForAtsScore(resumeData, retries = 3, backoffMs = 1000) {
  try {
    if (!GEMINI_API_KEY) {
      console.warn('[ATS-GEMINI] ⚠️ GOOGLE_API_KEY not set - will use fallback');
      return null;
    }

    // Prepare resume text for Gemini
    const resumeText = formatResumeForGemini(resumeData);

    const prompt = `Analyze this resume and provide an ATS score (0-100) considering:
1. Keyword relevance for tech jobs
2. Professional experience level
3. Education quality
4. Skills diversity and relevance
5. Overall resume structure and clarity

Resume:
${resumeText}

Return a JSON object ONLY (no other text):
{
  "atsScore": number (0-100),
  "reasoning": "brief explanation",
  "strengths": ["list of strengths"],
  "improvements": ["list of improvements"],
  "keywordMatches": ["important keywords found"]
}`;

    console.log('[ATS-GEMINI] 🤖 Calling Gemini API for ATS analysis...');

    let lastError = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
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
            timeout: 15000
          }
        );

        const responseText = response.data.candidates[0].content.parts[0].text;
        console.log('[ATS-GEMINI] ✅ Gemini response received');

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedResult = JSON.parse(jsonMatch[0]);
          return {
            ...parsedResult,
            source: 'gemini-ai',
            apiSuccess: true
          };
        }
        return null;
      } catch (error) {
        lastError = error;
        
        // Log detailed error info
        const statusCode = error.response?.status;
        const errorData = error.response?.data;
        
        console.error(`[ATS-GEMINI] Attempt ${attempt}/${retries} failed:`);
        console.error(`  Status: ${statusCode}`);
        console.error(`  Error: ${error.message}`);
        if (errorData) {
          console.error(`  Response: ${JSON.stringify(errorData, null, 2)}`);
        }
        
        // Check if it's a rate limit error (429)
        if (statusCode === 429 && attempt < retries) {
          const waitTime = backoffMs * Math.pow(2, attempt - 1); // Exponential backoff
          console.warn(`[ATS-GEMINI] ⏱️ Rate limited (429). Retry ${attempt}/${retries} after ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // Check for other common API errors
        if (statusCode === 403) {
          console.error(`[ATS-GEMINI] ❌ 403 Forbidden - Check if API is enabled in Google Cloud Console`);
          throw error;
        }
        
        if (statusCode === 401) {
          console.error(`[ATS-GEMINI] ❌ 401 Unauthorized - API Key may be invalid or disabled`);
          throw error;
        }
        
        if (statusCode === 400) {
          console.error(`[ATS-GEMINI] ❌ 400 Bad Request - Check API request format`);
          throw error;
        }
        
        // Don't retry on other errors
        throw error;
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  } catch (error) {
    console.error('[ATS-GEMINI] ❌ Gemini API call failed:', error.message);
    console.error('[ATS-GEMINI] Will use hybrid fallback calculation instead');
    return null;
  }
}

/**
 * Format resume data for Gemini analysis
 */
function formatResumeForGemini(resumeData) {
  let text = '';

  if (resumeData.contact) {
    text += `CONTACT:\n`;
    if (resumeData.contact.email) text += `Email: ${resumeData.contact.email}\n`;
    if (resumeData.contact.phone) text += `Phone: ${resumeData.contact.phone}\n`;
    if (resumeData.contact.linkedin) text += `LinkedIn: ${resumeData.contact.linkedin}\n`;
    text += '\n';
  }

  if (resumeData.summary) {
    text += `SUMMARY:\n${resumeData.summary}\n\n`;
  }

  if (resumeData.skills && resumeData.skills.length > 0) {
    text += `SKILLS:\n${resumeData.skills.join(', ')}\n\n`;
  }

  if (resumeData.experience && resumeData.experience.length > 0) {
    text += `EXPERIENCE:\n`;
    resumeData.experience.forEach(exp => {
      text += `- ${exp.title}`;
      if (exp.period) text += ` (${exp.period})`;
      text += '\n';
      if (exp.description) {
        const desc = Array.isArray(exp.description) ? exp.description.join(' ') : exp.description;
        text += `  ${desc}\n`;
      }
    });
    text += '\n';
  }

  if (resumeData.education && resumeData.education.length > 0) {
    text += `EDUCATION:\n`;
    resumeData.education.forEach(edu => {
      text += `- ${edu}\n`;
    });
    text += '\n';
  }

  return text;
}

/**
 * Generate ATS Score - Gemini with Fallback
 */
async function generateATSScoreWithGemini(resumeData) {
  try {
    console.log('[ATS-GEMINI] 🚀 Starting ATS score generation...');

    // Try Gemini API first
    const geminiResult = await callGeminiForAtsScore(resumeData);

    if (geminiResult && geminiResult.apiSuccess) {
      console.log('[ATS-GEMINI] ✅ Using Gemini AI score:', geminiResult.atsScore);
      return {
        ...geminiResult,
        fallbackUsed: false
      };
    }

    // Fallback to hybrid calculation
    console.log('[ATS-GEMINI] ⚠️ Gemini failed or not available - using hybrid fallback');
    const hybridResult = await generateATSScore(resumeData);

    return {
      atsScore: hybridResult.atsScore,
      scoreBreakdown: hybridResult.scoreBreakdown,
      reasoning: `Calculated using hybrid method (Skills: ${hybridResult.scoreBreakdown.skills}, Experience: ${hybridResult.scoreBreakdown.experience}, Education: ${hybridResult.scoreBreakdown.education}, Keywords: ${hybridResult.scoreBreakdown.keywords})`,
      source: 'hybrid-calculation',
      fallbackUsed: true,
      keywordMatches: hybridResult.keywordsFound || []
    };
  } catch (error) {
    console.error('[ATS-GEMINI] 🚨 Critical error:', error.message);

    // Last resort - use hybrid calculation
    try {
      const hybridResult = await generateATSScore(resumeData);
      return {
        ...hybridResult,
        source: 'hybrid-calculation',
        fallbackUsed: true,
        error: 'Both methods attempted, using hybrid result'
      };
    } catch (fallbackError) {
      console.error('[ATS-GEMINI] 💥 All methods failed:', fallbackError.message);
      return {
        atsScore: 0,
        error: 'Unable to calculate ATS score',
        fallbackUsed: true,
        source: 'error'
      };
    }
  }
}

module.exports = {
  generateATSScoreWithGemini,
  callGeminiForAtsScore
};
