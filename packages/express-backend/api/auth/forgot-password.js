import { corsHandler } from "../_cors.js";
import { getUsersCollection } from "../../models/User.js";
import nodemailer from "nodemailer";

/**
 * Handle password reset request and send verification code.
 */
export default async function handler(req, res) {
  // Apply CORS headers and handle preflight
  if (corsHandler(req, res)) {
    return;
  }

  // Accept only POST method
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email } = req.body;

  // Validate required email parameter
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  let client;
  try {
    // Configure email transport
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Check if user exists
    const { client: dbClient, collection } = await getUsersCollection();
    client = dbClient;

    const user = await collection.findOne({ email });

    // For security, don't reveal if email exists
    if (!user) {
      return res.status(200).json({
        message:
          "If an account with this email exists, a reset code has been sent"
      });
    }

    // Generate verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Store code with 15-minute expiration
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
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) await client.close();
  }
}
