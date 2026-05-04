const Groq = require('groq-sdk');
const AiSettings = require('../models/AiSettings');

let groqInstance = null;

const getGroqClient = () => {
  if (!groqInstance) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
    groqInstance = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      // Explicit timeout keeps the request well within Render's 30s limit.
      // The Groq SDK default is no timeout, which causes silent kills on free-tier hosts.
      timeout: 25000,
    });
  }
  return groqInstance;
};

const generateSolution = async (problem, language) => {
  // Guard against missing fields — raw AI-generated problems may omit these
  const constraints = Array.isArray(problem.constraints) && problem.constraints.length > 0
    ? problem.constraints.join(', ')
    : (typeof problem.constraints === 'string' && problem.constraints)
      ? problem.constraints
      : 'None specified';
  const inputFormat  = problem.inputFormat  || 'See problem description';
  const outputFormat = problem.outputFormat || 'See problem description';

  const prompt = `
    You are an expert coding mentor. I need you to provide a solution for the following coding problem.
    
    Problem Title: ${problem.title}
    Description: ${problem.description}
    Constraints: ${constraints}
    Input Format: ${inputFormat}
    Output Format: ${outputFormat}
    
    Target Language: ${language}

    Please generate a clean, optimal solution with a beginner-friendly explanation.
    
    The output must be a valid JSON object with the following structure:
    {
      "solutionCode": "The complete working code solution",
      "explanationSteps": ["Step 1 explanation", "Step 2 explanation", ...],
      "timeComplexity": "Big O notation with brief explanation",
      "spaceComplexity": "Big O notation with brief explanation",
      "alternativeApproach": "Brief mention of another way to solve it (e.g., brute force vs optimized)"
    }

    Ensure the code is correct and follows best practices for ${language}.
    Do not include any markdown formatting or text outside the JSON object.
    Return ONLY the JSON.
  `;

  try {
    const groq = getGroqClient();
    const settings = await AiSettings.findOne({}).sort({ updatedAt: -1 }).lean();

    // Use the fast 8b-instant model as the default for solution generation.
    // The 70b model takes 35-50s which exceeds Render free tier's 30s request timeout.
    // Admin can override via AiSettings but the instant model is the safe production default.
    const model = settings?.model || 'llama-3.1-8b-instant';
    const temperature = typeof settings?.temperature === 'number' ? settings.temperature : 0.5;
    // Enforce a minimum of 2048 tokens so solution code + explanation never gets cut off.
    // Admin-configured values below 2048 are overridden; the default is raised to 4096.
    const max_tokens = typeof settings?.maxTokens === 'number'
      ? Math.max(settings.maxTokens, 2048)
      : 4096;
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert coding interview mentor. You always output valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model,
      temperature,
      max_tokens,
    });

    const content = completion.choices[0]?.message?.content;
    
    // Attempt to parse JSON
    try {
      // Find JSON substring if there's extra text
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = content.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonString);
      }
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing AI solution response:', parseError);
      throw new Error('Failed to parse generated solution');
    }

  } catch (error) {
    // Reset the singleton so the next request gets a fresh Groq client.
    // A stale/timed-out client instance is the most common cause of repeated
    // failures after a Render cold start or mid-session instance recycle.
    groqInstance = null;

    // Surface the real Groq error message instead of hiding it behind a generic one.
    console.error('AI Solution Generation Error:', error);
    if (error.message.includes('GROQ_API_KEY')) {
      throw error;
    }
    throw new Error(error.message || 'Failed to generate solution');
  }
};

module.exports = { generateSolution };
