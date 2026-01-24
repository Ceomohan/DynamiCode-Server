const User = require('../models/User');
const Problem = require('../models/Problem');
const UserProgress = require('../models/UserProgress');
const UserStats = require('../models/UserStats');
const AiSettings = require('../models/AiSettings');
const AdminActionLog = require('../models/AdminActionLog');

const logAdminAction = async (adminId, action, targetType, targetId, metadata = {}) => {
  try {
    await AdminActionLog.create({ adminId, action, targetType, targetId, metadata });
  } catch (e) {
    console.error('Failed to log admin action:', e.message);
  }
};

// USERS
const listUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('name email role isBanned createdAt')
      .sort({ createdAt: -1 })
      .limit(500);
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to list users' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const adminId = req.user._id;
    const targetId = req.params.id;

    if (String(adminId) === String(targetId)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(targetId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await logAdminAction(adminId, 'DELETE_USER', 'User', user._id, { email: user.email });
    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete user' });
  }
};

const banUser = async (req, res) => {
  try {
    const adminId = req.user._id;
    const targetId = req.params.id;

    if (String(adminId) === String(targetId)) {
      return res.status(400).json({ message: 'You cannot ban your own account' });
    }

    const user = await User.findById(targetId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBanned = true;
    await user.save();

    await logAdminAction(adminId, 'BAN_USER', 'User', user._id, { email: user.email });
    res.status(200).json({ message: 'User banned', user: { _id: user._id, isBanned: user.isBanned } });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to ban user' });
  }
};

// PROBLEMS
const listProblems = async (req, res) => {
  try {
    const problems = await Problem.find({})
      .select('title topic difficulty createdBy createdAt')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(500);

    res.status(200).json({ problems });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to list problems' });
  }
};

const deleteProblem = async (req, res) => {
  try {
    const adminId = req.user._id;
    const targetId = req.params.id;

    const problem = await Problem.findByIdAndDelete(targetId);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    await logAdminAction(adminId, 'DELETE_PROBLEM', 'Problem', problem._id, {
      title: problem.title,
      topic: problem.topic,
      difficulty: problem.difficulty,
    });

    res.status(200).json({ message: 'Problem deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete problem' });
  }
};

// ANALYTICS (platform-wide)
const platformStats = async (req, res) => {
  try {
    const [usersCount, attemptsCount, solvedCount, statsAgg] = await Promise.all([
      User.countDocuments({}),
      UserProgress.countDocuments({}),
      UserProgress.countDocuments({ solved: true }),
      UserStats.aggregate([
        {
          $group: {
            _id: null,
            totalXP: { $sum: '$xp' },
            avgLevel: { $avg: '$level' },
            totalSolved: { $sum: '$totalProblemsSolved' },
          },
        },
      ]),
    ]);

    const agg = statsAgg[0] || { totalXP: 0, avgLevel: 1, totalSolved: 0 };

    res.status(200).json({
      stats: {
        usersCount,
        totalAttempts: attemptsCount,
        totalSolvedAttempts: solvedCount,
        totalXP: agg.totalXP,
        avgLevel: agg.avgLevel ? Math.round(agg.avgLevel * 10) / 10 : 1,
        totalSolvedAwarded: agg.totalSolved,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load platform stats' });
  }
};

// AI SETTINGS
const updateAiSettings = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { model, temperature, maxTokens } = req.body;

    const next = {};
    if (model !== undefined) next.model = model;
    if (temperature !== undefined) next.temperature = temperature;
    if (maxTokens !== undefined) next.maxTokens = maxTokens;

    const doc = await AiSettings.findOneAndUpdate({}, next, { new: true, upsert: true });

    await logAdminAction(adminId, 'UPDATE_AI_SETTINGS', 'AiSettings', doc._id, next);
    res.status(200).json({ settings: doc });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update AI settings' });
  }
};

module.exports = {
  listUsers,
  deleteUser,
  banUser,
  listProblems,
  deleteProblem,
  platformStats,
  updateAiSettings,
};

