const mongoose = require('mongoose');

const userProgressSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      index: true,
    },
    topic: {
      type: String, // Or ObjectId if we want strict linking, keeping String for backward compat but will use ObjectId for new queries
      required: [true, 'Topic is required'],
      index: true,
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: ['Easy', 'Medium', 'Hard'],
    },
    solved: {
      type: Boolean,
      required: [true, 'Solved status is required'],
      default: false,
    },
    attempts: {
      type: Number,
      required: [true, 'Number of attempts is required'],
      min: 2,
    },
    timeTaken: {
      type: Number, // Time in seconds
      required: [true, 'Time taken is required'],
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
userProgressSchema.index({ userId: 1, topic: 1 });
userProgressSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('UserProgress', userProgressSchema);
