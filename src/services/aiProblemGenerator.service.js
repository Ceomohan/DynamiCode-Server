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

const generateCodingProblem = async (topic, difficulty) => {
  const prompt = `
    Create a unique coding problem for a developer practicing data structures and algorithms.
    Topic: ${topic}
    Difficulty: ${difficulty}

    The output must be a valid JSON object with the following structure:
    {
      "title": "Problem Title",
      "description": "Detailed problem statement...",
      "constraints": ["Constraint 1", "Constraint 2"],
      "inputFormat": "Description of input format",
      "outputFormat": "Description of output format",
      "examples": [
        {
          "input": "Example Input 1",
          "output": "Example Output 1",
          "explanation": "Optional explanation"
        }
      ],
      "difficulty": "${difficulty}",
      "topic": "${topic}"
    }

    Ensure the problem is algorithmic and clear.
    Do not include any markdown formatting or text outside the JSON object.
    Return ONLY the JSON.
  `;

  try {
    const groq = getGroqClient();
    const settings = await AiSettings.findOne({}).sort({ updatedAt: -1 }).lean();
    const model = settings?.model || 'llama-3.3-70b-versatile';
    const temperature = typeof settings?.temperature === 'number' ? settings.temperature : 0.7;
    const max_tokens = typeof settings?.maxTokens === 'number' ? settings.maxTokens : 2048;
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert coding interview problem generator. You always output valid JSON.',
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
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse generated problem');
    }

  } catch (error) {
    console.error('AI Generation Error:', error);
    // Pass the specific error message if it's about the API key
    if (error.message.includes('GROQ_API_KEY')) {
      throw error;
    }
    throw new Error('Failed to generate problem');
  }
};

module.exports = { generateCodingProblem };
