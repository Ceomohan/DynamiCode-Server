const mongoose = require('mongoose');

const friendSchema = mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicates in same direction
friendSchema.index({ requester: 1, receiver: 1 }, { unique: true });
friendSchema.index({ receiver: 1, status: 1, createdAt: -1 });
friendSchema.index({ requester: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Friend', friendSchema);

