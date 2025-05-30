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
 * Loss GIF schema for score-based display selection.
 */
export const lossGifSchema = {
  category: { type: String, required: true },
  streakThreshold: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  thumbnailUrl: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Connection pool management
let sharedClient = null;
let sharedMemoryServer = null;
let currentUri = null;

/**
 * Get database connection and loss GIFs collection with connection reuse.
 */
export async function getLossGifsCollection() {
  let uri = process.env.MONGO_URI;
  let memoryServer = null;

  // Create in-memory MongoDB server when MONGO_URI not set
  if (!uri) {
    if (!sharedMemoryServer) {
      sharedMemoryServer = await MongoMemoryServer.create();
    }
    uri = sharedMemoryServer.getUri();
    memoryServer = sharedMemoryServer;
  }

  // Reuse existing connection when URI matches and client connected
  if (
    sharedClient &&
    currentUri === uri &&
    sharedClient.topology?.s?.state === "connected"
  ) {
    const db = sharedClient.db();
    const collection = db.collection("lossGifs");

    // Return wrapper preventing shared connection closure
    return {
      client: {
        close: async () => {
          // Mock close - preserve shared connection
        },
        topology: sharedClient.topology
      },
      collection,
      memoryServer
    };
  }

  // Close existing connection when URI changed
  if (sharedClient && currentUri !== uri) {
    await sharedClient.close();
    sharedClient = null;
  }

  sharedClient = new MongoClient(uri);
  currentUri = uri;

  await sharedClient.connect();

  const db = sharedClient.db();
  const collection = db.collection("lossGifs");

  // Create indexes for query performance
  await ensureIndexes(collection);

  // Return wrapper preventing shared connection closure
  return {
    client: {
      close: async () => {
        // Mock close - preserve shared connection
      },
      topology: sharedClient.topology
    },
    collection,
    memoryServer
  };
}

/**
 * Close shared connection explicitly for test cleanup.
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
 * Create database indexes when missing.
 */
async function ensureIndexes(collection) {
  // Create indexes for common query patterns
  await collection.createIndexes([
    { key: { streakThreshold: 1 }, name: "threshold_index" },
    { key: { category: 1 }, name: "category_index" },
    {
      key: { streakThreshold: 1, category: 1 },
      name: "threshold_category_index"
    }
  ]);
}

// Backward compatibility export
export default {
  lossGifSchema
};
