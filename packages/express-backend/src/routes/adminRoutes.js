import express from "express";
import { verifyToken, adminOnly } from "../../middleware/auth.js";
import { getCardsCollection } from "../../models/Card.js";

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(verifyToken);
router.use(adminOnly);

/**
 * Get all cards with pagination.
 */
router.get("/cards", async (req, res) => {
  const { limit = 20, cursor } = req.query;
  let client;

  try {
    const { client: dbClient, collection } = await getCardsCollection();
    client = dbClient;

    const query = {};
    if (cursor) {
      query._id = { $gt: cursor };
    }

    const cards = await collection.find(query).limit(parseInt(limit)).toArray();

    res.json(cards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).json({ message: "Failed to fetch cards" });
  } finally {
    if (client) await client.close();
  }
});

/**
 * Create a new card.
 */
router.post("/cards", async (req, res) => {
  const { title, year, imageUrl, sourceUrl, category } = req.body;
  let client;

  // Validate required fields
  if (!title || !year || !imageUrl || !sourceUrl || !category) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const { client: dbClient, collection } = await getCardsCollection();
    client = dbClient;

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
    res.status(201).json({
      ...newCard,
      _id: result.insertedId
    });
  } catch (error) {
    console.error("Error creating card:", error);
    res.status(500).json({ message: "Failed to create card" });
  } finally {
    if (client) await client.close();
  }
});

export default router;
