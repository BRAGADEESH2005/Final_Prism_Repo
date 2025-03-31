const express = require("express");
const { protect } = require("../middleware/auth");
const userController = require("../controllers/userController");

const router = express.Router();

// Get user profile
router.get("/profile", protect, userController.getProfile);

// Update user profile
router.put("/profile", protect, userController.updateProfile);

// Get user statistics
router.get("/stats", protect, userController.getUserStats);

// Delete user account
router.delete("/account", protect, userController.deleteAccount);

module.exports = router;