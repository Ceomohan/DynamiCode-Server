const mongoose = require('mongoose');

const aiSettingsSchema = mongoose.Schema(
  {
    model: { type: String, default: 'llama-3.3-70b-versatile' },
    temperature: { type: Number, default: 0.7, min: 0, max: 2 },
    maxTokens: { type: Number, default: 2048, min: 256, max: 8192 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AiSettings', aiSettingsSchema);

