import { corsHandler } from "../_cors.js";
import { getCardsCollection } from "../../models/Card.js";
import { verifyToken, adminOnly } from "../../middleware/auth.js";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (corsHandler(req, res)) {
    return;
  }

  // Use existing auth middleware
  try {
    await new Promise((resolve, reject) => {
      verifyToken(req, res, (err) => (err ? reject(err) : resolve()));
    });

    await new Promise((resolve, reject) => {
      adminOnly(req, res, (err) => (err ? reject(err) : resolve()));
    });
  } catch {
    return; // Middleware already sent error response
  }

  let client;
  try {
    const { client: dbClient, collection } = await getCardsCollection();
    client = dbClient;

    if (req.method === "GET") {
      const { limit = 20, cursor } = req.query;
      const query = {};

      if (cursor) {
        query._id = { $gt: new ObjectId(cursor) };
      }

      const cards = await collection
        .find(query)
        .limit(parseInt(limit))
        .toArray();
      res.status(200).json(cards);
    } else if (req.method === "POST") {
      const { title, year, imageUrl, sourceUrl, category } = req.body;

      if (!title || !year || !imageUrl || !sourceUrl || !category) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const newCard = {
        title,
        year: parseInt(year),
        imageUrl,
        sourceUrl,
        category,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(newCard);
      res.status(201).json({ ...newCard, _id: result.insertedId });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Admin cards error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (client) await client.close();
  }
}
