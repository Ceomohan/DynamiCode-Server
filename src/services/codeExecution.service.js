const axios = require('axios');

// Judge0 CE language IDs
// Full list: https://ce.judge0.com/languages/
const LANGUAGE_MAP = {
  javascript: { id: 63,  name: 'JavaScript (Node.js 12.14.0)' },
  js:         { id: 63,  name: 'JavaScript (Node.js 12.14.0)' },
  python:     { id: 71,  name: 'Python (3.8.1)' },
  py:         { id: 71,  name: 'Python (3.8.1)' },
  java:       { id: 62,  name: 'Java (OpenJDK 13.0.1)' },
  cpp:        { id: 54,  name: 'C++ (GCC 9.2.0)' },
  'c++':      { id: 54,  name: 'C++ (GCC 9.2.0)' },
  c:          { id: 50,  name: 'C (GCC 9.2.0)' },
};

const DEFAULT_TIMEOUT_MS = 15000;

// Judge0 status IDs that mean "still processing"
const PENDING_STATUS_IDS = new Set([1, 2]); // 1=In Queue, 2=Processing

class CodeExecutionService {
  constructor() {
    // Judge0 CE via RapidAPI (free tier: 50 req/day, no credit card needed)
    // Sign up at https://rapidapi.com/judge0-official/api/judge0-ce
    // and set JUDGE0_API_KEY in your .env
    //
    // Alternatively, set JUDGE0_BASE_URL to a self-hosted Judge0 instance
    // and leave JUDGE0_API_KEY empty.
    const baseUrl = String(process.env.JUDGE0_BASE_URL || '').trim().replace(/\/+$/, '');
    this.baseUrl = baseUrl || 'https://judge0-ce.p.rapidapi.com';

    this.apiKey  = String(process.env.JUDGE0_API_KEY  || '').trim();
    this.apiHost = String(process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com').trim();

    this.timeoutMs   = Number.parseInt(process.env.JUDGE0_TIMEOUT_MS, 10) || DEFAULT_TIMEOUT_MS;
    // How long to wait between polling for a result (ms)
    this.pollIntervalMs = Number.parseInt(process.env.JUDGE0_POLL_INTERVAL_MS, 10) || 1500;
    // Max number of poll attempts before giving up
    this.maxPolls = Number.parseInt(process.env.JUDGE0_MAX_POLLS, 10) || 8;
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      // RapidAPI auth headers
      headers['X-RapidAPI-Key']  = this.apiKey;
      headers['X-RapidAPI-Host'] = this.apiHost;
    }
    return headers;
  }

  /**
   * Submit code to Judge0 and return the token for polling.
   */
  async submitCode(languageId, sourceCode, stdin) {
    const payload = {
      language_id: languageId,
      source_code: sourceCode,
      stdin: stdin || '',
    };

    const response = await axios.post(
      `${this.baseUrl}/submissions?base64_encoded=false`,
      payload,
      { headers: this.getHeaders(), timeout: this.timeoutMs }
    );

    const token = response.data?.token;
    if (!token) {
      throw Object.assign(new Error('No submission token returned by execution provider'), { statusCode: 502 });
    }
    return token;
  }

  /**
   * Poll Judge0 until the submission is done, then return the result.
   */
  async pollResult(token) {
    for (let attempt = 0; attempt < this.maxPolls; attempt++) {
      // Wait before polling (first poll also waits a bit to let Judge0 process)
      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));

      const response = await axios.get(
        `${this.baseUrl}/submissions/${token}?base64_encoded=false&fields=stdout,stderr,compile_output,status,time,memory`,
        { headers: this.getHeaders(), timeout: this.timeoutMs }
      );

      const result = response.data;
      const statusId = result?.status?.id;

      if (!PENDING_STATUS_IDS.has(statusId)) {
        return result; // Done
      }
    }

    throw Object.assign(
      new Error('Code execution timed out waiting for result'),
      { statusCode: 408 }
    );
  }

  async executeCode(language, sourceCode, stdin = '') {
    const langKey = String(language || '').toLowerCase();
    const langConfig = LANGUAGE_MAP[langKey];

    if (!langConfig) {
      throw Object.assign(
        new Error(`Unsupported language: ${language}`),
        { statusCode: 400 }
      );
    }

    try {
      const token = await this.submitCode(langConfig.id, sourceCode, stdin);
      const result = await this.pollResult(token);
      return this.normalizeResponse(result);
    } catch (error) {
      // Re-throw errors we already wrapped
      if (error?.statusCode) throw error;

      const upstreamStatus  = error?.response?.status;
      const upstreamData    = error?.response?.data;
      const upstreamMessage =
        upstreamData?.message ||
        upstreamData?.error   ||
        (typeof upstreamData === 'string' ? upstreamData : null);

      const message = upstreamMessage || error.message || 'Failed to execute code';
      console.error('Code execution error:', upstreamData || error.message);

      throw Object.assign(new Error(message), {
        statusCode: upstreamStatus || 502,
        details: upstreamData,
      });
    }
  }

  normalizeResponse(judge0Result) {
    if (!judge0Result || typeof judge0Result !== 'object') {
      return {
        stdout: '',
        stderr: 'Unexpected response from code execution provider.',
        compile_output: '',
        time: null,
        memory: null,
        status: { id: 11, description: 'Error (Invalid Response)' },
      };
    }

    const { stdout, stderr, compile_output, status, time, memory } = judge0Result;

    // Judge0 status id 3 = Accepted; anything else is an error/non-zero exit
    const normalizedStatus = {
      id: status?.id ?? 11,
      description: status?.description ?? 'Unknown',
    };

    return {
      stdout:         stdout         || '',
      stderr:         stderr         || '',
      compile_output: compile_output || '',
      time:           time           ?? null,
      memory:         memory         ?? null,
      status:         normalizedStatus,
    };
  }
}

module.exports = new CodeExecutionService();
