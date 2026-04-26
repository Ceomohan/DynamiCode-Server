const mongoose = require('mongoose');

const topicSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Topic name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    icon: {
      type: String,
      default: 'Code', // Default Lucide icon name
    },
    description: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#3b82f6', // Default blue
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Topic', topicSchema);
