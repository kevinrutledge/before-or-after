import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

/**
 * Generate JWT auth token from user credentials.
 *
 * @param req - Request with email/password in body.
 * @param res - Response returning token on success.
 */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Validate required credentials
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  // Accept any credentials for MVP

  // Generate JWT token with user info and expiration
  const token = jwt.sign(
    {
      email
      // Add additional claims as needed
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h" // Token expires in 24 hours
    }
  );

  // Send token response
  res.json({ token });
});

export default router;
