import { corsHandler } from "./_cors.js";
import { getLeaderboard } from "../models/User.js";

/**
 * Fetch leaderboard data sorted by high score.
 * Public endpoint that returns top scores with usernames.
 */
export default async function handler(req, res) {
  if (corsHandler(req, res)) {
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { limit } = req.query;

    // Parse limit parameter with default and validation
    let parsedLimit = 10;
    if (limit) {
      parsedLimit = parseInt(limit);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res
          .status(400)
          .json({ message: "Limit must be between 1 and 100" });
      }
    }

    const leaderboard = await getLeaderboard(parsedLimit);

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
}
