const UserStats = require('../models/UserStats');
const UserProgress = require('../models/UserProgress');
const gamificationService = require('../services/gamification.service');
const leaderboardService = require('../services/leaderboard.service');

/**
 * @desc    Update gamification stats (xp/level/streak/achievements)
 * @route   POST /api/gamification/update
 * @access  Private
 */
const updateGamification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { difficulty, solved, timeTaken } = req.body;

    if (!difficulty || typeof solved !== 'boolean') {
      return res.status(400).json({
        message: 'Please provide difficulty and solved (boolean)',
      });
    }

    if (timeTaken !== undefined && (typeof timeTaken !== 'number' || timeTaken < 0)) {
      return res.status(400).json({
        message: 'timeTaken must be a non-negative number (seconds)',
      });
    }

    // Ensure stats exist + update streak for any activity.
    let stats = await gamificationService.updateStreak(userId);

    // Add XP only if solved.
    stats = await gamificationService.addXP(userId, difficulty, solved);

    // Unlock achievements based on updated stats.
    stats = await gamificationService.unlockAchievements(stats);

    // Keep leaderboard in sync (best-effort)
    try {
      await leaderboardService.updateLeaderboard(userId);
    } catch (e) {
      console.error('Leaderboard sync failed:', e.message);
    }

    res.status(200).json({ stats });
  } catch (error) {
    console.error('Gamification update error:', error);
    res.status(500).json({ message: error.message || 'Failed to update gamification' });
  }
};

/**
 * @desc    Get user gamification stats + basic analytics
 * @route   GET /api/gamification/stats
 * @access  Private
 */
const getGamificationStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await UserStats.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { new: true, upsert: true }
    );

    // Analytics are computed from UserProgress (Phase 7) to avoid altering practice flow.
    const uid = userId; // ObjectId

    const totalsAgg = await UserProgress.aggregate([
      { $match: { userId: uid } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          solvedCount: { $sum: { $cond: ['$solved', 1, 0] } },
          failedCount: { $sum: { $cond: ['$solved', 0, 1] } },
          avgTimeTaken: { $avg: '$timeTaken' },
        },
      },
    ]);

    const totals = totalsAgg[0] || {
      totalAttempts: 0,
      solvedCount: 0,
      failedCount: 0,
      avgTimeTaken: 0,
    };

    const topicWise = await UserProgress.aggregate([
      { $match: { userId: uid } },
      {
        $group: {
          _id: '$topic',
          attempts: { $sum: 1 },
          solved: { $sum: { $cond: ['$solved', 1, 0] } },
          avgTimeTaken: { $avg: '$timeTaken' },
        },
      },
      { $sort: { attempts: -1 } },
    ]);

    const difficultyDist = await UserProgress.aggregate([
      { $match: { userId: uid } },
      {
        $group: {
          _id: '$difficulty',
          attempts: { $sum: 1 },
          solved: { $sum: { $cond: ['$solved', 1, 0] } },
        },
      },
    ]);

    res.status(200).json({
      stats,
      analytics: {
        totalProblemsAttempted: totals.totalAttempts,
        solved: totals.solvedCount,
        failed: totals.failedCount,
        avgTimePerProblemSeconds: totals.avgTimeTaken ? Math.round(totals.avgTimeTaken) : 0,
        topicWiseProgress: topicWise.map((t) => ({
          topic: t._id,
          attempts: t.attempts,
          solved: t.solved,
          solveRate: t.attempts ? Math.round((t.solved / t.attempts) * 100) : 0,
          avgTimeSeconds: t.avgTimeTaken ? Math.round(t.avgTimeTaken) : 0,
        })),
        difficultyDistribution: difficultyDist.map((d) => ({
          difficulty: d._id,
          attempts: d.attempts,
          solved: d.solved,
          solveRate: d.attempts ? Math.round((d.solved / d.attempts) * 100) : 0,
        })),
      },
    });
  } catch (error) {
    console.error('Gamification stats error:', error);
    res.status(500).json({ message: error.message || 'Failed to get gamification stats' });
  }
};

module.exports = {
  updateGamification,
  getGamificationStats,
};

