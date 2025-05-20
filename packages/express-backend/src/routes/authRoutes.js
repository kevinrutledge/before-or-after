import express from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { createUser, validateUser } from "../../models/User.js";

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
  const { email, password } = req.body;

  // Validate required credentials
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    // Validate user
    const result = await validateUser(email, password);

    if (!result.success) {
      return res.status(401).json({ message: result.message });
    }

    // Generate JWT token with user info and expiration
    const token = jwt.sign(
      {
        email: result.user.email,
        role: result.user.role,
        id: result.user._id.toString()
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h"
      }
    );

    // Send token response
    res.json({
      token,
      user: {
        email: result.user.email,
        role: result.user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Register a new user.
 */
router.post("/signup", authLimiter, async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  // Basic email validation
  if (!email.includes("@") || email.length > 254) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Check if email is already registered
  const emailParts = email.split("@");
  if (
    emailParts.length !== 2 ||
    !emailParts[0] ||
    !emailParts[1] ||
    !emailParts[1].includes(".") ||
    emailParts[1].endsWith(".")
  ) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Password strength validation
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    // Create the user
    const result = await createUser(email, password);

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
