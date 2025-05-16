import express from "express";
import rateLimit from "express-rate-limit";
import { verifyToken, adminOnly } from "../../middleware/auth.js";
import { getCardsCollection } from "../../models/Card.js";
import { ObjectId } from "mongodb";

const router = express.Router();

/**
 * Configure rate limiter for admin routes.
 */
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again after 15 minutes"
});

// Apply middleware to all admin routes
router.use(adminRateLimiter);
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
      // Convert string cursor to ObjectId
      query._id = { $gt: new ObjectId(cursor) };
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
