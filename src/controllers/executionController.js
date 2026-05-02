const codeExecutionService = require('../services/codeExecution.service');

const executeCode = async (req, res, next) => {
  try {
    const { language, sourceCode, stdin } = req.body;

    if (!language || !sourceCode) {
      return res.status(400).json({ 
        message: 'Language and source code are required' 
      });
    }

    // Limit code length (simple check)
    if (sourceCode.length > 10000) {
      return res.status(400).json({
        message: 'Source code exceeds maximum allowed length'
      });
    }

    const result = await codeExecutionService.executeCode(language, sourceCode, stdin);
    res.json(result);

  } catch (error) {
    if (error?.statusCode) {
      const payload = { message: error.message || 'Failed to execute code' };
      if (process.env.NODE_ENV !== 'production' && typeof error.details !== 'undefined') {
        payload.details = error.details;
      }
      return res.status(error.statusCode).json(payload);
    }
    next(error);
  }
};

module.exports = {
  executeCode
};
