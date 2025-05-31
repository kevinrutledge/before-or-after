import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";

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
    mongoServer = null;
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

  try {
    const collections = await db.collections();

    for (const collection of collections) {
      await collection.deleteMany({});
    }
  } finally {
    await client.close();
  }
}

// Pass through middleware satisfying security scanners
export const testRateLimit = (req, res, next) => {
  next();
};

// Create valid JWT token with default test payload
export const createTestToken = (payload = {}) => {
  const defaultPayload = {
    email: "test@example.com",
    role: "user",
    id: "507f1f77bcf86cd799439011"
  };

  return jwt.sign({ ...defaultPayload, ...payload }, process.env.JWT_SECRET, {
    expiresIn: "1h"
  });
};

// Create invalid token using random string
export const createInvalidToken = () => {
  return `invalid-token-${Math.random().toString(36)}`;
};
