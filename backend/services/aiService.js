/**
 * AI Service
 * 
 * Handles communication with OpenRouter API for code analysis.
 * Uses the stepfun/step-3.5-flash:free model for fast, free code review.
 * Processes code and returns AI-generated review text.
 */

const axios = require('axios');

// OpenRouter API Configuration
const OPENROUTER_CONFIG = {
  apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
  model: 'stepfun/step-3.5-flash:free',
  maxTokens: parseInt(process.env.MAX_TOKENS) || 2000,
  temperature: parseFloat(process.env.TEMPERATURE) || 0.7
};

/**
 * Creates the system prompt for code analysis
 */
function createSystemPrompt() {
  return `You are a senior developer reviewing code.

Return ONLY JSON in this format:

{
"score": number from 0 to 10,
"summary": "short explanation of code quality",
"suggestions": [
{ "line": number, "suggestion": "clear improvement advice" }
]
}

Rules:
• Always give at least 2 suggestions
• Score must reflect real quality
• Focus on readability, structure, performance, best practices
• Return ONLY JSON`;
}

/**
 * Creates the user prompt with the code to analyze
 */
function createUserPrompt(code, language) {
  let prompt = 'Analyze this code and return structured JSON:\n\n';
  
  if (language) {
    prompt += `Language: ${language}\n\n`;
  }
  
  prompt += '```\n' + code + '\n```\n\n';
  prompt += 'Return ONLY valid JSON. No markdown, no explanations.';
  
  return prompt;
}

/**
 * Analyzes code using OpenRouter API and returns AI review text
 * 
 * @param {string} code - The source code to analyze
 * @param {string} language - Optional programming language
 * @returns {Promise<Object>} Analysis result with review text
 */
async function analyzeCode(code, language = null) {
  try {
    // Check if API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    console.log(`[AI Service] Sending code to OpenRouter for analysis...`);
    console.log(`[AI Service] Model: ${OPENROUTER_CONFIG.model}`);

    // Prepare request payload
    const payload = {
      model: OPENROUTER_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: createSystemPrompt()
        },
        {
          role: 'user',
          content: createUserPrompt(code, language)
        }
      ],
      temperature: OPENROUTER_CONFIG.temperature,
      max_tokens: OPENROUTER_CONFIG.maxTokens
    };

    // Call OpenRouter API with proper headers
    const response = await axios.post(
      OPENROUTER_CONFIG.apiUrl,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost',
          'X-Title': 'AI Code Mentor'
        },
        timeout: 60000 // 60 second timeout
      }
    );

    // Extract the AI response text
    const reviewText = response.data.choices[0].message.content;
    console.log('[AI Service] Received response from OpenRouter');
    console.log(`[AI Service] Response length: ${reviewText.length} characters`);

    // Try to parse as JSON, fallback to text if needed
    let parsedReview;
    try {
      // Remove markdown code blocks if present
      let cleanedText = reviewText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```$/g, '').trim();
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '').trim();
      }
      
      parsedReview = JSON.parse(cleanedText);
      console.log('[AI Service] Successfully parsed JSON response');
      console.log(`[AI Service] Score: ${parsedReview.score}, Bugs: ${parsedReview.bugs?.length || 0}, Security: ${parsedReview.security?.length || 0}`);
    } catch (parseError) {
      console.warn('[AI Service] Failed to parse JSON, returning as text:', parseError.message);
      parsedReview = { review: reviewText };
    }

    // Return structured or fallback format
    return parsedReview;

  } catch (error) {
    console.error('[AI Service] Error during code analysis:', error.message);

    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      if (status === 401) {
        throw new Error('Invalid OpenRouter API key');
      }

      if (status === 429) {
        throw new Error('Rate limit exceeded - please try again later');
      }

      if (status === 500 || status === 503) {
        throw new Error('OpenRouter service temporarily unavailable');
      }

      throw new Error(`OpenRouter API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - code analysis took too long');
    }

    // Re-throw with generic message
    throw new Error(`Code analysis failed: ${error.message}`);
  }
}

/**
 * Health check for the AI service
 * Tests if OpenRouter API is properly configured
 */
async function healthCheck() {
  const status = {
    service: 'AI Service (OpenRouter)',
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!process.env.OPENROUTER_API_KEY,
    model: OPENROUTER_CONFIG.model
  };

  // Check API key configuration
  if (!process.env.OPENROUTER_API_KEY) {
    status.status = 'error';
    status.message = 'OpenRouter API key not configured';
  }

  return status;
}

module.exports = {
  analyzeCode,
  healthCheck
};
