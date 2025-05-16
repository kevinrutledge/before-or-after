import { corsHandler } from "../_cors.js";
import { getUsersCollection } from "../../models/User.js";
import jwt from "jsonwebtoken";

/**
 * Verify reset code and issue temporary reset token.
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

  const { email, code } = req.body;

  // Validate required parameters
  if (!email || !code) {
    return res
      .status(400)
      .json({ message: "Email and verification code are required" });
  }

  let client;
  try {
    // Find user with matching code
    const { client: dbClient, collection } = await getUsersCollection();
    client = dbClient;

    const user = await collection.findOne({
      email,
      resetCode: code,
      resetCodeExpires: { $gt: new Date() }
    });

    // Reject invalid or expired codes
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    // Generate temporary token for password reset
    const resetToken = jwt.sign(
      { id: user._id.toString(), email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      message: "Code verified successfully",
      resetToken
    });
  } catch (error) {
    console.error("Code verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) await client.close();
  }
}
