import { corsHandler } from "../_cors.js";
import { updateUserScores, getUserScores } from "../../models/User.js";
import { verifyToken } from "../../middleware/auth.js";

/**
 * Update user scores in database.
 * Requires authentication and validates score values.
 */
export default async function handler(req, res) {
  if (corsHandler(req, res)) {
    return;
  }

  if (req.method !== "POST") {
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

  const { currentScore, highScore } = req.body;

  // Validate required score fields
  if (currentScore === undefined || highScore === undefined) {
    return res
      .status(400)
      .json({ message: "Current score and high score required" });
  }

  // Validate scores are integers without conversion
  if (
    !Number.isInteger(currentScore) ||
    !Number.isInteger(highScore) ||
    currentScore < 0 ||
    highScore < 0
  ) {
    return res
      .status(400)
      .json({ message: "Scores must be non-negative integers" });
  }

  // Validate high score is not less than current score
  if (highScore < currentScore) {
    return res
      .status(400)
      .json({ message: "High score cannot be less than current score" });
  }

  try {
    // Fetch current high score from DB
    const dbScores = await getUserScores(req.user.id);
    if (!dbScores) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only update if new highScore is greater than DB highScore
    let result = { success: true };
    if (highScore > dbScores.highScore) {
      result = await updateUserScores(req.user.id, currentScore, highScore);
    } else {
      // Optionally, you may want to update currentScore even if highScore doesn't change
      result = await updateUserScores(
        req.user.id,
        currentScore,
        dbScores.highScore
      );
    }

    if (!result.success) {
      return res.status(400).json({ message: "Failed to update scores" });
    }

    res.status(200).json({
      message: "Scores updated successfully",
      currentScore: currentScore,
      highScore: Math.max(highScore, dbScores.highScore)
    });
  } catch (error) {
    console.error("Score update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
