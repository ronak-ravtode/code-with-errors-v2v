const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

// Test API Key on startup
console.log('🔑 GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('🔑 Key starts with:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');

router.post('/chat', async (req, res) => {
  console.log('========================================');
  console.log(' NEW REQUEST TO /api/ai/chat');
  console.log('========================================');
  console.log('Request Body:', JSON.stringify(req.body, null, 2));

  try {
    const { user_message, context, chat_history } = req.body;

    // VALIDATION 1: Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ ERROR: GEMINI_API_KEY is NOT set in .env!');
      return res.status(500).json({
        error: 'API key missing',
        debug: 'Check your .env file'
      });
    }

    // VALIDATION 2: Check if context exists
    console.log(' Context received:', context);
    console.log('💬 User message:', user_message);

    // Build system prompt
    const systemPrompt = `You are "Unsaid", a vigilant AI safety companion for women.

CONTEXT:
- Time: ${context?.time || 'unknown'}:00
- Battery: ${context?.battery || 'unknown'}%
- Location: ${context?.location_type || 'unknown'}

RULES:
1. If battery < 20% OR time > 22:00 → HIGH ALERT
2. Be concise and actionable
3. ALWAYS respond with valid JSON ONLY

JSON FORMAT:
{
  "message": "Your advice here",
  "risk_level": "low" | "medium" | "high",
  "ui_actions": ["share_location", "start_fake_call", "none"]
}`;

    console.log(' System Prompt:', systemPrompt.substring(0, 100) + '...');

    // VALIDATION 3: Test Gemini Connection
    console.log('🔄 Calling Gemini API...');

    const fullPrompt = `${systemPrompt}\n\nUser: ${user_message}\n\nAssistant (JSON only):`;

    const responseData = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      {
        "contents": [
          {
            "parts": [
              {
                "text": fullPrompt
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': process.env.GEMINI_API_KEY
        }
      }
    );

    const aiText = responseData.data.candidates[0].content.parts[0].text;

    console.log('✅ GEMINI RESPONSE RECEIVED!');
    console.log('Raw response:', aiText);

    // VALIDATION 4: Parse JSON
    let parsedResponse;
    try {
      const cleanText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanText);
      console.log('✅ PARSED JSON:', parsedResponse);
    } catch (parseError) {
      console.error('❌ JSON PARSE FAILED:', parseError);
      console.error('Raw text that failed to parse:', aiText);

      // Return the raw text as message
      parsedResponse = {
        message: aiText,
        risk_level: "medium",
        ui_actions: ["share_location"]
      };
    }

    console.log(' Sending response to frontend');
    res.json(parsedResponse);

  } catch (error) {
    console.error('========================================');
    console.error('💥 BACKEND ERROR in /api/ai/chat');
    console.error('========================================');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);

    if (error.response) {
      console.error('API Response error:', error.response.data);
    }

    res.status(500).json({
      error: 'Gemini API failed',
      message: error.message,
      type: error.constructor.name
    });
  }
});

module.exports = router;
