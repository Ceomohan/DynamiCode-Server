const aiSolutionService = require('../services/aiSolutionGenerator.service');

const generateSolution = async (req, res) => {
  const { problem, language } = req.body;

  if (!problem || !language) {
    return res.status(400).json({ message: 'Problem object and language are required' });
  }

  try {
    const solution = await aiSolutionService.generateSolution(problem, language);
    res.json(solution);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

module.exports = {
  generateSolution,
};
