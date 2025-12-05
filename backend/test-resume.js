require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parseResume } = require('./utils/resumeParser');

async function testResumeExtraction() {
  try {
    // Find a resume file in uploads
    const uploadsDir = path.join(__dirname, 'uploads');
    const files = fs.readdirSync(uploadsDir);
    const resumeFiles = files.filter(f => f.includes('resume'));
    
    if (resumeFiles.length === 0) {
      console.log('❌ No resume files found in uploads');
      return;
    }

    const resumeFile = path.join(uploadsDir, resumeFiles[0]);
    console.log(`Testing resume extraction on: ${resumeFiles[0]}`);
    
    const parsed = await parseResume(resumeFile);
    
    console.log('\n✅ RESUME PARSING RESULTS:');
    console.log('================================');
    console.log('Contact:', JSON.stringify(parsed.contact, null, 2));
    console.log('Skills:', parsed.skills);
    console.log('Experience entries:', parsed.experience?.length || 0);
    console.log('Education entries:', parsed.education?.length || 0);
    console.log('Summary:', parsed.summary?.substring(0, 100) + '...');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testResumeExtraction();
