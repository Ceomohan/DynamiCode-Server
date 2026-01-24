const mongoose = require('mongoose');

const leaderboardSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    xp: {
      type: Number,
      required: true,
      default: 0,
      index: true,
      min: 0,
    },
    level: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    totalSolved: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    rank: {
      type: Number,
      default: null,
      index: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Primary ranking index
leaderboardSchema.index({ xp: -1, totalSolved: -1, updatedAt: 1 });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);

