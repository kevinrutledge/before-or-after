import { corsHandler } from "../_cors.js";
import { getCardsCollection } from "../../models/Card.js";

/**
 * Fetch all cards for deck initialization.
 * Return complete card collection without pagination.
 */
export default async function handler(req, res) {
  if (corsHandler(req, res)) {
    return;
  }

  let client;
  try {
    const { client: dbClient, collection } = await getCardsCollection();
    client = dbClient;

    // Fetch all cards from collection
    const cards = await collection.find({}).toArray();

    if (!cards || cards.length === 0) {
      return res.status(404).json({ message: "No cards found in database" });
    }

    res.status(200).json(cards);
  } catch (error) {
    console.error("Error retrieving all cards:", error);
    res.status(500).json({ message: "Failed to retrieve cards" });
  } finally {
    if (client) await client.close();
  }
}
