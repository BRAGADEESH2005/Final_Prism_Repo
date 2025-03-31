const User = require("../models/User");
const Analytics = require("../models/Analytics");
const jwt = require("jsonwebtoken");
const config = require("../config");

// Generate JWT token
const generateToken = (email) => {
  return jwt.sign({ email }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

// Register user
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    console.log("Registering user:", username, email, password); // Debugging line

    // Check if all fields are provided
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already in use" });
      }
      return res.status(400).json({ message: "Username already taken" });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    // Create analytics record for new user
    await Analytics.create({
      email: user.email,
    });

    // Generate token
    const token = generateToken(user.email);
    const refreshToken = generateToken(user.email); // In a real app, use different secret and longer expiry

    // Send response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // Find user
    const user = await User.findOne({ email });

    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user.email);
    const refreshToken = generateToken(user.email); // In a real app, use different secret and longer expiry

    // Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getCurrentUser = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout user
exports.logout = async (req, res, next) => {
  try {
    // In a real implementation, you would invalidate the token
    // For now, we just return success message
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};
