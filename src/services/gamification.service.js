const UserStats = require('../models/UserStats');

const XP_RULES = {
  Easy: 10,
  Medium: 20,
  Hard: 35,
};

// Simple, extendable leveling curve: every 100 XP = +1 level
const calculateLevel = (xp) => Math.floor(Math.max(0, xp) / 100) + 1;

const normalizeDifficulty = (difficulty) => {
  if (!difficulty) return null;
  const d = String(difficulty).toLowerCase();
  if (d === 'easy') return 'Easy';
  if (d === 'medium') return 'Medium';
  if (d === 'hard') return 'Hard';
  return null;
};

const startOfDayUTC = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const daysDiffUTC = (a, b) => {
  const ms = startOfDayUTC(a).getTime() - startOfDayUTC(b).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
};

const getOrCreateStats = async (userId) => {
  const stats = await UserStats.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { new: true, upsert: true }
  );
  return stats;
};

/**
 * Add XP for a solved problem, update level and solved counter.
 */
const addXP = async (userId, difficulty, solved) => {
  const stats = await getOrCreateStats(userId);

  if (!solved) return stats;

  const normalized = normalizeDifficulty(difficulty);
  const delta = normalized ? XP_RULES[normalized] : 0;

  stats.xp += delta;
  stats.level = calculateLevel(stats.xp);
  stats.totalProblemsSolved += 1;

  await stats.save();
  return stats;
};

/**
 * Update streak based on lastActiveDate (UTC-day granularity).
 * - If last active was today: no change
 * - If last active was yesterday: +1 streak
 * - Else: reset streak to 1 (starting today)
 */
const updateStreak = async (userId) => {
  const stats = await getOrCreateStats(userId);
  const now = new Date();

  if (!stats.lastActiveDate) {
    stats.currentStreak = 1;
    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    stats.lastActiveDate = now;
    await stats.save();
    return stats;
  }

  const diff = daysDiffUTC(now, stats.lastActiveDate); // now - lastActive

  if (diff === 0) {
    // already active today
    return stats;
  }

  if (diff === 1) {
    stats.currentStreak += 1;
  } else {
    stats.currentStreak = 1;
  }

  stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
  stats.lastActiveDate = now;
  await stats.save();
  return stats;
};

/**
 * Unlock achievements (badges). Simple + extendable.
 */
const unlockAchievements = async (userStats) => {
  const next = new Set(userStats.achievements || []);

  if (userStats.totalProblemsSolved >= 1) next.add('First Solve');
  if (userStats.totalProblemsSolved >= 10) next.add('10 Solves');
  if (userStats.totalProblemsSolved >= 50) next.add('50 Solves');

  if (userStats.currentStreak >= 3) next.add('3-Day Streak');
  if (userStats.currentStreak >= 7) next.add('7-Day Streak');
  if (userStats.currentStreak >= 30) next.add('30-Day Streak');

  if (userStats.level >= 5) next.add('Level 5');
  if (userStats.level >= 10) next.add('Level 10');

  const updated = Array.from(next);
  const changed =
    updated.length !== (userStats.achievements || []).length ||
    updated.some((a) => !(userStats.achievements || []).includes(a));

  if (changed) {
    userStats.achievements = updated;
    await userStats.save();
  }

  return userStats;
};

module.exports = {
  addXP,
  updateStreak,
  calculateLevel,
  unlockAchievements,
  normalizeDifficulty,
};

