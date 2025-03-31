const express = require("express");
const {
  register,
  login,
  getCurrentUser,
  logout,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Register user
router.post("/register", register);

// Login user
router.post("/login", login);

// Get current user
router.get("/me", protect, getCurrentUser);

// Logout user
router.post("/logout", protect, logout);

module.exports = router;
