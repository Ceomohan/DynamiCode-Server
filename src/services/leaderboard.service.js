const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');
const UserStats = require('../models/UserStats');

const updateLeaderboard = async (userId) => {
  const [user, stats] = await Promise.all([
    User.findById(userId).select('name'),
    UserStats.findOne({ userId }).select('xp level totalProblemsSolved'),
  ]);

  if (!user) {
    throw new Error('User not found');
  }

  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const totalSolved = stats?.totalProblemsSolved ?? 0;

  const entry = await Leaderboard.findOneAndUpdate(
    { userId },
    {
      userId,
      username: user.name,
      xp,
      level,
      totalSolved,
    },
    { new: true, upsert: true }
  );

  // Rank is computed on read (fast + always correct); stored rank is optional.
  return entry;
};

const getTopUsers = async (limit = 50) => {
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 50));

  const rows = await Leaderboard.find({})
    .sort({ xp: -1, totalSolved: -1, updatedAt: 1 })
    .limit(safeLimit)
    .select('userId username xp level totalSolved updatedAt');

  // Provide rank in response without persisting it.
  return rows.map((r, idx) => ({
    userId: r.userId,
    username: r.username,
    xp: r.xp,
    level: r.level,
    totalSolved: r.totalSolved,
    rank: idx + 1,
    updatedAt: r.updatedAt,
  }));
};

const getUserRank = async (userId) => {
  const me = await Leaderboard.findOne({ userId }).select('xp totalSolved username level');
  if (!me) {
    return null;
  }

  // Count how many have strictly greater XP, or same XP but more solved.
  const betterCount = await Leaderboard.countDocuments({
    $or: [
      { xp: { $gt: me.xp } },
      { xp: me.xp, totalSolved: { $gt: me.totalSolved } },
    ],
  });

  return {
    userId: me.userId,
    username: me.username,
    xp: me.xp,
    level: me.level,
    totalSolved: me.totalSolved,
    rank: betterCount + 1,
  };
};

module.exports = {
  updateLeaderboard,
  getTopUsers,
  getUserRank,
};

