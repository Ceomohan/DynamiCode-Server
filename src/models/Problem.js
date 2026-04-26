const mongoose = require('mongoose');

const problemSchema = mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    constraints: { type: [String], default: [] },
    inputFormat: { type: String, default: '' },
    outputFormat: { type: String, default: '' },
    examples: {
      type: [
        {
          input: String,
          output: String,
          explanation: String,
        },
      ],
      default: [],
    },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true, index: true },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

problemSchema.index({ createdAt: -1, difficulty: 1, topic: 1 });

module.exports = mongoose.model('Problem', problemSchema);

