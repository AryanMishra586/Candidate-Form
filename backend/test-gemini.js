require('dotenv').config();
const axios = require('axios');

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API...');
    console.log('API Key exists:', !!GEMINI_API_KEY);
    
    const response = await axios.post(
      `${API_BASE_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: 'Return JSON: {"test": "working"}'
          }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    console.log('✅ Gemini API works!');
    console.log('Response:', response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('❌ Gemini API failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testGeminiAPI();
