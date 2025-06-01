import { corsHandler } from "../_cors.js";
import { createUser, validateUsername } from "../../models/User.js";

export default async function handler(req, res) {
  if (corsHandler(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, username, password } = req.body;

  // Validate username format first when present
  if (username !== undefined) {
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({ message: usernameValidation.message });
    }
  }

  // Validate required fields after format validation
  if (!email || !username || !password) {
    return res
      .status(400)
      .json({ message: "Email, username, and password required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    const result = await createUser(email, username, password);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res
      .status(201)
      .json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
