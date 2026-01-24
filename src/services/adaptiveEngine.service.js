const UserProgress = require('../models/UserProgress');

/**
 * Record a user's attempt at solving a problem
 * @param {string} userId - User ID
 * @param {string} topic - Problem topic
 * @param {string} difficulty - Problem difficulty (Easy, Medium, Hard)
 * @param {boolean} solved - Whether the problem was solved
 * @param {number} attempts - Number of attempts made
 * @param {number} timeTaken - Time taken in seconds
 * @returns {Promise<Object>} Created progress record
 */
const recordAttempt = async (userId, topic, difficulty, solved, attempts, timeTaken) => {
  try {
    const progress = await UserProgress.create({
      userId,
      topic,
      difficulty,
      solved,
      attempts,
      timeTaken,
    });

    return progress;
  } catch (error) {
    console.error('Error recording attempt:', error);
    throw new Error('Failed to record attempt');
  }
};

/**
 * Get the next recommended difficulty for a user based on their performance
 * @param {string} userId - User ID
 * @param {string} topic - Problem topic
 * @returns {Promise<string>} Next difficulty level (Easy, Medium, Hard)
 */
const getNextDifficulty = async (userId, topic) => {
  try {
    // Get recent attempts for this topic (last 10 attempts)
    const recentAttempts = await UserProgress.find({
      userId,
      topic,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    if (recentAttempts.length === 0) {
      // No history, start with Easy
      return 'Easy';
    }

    // Calculate performance metrics
    const solvedCount = recentAttempts.filter(a => a.solved).length;
    const totalAttempts = recentAttempts.length;
    const solveRate = solvedCount / totalAttempts;

    // Get average attempts per solved problem
    const solvedAttempts = recentAttempts.filter(a => a.solved);
    const avgAttempts = solvedAttempts.length > 0
      ? solvedAttempts.reduce((sum, a) => sum + a.attempts, 0) / solvedAttempts.length
      : 0;

    // Get average time taken for solved problems
    const avgTimeTaken = solvedAttempts.length > 0
      ? solvedAttempts.reduce((sum, a) => sum + a.timeTaken, 0) / solvedAttempts.length
      : 0;

    // Get most recent difficulty
    const currentDifficulty = recentAttempts[0].difficulty;
    const difficultyOrder = { Easy: 0, Medium: 1, Hard: 2 };

    // Adaptive logic:
    // 1. If solved quickly (≤ 2 attempts) and solve rate > 70% → increase difficulty
    // 2. If failed or many attempts (> 3) or solve rate < 40% → decrease difficulty
    // 3. Otherwise → keep same difficulty

    let nextDifficulty = currentDifficulty;

    if (solveRate > 0.7 && avgAttempts <= 2 && avgTimeTaken < 300) {
      // Performing well: increase difficulty
      if (currentDifficulty === 'Easy') {
        nextDifficulty = 'Medium';
      } else if (currentDifficulty === 'Medium') {
        nextDifficulty = 'Hard';
      }
      // Already at Hard, stay at Hard
    } else if (solveRate < 0.4 || avgAttempts > 3 || (solvedAttempts.length > 0 && avgTimeTaken > 600)) {
      // Struggling: decrease difficulty
      if (currentDifficulty === 'Hard') {
        nextDifficulty = 'Medium';
      } else if (currentDifficulty === 'Medium') {
        nextDifficulty = 'Easy';
      }
      // Already at Easy, stay at Easy
    }
    // Otherwise, keep same difficulty

    return nextDifficulty;
  } catch (error) {
    console.error('Error getting next difficulty:', error);
    // Default to Easy on error
    return 'Easy';
  }
};

/**
 * Get the next recommended topic for a user based on their progress
 * @param {string} userId - User ID
 * @returns {Promise<string>} Next recommended topic
 */
const getNextTopic = async (userId) => {
  try {
    // Convert userId to ObjectId if it's a string
    const userIdObj = typeof userId === 'string' 
      ? new mongoose.Types.ObjectId(userId) 
      : userId;
    
    // Get all topics the user has attempted
    const topicStats = await UserProgress.aggregate([
      { $match: { userId: userIdObj } },
      {
        $group: {
          _id: '$topic',
          totalAttempts: { $sum: 1 },
          solvedCount: {
            $sum: { $cond: ['$solved', 1, 0] }
          },
          lastAttempt: { $max: '$createdAt' },
        },
      },
      { $sort: { lastAttempt: -1 } },
    ]);

    if (topicStats.length === 0) {
      // No history, return default topic
      return 'Data Structures';
    }

    // Find topics with low solve rate or haven't been attempted recently
    const topics = [
      'Data Structures',
      'Algorithms',
      'Dynamic Programming',
      'Strings',
      'Arrays',
      'Recursion',
    ];

    // Check if there are topics not yet attempted
    const attemptedTopics = topicStats.map(stat => stat._id);
    const unattemptedTopics = topics.filter(topic => !attemptedTopics.includes(topic));

    if (unattemptedTopics.length > 0) {
      return unattemptedTopics[0];
    }

    // Find topic with lowest solve rate that needs more practice
    const topicWithLowestSolveRate = topicStats
      .filter(stat => stat.totalAttempts >= 3) // At least 3 attempts
      .sort((a, b) => {
        const solveRateA = a.solvedCount / a.totalAttempts;
        const solveRateB = b.solvedCount / b.totalAttempts;
        return solveRateA - solveRateB;
      })[0];

    if (topicWithLowestSolveRate) {
      return topicWithLowestSolveRate._id;
    }

    // Default: return most recently attempted topic
    return topicStats[0]._id;
  } catch (error) {
    console.error('Error getting next topic:', error);
    // Default topic on error
    return 'Data Structures';
  }
};

module.exports = {
  recordAttempt,
  getNextDifficulty,
  getNextTopic,
};
