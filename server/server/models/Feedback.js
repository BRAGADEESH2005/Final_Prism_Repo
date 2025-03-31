const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  originalClassification: {
    type: String,
    enum: ["bonafide", "spoof", "Non speech"],
    required: true,
  },
  userFeedback: {
    type: String,
    enum: ["correct", "incorrect"],
    required: true,
  },
  correctClassification: {
    type: String,
    required: function () {
      return this.userFeedback === "incorrect";
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
