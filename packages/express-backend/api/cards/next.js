import { getCardsCollection } from "../../models/Card.js";

export default async function handler(req, res) {
  let client;
  try {
    const { client: dbClient, collection } = await getCardsCollection();
    client = dbClient;

    const [card] = await collection
      .aggregate([{ $sample: { size: 1 } }])
      .toArray();

    if (!card) {
      return res.status(404).json({ message: "No cards found in database" });
    }

    res.status(200).json(card);
  } catch (error) {
    console.error("Error retrieving card:", error);
    res.status(500).json({ message: "Failed to retrieve card" });
  } finally {
    if (client) await client.close();
  }
}
