import express from "express";

const router = express.Router();

/**
 * Generate auth token from user credentials.
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

  // Generate base64 token
  const token = Buffer.from(`${email}:${Date.now()}`).toString("base64");

  // Send token response
  res.json({ token });
});

export default router;
