const Feedback = require("../models/Feedback");

// Submit feedback
exports.submitFeedback = async (req, res) => {
  try {
    const {
      fileName,
      originalClassification,
      userFeedback,
      correctClassification,
    } = req.body;

    console.log("Received feedback:", req.body);

    // Validate required fields
    if (!fileName || !originalClassification || !userFeedback) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Get user email from authenticated request
    const email = req.user.email;

    // Create feedback entry
    const feedback = await Feedback.create({
      email,
      fileName,
      originalClassification,
      userFeedback,
      correctClassification,
    });

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
      error: error.message,
    });
  }
};

// Get user's feedback submissions
exports.getUserFeedback = async (req, res) => {
  try {
    const email = req.user.email;

    // Get feedback submissions for this user
    const feedback = await Feedback.find({ email })
      .sort({ timestamp: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback,
    });
  } catch (error) {
    console.error("Error getting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get feedback data",
      error: error.message,
    });
  }
};

// Get feedback statistics (admin only)
exports.getFeedbackStats = async (req, res) => {
  try {
    // Check if user is admin (you might need to implement this check)

    // Get overall statistics
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: "$originalClassification",
          total: { $sum: 1 },
          correct: {
            $sum: {
              $cond: [{ $eq: ["$userFeedback", "correct"] }, 1, 0],
            },
          },
          incorrect: {
            $sum: {
              $cond: [{ $eq: ["$userFeedback", "incorrect"] }, 1, 0],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting feedback stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get feedback statistics",
      error: error.message,
    });
  }
};

// Get all feedback (admin only)
exports.getAllFeedback = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.email !== "22z214@psgtech.ac.in") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
    }

    // Get all feedback entries
    const feedback = await Feedback.find().sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback,
    });
  } catch (error) {
    console.error("Error getting all feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get feedback data",
      error: error.message,
    });
  }
};
