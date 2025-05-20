import express from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { getUsersCollection } from "../../models/User.js";
import nodemailer from "nodemailer";

const router = express.Router();

/**
 * Configure email transporter.
 */
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Configure rate limiter for password reset endpoints.
 */
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 reset attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many password reset attempts, please try again later"
});

/**
 * Route to request password reset
 */
router.post("/forgot-password", resetLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Check if user exists
    const { client, collection } = await getUsersCollection();

    try {
      const user = await collection.findOne({ email });

      if (!user) {
        // For security, don't reveal whether email exists or not
        return res.status(200).json({
          message:
            "If an account with this email exists, a reset code has been sent"
        });
      }

      // Generate a random 6-digit verification code
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      // Store the code and expiration time (15 minutes)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await collection.updateOne(
        { email },
        {
          $set: {
            resetCode: verificationCode,
            resetCodeExpires: expiresAt
          }
        }
      );

      // Send email with verification code
      await transporter.sendMail({
        from: '"Before or After Game" <beforeoraftergame@gmail.com>',
        to: email,
        subject: "Your verification code",
        text: `Your Before or After verification code is: ${verificationCode}\n\nThis code will expire in 15 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #2563eb;">Before or After Game</h2>
            <p>Your verification code is: <strong style="font-size: 18px;">${verificationCode}</strong></p>
            <p>This code will expire in 15 minutes.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="font-size: 12px; color: #6b7280;">This is an automated message, please do not reply.</p>
          </div>
        `
      });

      return res.status(200).json({
        message:
          "If an account with this email exists, a reset code has been sent"
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Route to verify reset code
 */
router.post("/verify-code", resetLimiter, async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res
      .status(400)
      .json({ message: "Email and verification code are required" });
  }

  try {
    const { client, collection } = await getUsersCollection();

    try {
      const user = await collection.findOne({
        email,
        resetCode: code,
        resetCodeExpires: { $gt: new Date() }
      });

      if (!user) {
        return res
          .status(400)
          .json({ message: "Invalid or expired verification code" });
      }

      // Generate a temporary token for password reset
      const resetToken = jwt.sign(
        { id: user._id.toString(), email },
        process.env.JWT_SECRET,
        { expiresIn: "15m" } // Token expires in 15 minutes
      );

      return res.status(200).json({
        message: "Code verified successfully",
        resetToken
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error("Code verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Route to reset password
 */
router.post("/reset-password", resetLimiter, async (req, res) => {
  const { email, resetToken, newPassword } = req.body;

  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate password
  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    // Verify the reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    if (decoded.email !== email) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const { client, collection } = await getUsersCollection();

    try {
      // Hash the new password
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      const result = await collection.updateOne(
        { email },
        {
          $set: { password: hashedPassword },
          $unset: { resetCode: "", resetCodeExpires: "" }
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(400).json({ message: "Password reset failed" });
      }

      return res.status(200).json({ message: "Password reset successfully" });
    } finally {
      await client.close();
    }
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    console.error("Password reset error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
