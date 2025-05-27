import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";
import path from "path";

let dirName;
try {
  dirName = __dirname || process.cwd();
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
  thumbnailUrl: { type: String, required: false },
  sourceUrl: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Connection pool management
let sharedClient = null;
let sharedMemoryServer = null;
let currentUri = null;

/**
 * Get database connection and cards collection with connection reuse.
 */
export async function getCardsCollection() {
  let uri = process.env.MONGO_URI;
  let memoryServer = null;

  // If MONGO_URI is not set, create an in-memory MongoDB server
  if (!uri) {
    if (!sharedMemoryServer) {
      sharedMemoryServer = await MongoMemoryServer.create();
    }
    uri = sharedMemoryServer.getUri();
    memoryServer = sharedMemoryServer;
  }

  // Reuse existing connection if URI matches and client is connected
  if (
    sharedClient &&
    currentUri === uri &&
    sharedClient.topology?.s?.state === "connected"
  ) {
    const db = sharedClient.db();
    const collection = db.collection("cards");

    // Return wrapper that doesn't close shared connection
    return {
      client: {
        close: async () => {
          // Mock close - don't close shared connection
        },
        topology: sharedClient.topology
      },
      collection,
      memoryServer
    };
  }

  // Close existing connection if URI changed
  if (sharedClient && currentUri !== uri) {
    await sharedClient.close();
    sharedClient = null;
  }

  sharedClient = new MongoClient(uri);
  currentUri = uri;

  await sharedClient.connect();

  const db = sharedClient.db();
  const collection = db.collection("cards");

  // Create indexes for query performance
  await ensureIndexes(collection);

  // Return wrapper that doesn't close shared connection
  return {
    client: {
      close: async () => {
        // Mock close - don't close shared connection
      },
      topology: sharedClient.topology
    },
    collection,
    memoryServer
  };
}

/**
 * Explicitly close shared connection (for test cleanup).
 */
export async function closeSharedConnection() {
  if (sharedClient) {
    await sharedClient.close();
    sharedClient = null;
    currentUri = null;
  }
  if (sharedMemoryServer) {
    await sharedMemoryServer.stop();
    sharedMemoryServer = null;
  }
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
