import express from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import {
  createUser,
  validateUser,
  validateUsername
} from "../../models/User.js";

const router = express.Router();

/**
 * Configure rate limiter for auth endpoints.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts, please try again after 15 minutes"
});

/**
 * Generate JWT auth token from user credentials.
 */
router.post("/login", authLimiter, async (req, res) => {
  const { emailOrUsername, password } = req.body;

  // Validate required credentials
  if (!emailOrUsername || !password) {
    return res
      .status(400)
      .json({ message: "Email/username and password required" });
  }

  try {
    // Validate user
    const result = await validateUser(emailOrUsername, password);

    if (!result.success) {
      return res.status(401).json({ message: result.message });
    }

    // Generate JWT token with user info and expiration
    const token = jwt.sign(
      {
        email: result.user.email,
        username: result.user.username,
        role: result.user.role,
        id: result.user._id.toString()
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Send token response
    res.json({
      token,
      user: {
        email: result.user.email,
        username: result.user.username,
        role: result.user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Register new user with email, username, and password.
 */
router.post("/signup", authLimiter, async (req, res) => {
  const { email, username, password } = req.body;

  // Validate required fields first
  if (!email?.trim() || !username?.trim() || !password?.trim()) {
    return res
      .status(400)
      .json({ message: "Email, username, and password required" });
  }

  // Password strength validation
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  // Basic email validation
  if (!email.includes("@") || email.length > 254) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Validate email structure and reject injection attempts
  const emailParts = email.split("@");
  const invalidChars = /[<>'"${}`;\\]/;
  if (
    emailParts.length !== 2 ||
    !emailParts[0] ||
    !emailParts[1] ||
    !emailParts[1].includes(".") ||
    emailParts[1].endsWith(".") ||
    invalidChars.test(email)
  ) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Validate username format
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return res.status(400).json({ message: usernameValidation.message });
  }

  try {
    // Create user with email, username, and password
    const result = await createUser(email, username, password);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully"
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
