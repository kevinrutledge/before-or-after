import { corsHandler } from "../_cors.js";
import { verifyToken } from "../../middleware/auth.js";
import { getUserScores } from "../../models/User.js";

export default async function handler(req, res) {
  if (corsHandler(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Verify authentication token
  try {
    await new Promise((resolve, reject) => {
      verifyToken(req, res, (err) => (err ? reject(err) : resolve()));
    });
  } catch {
    return; // Middleware already sent error response
  }

  try {
    const scores = await getUserScores(req.user.id);
    if (!scores) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(scores);
  } catch (error) {
    console.error("Fetch user scores error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}