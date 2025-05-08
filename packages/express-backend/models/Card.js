import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

/**
 * Card schema for year-based comparison game.
 */
export const cardSchema = {
  title: { type: String, required: true },
  year: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  sourceUrl: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

/**
 * Get database connection and cards collection.
 */
export async function getCardsCollection() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();

  const db = client.db();
  const collection = db.collection("cards");

  // Create indexes for query performance
  await ensureIndexes(collection);

  return { client, collection };
}

/**
 * Create database indexes if they don't exist.
 */
async function ensureIndexes(collection) {
  // Create indexes for common query patterns
  await collection.createIndexes([
    { key: { year: 1 }, name: "year_index" },
    { key: { category: 1 }, name: "category_index" },
    { key: { year: 1, category: 1 }, name: "year_category_index" }
  ]);
}

// If backward compatibility is needed
export default {
  cardSchema
};
