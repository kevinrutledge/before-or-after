import { corsHandler } from "../_cors.js";
import { getLossGifsCollection } from "../../models/LossGif.js";
import rateLimit from "express-rate-limit";

// Configure rate limiter for loss GIF endpoint
const lossGifRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many loss GIF requests, please try again later"
});

/**
 * Fetch loss GIF matching user score threshold.
 * Return single GIF appropriate for score value.
 */
export default async function handler(req, res) {
  if (corsHandler(req, res)) {
    return;
  }

  // Apply rate limiting
  lossGifRateLimit(req, res, async () => {
    let client;
    try {
      const { score } = req.query;

      // Validate score parameter exists
      if (score === undefined || score === null) {
        return res.status(400).json({ message: "Score parameter required" });
      }

      // Parse score as integer
      const userScore = parseInt(score, 10);
      if (isNaN(userScore) || userScore < 0) {
        return res
          .status(400)
          .json({ message: "Valid score parameter required" });
      }

      const { client: dbClient, collection } = await getLossGifsCollection();
      client = dbClient;

      // Find GIFs where user score qualifies for threshold
      const qualifyingGifs = await collection
        .find({ streakThreshold: { $gt: userScore } })
        .sort({ streakThreshold: 1 })
        .toArray();

      // Select GIF from lowest qualifying threshold
      if (qualifyingGifs.length === 0) {
        return res.status(404).json({ message: "No loss GIF found for score" });
      }

      // Return first GIF from lowest threshold category
      const selectedGif = qualifyingGifs[0];
      res.status(200).json(selectedGif);
    } catch (error) {
      console.error("Error retrieving loss GIF:", error);
      res.status(500).json({ message: "Failed to retrieve loss GIF" });
    } finally {
      if (client) await client.close();
    }
  });
}
