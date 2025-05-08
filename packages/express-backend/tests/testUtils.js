import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

// Singleton MongoDB instance for tests
let mongoServer;
let mongoUri;

// Start in-memory MongoDB server
export async function startMemoryServer() {
  mongoServer = await MongoMemoryServer.create();
  mongoUri = mongoServer.getUri();
  process.env.MONGO_URI = mongoUri;
  return mongoUri;
}

// Stop MongoDB server
export async function stopMemoryServer() {
  if (mongoServer) {
    await mongoServer.stop();
  }
}

// Get clean test database connection
export async function getTestDbConnection() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  return { client, db: client.db() };
}

// Clear all collections between tests
export async function clearDatabase() {
  const { client, db } = await getTestDbConnection();
  const collections = await db.collections();

  for (const collection of collections) {
    await collection.deleteMany({});
  }

  await client.close();
}
