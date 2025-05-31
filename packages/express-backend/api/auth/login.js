import { corsHandler } from "../_cors.js";
import { validateUser } from "../../models/User.js";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (corsHandler(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res
      .status(400)
      .json({ message: "Email/username and password required" });
  }

  try {
    const result = await validateUser(emailOrUsername, password);

    if (!result.success) {
      return res.status(401).json({ message: result.message });
    }

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

    res.status(200).json({
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
}
