const mongoose = require("mongoose");

const audioSampleSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,
    ref: "User",
  },
  filename: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
  },
  classification: {
    type: String,
    enum: ["human", "ai", "unclassified"],
    default: "unclassified",
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const AudioSample = mongoose.model("AudioSample", audioSampleSchema);

module.exports = AudioSample;
