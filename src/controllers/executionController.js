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
    next(error);
  }
};

module.exports = {
  executeCode
};
