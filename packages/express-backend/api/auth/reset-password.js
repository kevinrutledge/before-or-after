import { corsHandler } from "../_cors.js";
import { getUsersCollection } from "../../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/**
 * Reset user password with valid token.
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

  const { email, resetToken, newPassword } = req.body;

  // Validate required parameters
  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate password strength
  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  let client;
  try {
    // Verify reset token validity
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    if (decoded.email !== email) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    // Get user collection
    const { client: dbClient, collection } = await getUsersCollection();
    client = dbClient;

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and remove reset code
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
  } finally {
    if (client) await client.close();
  }
}
