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
    });
  }
  return groqInstance;
};

const generateSolution = async (problem, language) => {
  const prompt = `
    You are an expert coding mentor. I need you to provide a solution for the following coding problem.
    
    Problem Title: ${problem.title}
    Description: ${problem.description}
    Constraints: ${JSON.stringify(problem.constraints)}
    Input Format: ${problem.inputFormat}
    Output Format: ${problem.outputFormat}
    
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
    const model = settings?.model || 'llama-3.3-70b-versatile';
    const temperature = typeof settings?.temperature === 'number' ? settings.temperature : 0.5;
    const max_tokens = typeof settings?.maxTokens === 'number' ? settings.maxTokens : 2048;
    
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
    console.error('AI Solution Generation Error:', error);
    if (error.message.includes('GROQ_API_KEY')) {
      throw error;
    }
    throw new Error('Failed to generate solution');
  }
};

module.exports = { generateSolution };
