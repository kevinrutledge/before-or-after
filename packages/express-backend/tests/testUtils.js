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

// Apply basic rate limiting for test endpoints
export const testRateLimit = (req, res, next) => {
  const requestCounts = new Map();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100;

  const clientId = req.ip || "test-client";
  const now = Date.now();

  if (!requestCounts.has(clientId)) {
    requestCounts.set(clientId, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const clientData = requestCounts.get(clientId);

  if (now > clientData.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (clientData.count >= maxRequests) {
    return res.status(429).json({ message: "Too many requests" });
  }

  clientData.count++;
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
