const adaptiveEngineService = require('../services/adaptiveEngine.service');

/**
 * @desc    Record a user's attempt at solving a problem
 * @route   POST /api/adaptive/record
 * @access  Private
 */
const recordAttempt = async (req, res) => {
  try {
    const { topic, difficulty, solved, attempts, timeTaken } = req.body;
    const userId = req.user._id;

    // Validation
    if (!topic || !difficulty || typeof solved !== 'boolean' || !attempts || timeTaken === undefined) {
      return res.status(400).json({
        message: 'Please provide topic, difficulty, solved status, attempts, and timeTaken',
      });
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({
        message: 'Difficulty must be Easy, Medium, or Hard',
      });
    }

    if (attempts < 1 || timeTaken < 0) {
      return res.status(400).json({
        message: 'Attempts must be at least 1 and timeTaken must be non-negative',
      });
    }

    const progress = await adaptiveEngineService.recordAttempt(
      userId,
      topic,
      difficulty,
      solved,
      attempts,
      timeTaken
    );

    res.status(201).json({
      message: 'Attempt recorded successfully',
      progress,
    });
  } catch (error) {
    console.error('Error recording attempt:', error);
    res.status(500).json({ message: error.message || 'Failed to record attempt' });
  }
};

/**
 * @desc    Get next recommended difficulty and topic for a user
 * @route   GET /api/adaptive/next
 * @access  Private
 */
const getNextRecommendation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { topic } = req.query;

    let nextDifficulty;
    let nextTopic;

    if (topic) {
      // Get next difficulty for specific topic
      nextDifficulty = await adaptiveEngineService.getNextDifficulty(userId, topic);
      nextTopic = topic;
    } else {
      // Get next topic and its recommended difficulty
      nextTopic = await adaptiveEngineService.getNextTopic(userId);
      nextDifficulty = await adaptiveEngineService.getNextDifficulty(userId, nextTopic);
    }

    res.status(200).json({
      difficulty: nextDifficulty,
      topic: nextTopic,
    });
  } catch (error) {
    console.error('Error getting next recommendation:', error);
    res.status(500).json({ message: error.message || 'Failed to get next recommendation' });
  }
};

module.exports = {
  recordAttempt,
  getNextRecommendation,
};
