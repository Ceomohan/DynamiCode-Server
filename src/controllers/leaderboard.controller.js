const leaderboardService = require('../services/leaderboard.service');

/**
 * @route GET /api/leaderboard/top?limit=50
 * @access Private
 */
const getTop = async (req, res) => {
  try {
    const limit = req.query.limit;
    const top = await leaderboardService.getTopUsers(limit);
    res.status(200).json({ top });
  } catch (error) {
    console.error('Leaderboard top error:', error);
    res.status(500).json({ message: error.message || 'Failed to load leaderboard' });
  }
};

/**
 * @route GET /api/leaderboard/me
 * @access Private
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user._id;
    // Ensure user entry exists / is up-to-date
    await leaderboardService.updateLeaderboard(userId);
    const me = await leaderboardService.getUserRank(userId);
    res.status(200).json({ me });
  } catch (error) {
    console.error('Leaderboard me error:', error);
    res.status(500).json({ message: error.message || 'Failed to load rank' });
  }
};

module.exports = {
  getTop,
  getMe,
};

