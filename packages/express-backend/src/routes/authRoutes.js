import express from "express";
import jwt from "jsonwebtoken";
import { createUser, validateUser } from "../../models/User.js";

const router = express.Router();

/**
 * Generate JWT auth token from user credentials.
 */
router.post("/login", async (req, res) => {
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
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
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
