import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

let dirName;
try {
  dirName = path.dirname(fileURLToPath(import.meta.url));
} catch {
  dirName = process.cwd();
}

dotenv.config({ path: path.join(dirName, "../.env") });

/**
 * Card schema for year-based comparison game.
 */
export const cardSchema = {
  title: { type: String, required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
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
  let uri = process.env.MONGO_URI;
  let memoryServer;

  // If MONGO_URI is not set, create an in-memory MongoDB server
  if (!uri) {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log("Using MongoDB Memory Server:", uri);
  }

  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db();
  const collection = db.collection("cards");

  // Create indexes for query performance
  await ensureIndexes(collection);

  // Return the memory server so it can be closed later
  return { client, collection, memoryServer };
}

/**
 * Create database indexes if they don't exist.
 */
async function ensureIndexes(collection) {
  // Create indexes for common query patterns
  await collection.createIndexes([
    { key: { year: 1 }, name: "year_index" },
    { key: { category: 1 }, name: "category_index" },
    { key: { year: 1, category: 1 }, name: "year_category_index" },
    { key: { month: 1, category: 1 }, name: "month_category_index" }
  ]);
}

// If backward compatibility is needed
export default {
  cardSchema
};
