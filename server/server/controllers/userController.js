const User = require("../models/User");
const Analytics = require("../models/Analytics");

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error getting profile:", error);
    res.status(500).json({
      message: "Failed to get profile",
      error: error.message,
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { username } = req.body;

    // Validation
    if (!username) {
      return res.status(400).json({ message: "Please provide a username" });
    }

    // Check if username is taken by another user
    const existingUser = await User.findOne({
      username,
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { username },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const userEmail = req.user.email;
    console.log("Fetching stats for user:", userEmail);

    // Find the user's analytics record
    let analytics = await Analytics.findOne({ email: userEmail });
    console.log("Analytics record:-----------", analytics);

    if (!analytics) {
      // If no analytics record exists, create one
      analytics = await Analytics.create({
        email: userEmail,
        totalSamples: 0,
        humanVoiceCount: 0,
        aiVoiceCount: 0,
      });
    }
    // } else {
    //   // Use the updateCounts method to refresh the statistics
    //   await analytics.updateCounts(userEmail);
    // }

    // Return the stats
    res.status(200).json({
      totalSamples: analytics.totalSamples,
      humanVoiceCount: analytics.humanVoiceCount,
      aiVoiceCount: analytics.aiVoiceCount,
      lastUpdated: analytics.lastUpdated,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      message: "Failed to fetch user statistics",
      error: error.message,
    });
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Delete user's analytics
    await Analytics.findOneAndDelete({ email: userEmail });

    // Delete user
    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({
      message: "Failed to delete account",
      error: error.message,
    });
  }
};
