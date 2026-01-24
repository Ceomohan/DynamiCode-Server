const axios = require('axios');

// Piston Language Map
const LANGUAGE_MAP = {
  javascript: { language: 'javascript', version: '18.15.0' },
  python: { language: 'python', version: '3.10.0' },
  java: { language: 'java', version: '15.0.2' },
  cpp: { language: 'c++', version: '10.2.0' },
  c: { language: 'c', version: '10.2.0' }
};

class CodeExecutionService {
  constructor() {
    this.apiUrl = 'https://emkc.org/api/v2/piston/execute';
  }

  async executeCode(language, sourceCode, stdin = '') {
    const langConfig = LANGUAGE_MAP[language.toLowerCase()];
    if (!langConfig) {
      throw new Error(`Unsupported language: ${language}`);
    }

    try {
      const payload = {
        language: langConfig.language,
        version: langConfig.version,
        files: [
          {
            content: sourceCode
          }
        ],
        stdin: stdin
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      });

      const result = response.data;
      
      // Map Piston response to standardized format
      return this.normalizeResponse(result);

    } catch (error) {
      console.error('Code execution error:', error?.response?.data || error.message);
      throw new Error(error?.response?.data?.message || 'Failed to execute code');
    }
  }

  normalizeResponse(pistonResult) {
    const { run } = pistonResult;

    // Determine status based on exit code
    let status = {
      id: 3,
      description: 'Accepted'
    };

    if (run.code !== 0) {
      status = {
        id: 11,
        description: `Error (Exit Code: ${run.code})`
      };
    }

    return {
      stdout: run.stdout || '',
      stderr: run.stderr || '',
      compile_output: '', // Piston usually mixes compile errors into stderr or stdout
      time: null, // Piston free tier might not provide precise timing in this endpoint
      memory: null,
      status: status
    };
  }
}

module.exports = new CodeExecutionService();
