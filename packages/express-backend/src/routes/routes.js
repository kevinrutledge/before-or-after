import express from "express";
import { getRandomCard, processGuess } from "../services/cardService.js";

const router = express.Router();

/**
 * Retrieve random card for gameplay.
 */
router.get("/cards/next", async (req, res) => {
  try {
    const card = await getRandomCard();

    if (!card) {
      return res.status(404).json({ message: "No cards found in database" });
    }

    res.json(card);
  } catch (error) {
    console.error("Error retrieving card:", error);
    res.status(500).json({ message: "Failed to retrieve card" });
  }
});

/**
 * Process user's before/after guess and return result.
 */
router.post("/cards/guess", async (req, res) => {
  try {
    const { previousYear, currentYear, guess } = req.body;

    // Validate required fields
    if (previousYear === undefined || currentYear === undefined || !guess) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate guess value
    if (guess !== "before" && guess !== "after") {
      return res
        .status(400)
        .json({ message: "Guess must be 'before' or 'after'" });
    }

    // Process the guess
    const result = await processGuess(previousYear, currentYear, guess);

    res.json(result);
  } catch (error) {
    console.error("Error processing guess:", error);
    res.status(500).json({ message: "Failed to process guess" });
  }
});

export default router;
