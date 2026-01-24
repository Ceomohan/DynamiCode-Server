const { generateCodingProblem } = require('../services/aiProblemGenerator.service');
const Problem = require('../models/Problem');

// @desc    Generate a new coding problem
// @route   POST /api/problems/generate
// @access  Private
const generateProblem = async (req, res) => {
  const { topic, difficulty } = req.body;

  if (!topic || !difficulty) {
    return res.status(400).json({ message: 'Please provide topic and difficulty' });
  }

  try {
    const problem = await generateCodingProblem(topic, difficulty);
    // Persist generated problems for admin review/history (does not change response shape)
    try {
      await Problem.create({
        createdBy: req.user._id,
        ...problem,
      });
    } catch (e) {
      console.error('Failed to persist problem:', e.message);
    }
    res.status(200).json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateProblem,
};
