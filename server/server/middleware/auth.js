const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config");

exports.protect = async (req, res, next) => {
  let token;

  console.log("Request Headers:", req.headers); // Debugging line
  // Get token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Check if token exists
  if (!token) {
    return res
      .status(401)
      .json({ message: "Not authorized to access this route" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Find user by email
    const user = await User.findOne({ email: decoded.email }).select(
      "-password"
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Set user in request object
    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Not authorized to access this route" });
  }
};
