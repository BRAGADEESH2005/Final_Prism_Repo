const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  submitFeedback,
  getUserFeedback,
  getFeedbackStats,
  getAllFeedback,
} = require("../controllers/FeedbackController");

// Protect all feedback routes - require authentication
router.use(protect);

// Submit feedback
router.post("/", submitFeedback);

// Get user's feedback
router.get("/my-feedback", getUserFeedback);

// Get feedback statistics (could add admin middleware here)
router.get("/stats", getFeedbackStats);

// Get all feedback (admin only)
router.get("/all", protect, getAllFeedback);

module.exports = router;
