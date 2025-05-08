import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

/**
 * Define Card schema for year-based comparison game.
 */
const cardSchema = {
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

  return { client, collection }; // for proper closure
}

export default {
  cardSchema
};
