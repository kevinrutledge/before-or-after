import { corsHandler } from "../_cors.js";
import { getCardsCollection } from "../../models/Card.js";

export default async function handler(req, res) {
  if (corsHandler(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { previousYear, currentYear, guess } = req.body;

  if (previousYear === undefined || currentYear === undefined || !guess) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (guess !== "before" && guess !== "after") {
    return res
      .status(400)
      .json({ message: "Guess must be 'before' or 'after'" });
  }

  let client;
  try {
    // Determine if guess is correct
    const isAfter = currentYear > previousYear;
    const correct =
      (guess === "after" && isAfter) || (guess === "before" && !isAfter);

    // Get next card if guess is correct
    let nextCard = null;
    if (correct) {
      const { client: dbClient, collection } = await getCardsCollection();
      client = dbClient;
      [nextCard] = await collection
        .aggregate([{ $sample: { size: 1 } }])
        .toArray();
    }

    res.status(200).json({ correct, nextCard });
  } catch (error) {
    console.error("Process guess error:", error);
    res.status(500).json({ message: "Failed to process guess" });
  } finally {
    if (client) await client.close();
  }
}
