/**
 * Review Routes
 * 
 * Defines API endpoints for code review functionality.
 * Handles POST /api/review requests from the VS Code extension.
 */

const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

/**
 * POST /api/review
 * 
 * Analyzes code and returns AI-generated review text
 * No code size limits - accepts any size file
 * 
 * Request body:
 * {
 *   "code": "string - the source code to analyze",
 *   "language": "string (optional) - programming language"
 * }
 * 
 * Response:
 * {
 *   "review": "AI-generated review text with analysis"
 * }
 */
router.post('/review', async (req, res, next) => {
  try {
    const { code, language } = req.body;

    // Validate request - only check that code exists
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing or invalid "code" field in request body'
      });
    }

    // No code size limit - accept any file size

    // Log request info
    console.log(`Processing review request - Code length: ${code.length} characters`);
    if (language) {
      console.log(`Language: ${language}`);
    }

    // Call AI service to analyze code
    const analysis = await aiService.analyzeCode(code, language);

    // Return AI review response
    res.json(analysis);

  } catch (error) {
    // Log error details
    console.error('Error in /review endpoint:', error.message);
    
    // Handle specific error types
    if (error.message.includes('API key')) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'API key not configured. Please check server configuration.'
      });
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate Limit Exceeded',
        message: 'Too many requests. Please try again later.'
      });
    }

    // Return error response without crashing
    res.status(500).json({
      error: 'Analysis Error',
      message: error.message || 'Failed to analyze code'
    });
  }
});

/**
 * GET /api/review/status
 * 
 * Returns the status of the review service and checks AI availability
 */
router.get('/review/status', async (req, res) => {
  try {
    const status = await aiService.checkStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
