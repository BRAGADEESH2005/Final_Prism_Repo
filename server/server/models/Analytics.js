const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    ref: "User",
  },
  totalSamples: {
    type: Number,
    default: 0,
  },
  humanVoiceCount: {
    type: Number,
    default: 0,
  },
  aiVoiceCount: {
    type: Number,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Method to update counts
analyticsSchema.methods.updateCounts = async function (email) {
  try {
    const AudioSample = mongoose.model("AudioSample");

    // Get total samples count
    const totalSamples = await AudioSample.countDocuments({ email });

    // Get human voice count
    const humanVoiceCount = await AudioSample.countDocuments({
      email,
      classification: "human",
    });

    // Get AI voice count
    const aiVoiceCount = await AudioSample.countDocuments({
      email,
      classification: "ai",
    });

    // Update fields
    this.totalSamples = totalSamples;
    this.humanVoiceCount = humanVoiceCount;
    this.aiVoiceCount = aiVoiceCount;
    this.lastUpdated = Date.now();

    return this.save();
  } catch (error) {
    throw error;
  }
};

const Analytics = mongoose.model("Analytics", analyticsSchema);

module.exports = Analytics;
