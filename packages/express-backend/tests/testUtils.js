import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";

// Singleton MongoDB instance for tests
let mongoServer;
let mongoUri;

// Start in-memory MongoDB server
export async function startMemoryServer() {
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    process.env.MONGO_URI = mongoUri;
  }
  return mongoUri;
}

// Stop MongoDB server
export async function stopMemoryServer() {
  if (mongoServer) {
    await mongoServer.stop({ force: true });
    mongoServer = null;
    mongoUri = null;
    delete process.env.MONGO_URI;
  }
}

// Get current memory server URI
export function getMemoryServerUri() {
  return mongoUri;
}

// Get clean test database connection
export async function getTestDbConnection() {
  if (!mongoUri) {
    throw new Error(
      "Memory server not started. Call startMemoryServer() first."
    );
  }
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

// Mock rate limiter for tests
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

  // Use test secret if JWT_SECRET
  const secret = process.env.JWT_SECRET || "test-jwt-secret-key";

  return jwt.sign({ ...defaultPayload, ...payload }, secret, {
    expiresIn: "1h"
  });
};

// Create invalid token using random string
export const createInvalidToken = () => {
  return `invalid-token-${Math.random().toString(36)}`;
};
