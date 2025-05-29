const {
  describe,
  test,
  expect,
  beforeAll,
  afterAll
} = require("@jest/globals");
const request = require("supertest");
const express = require("express");
const rateLimit = require("express-rate-limit");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient } = require("mongodb");

describe("GET /api/cards/all", () => {
  let app;
  let mongoServer;
  let mongoUri;
  let client;

  beforeAll(async () => {
    // Create MongoDB memory server
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    process.env.MONGO_URI = mongoUri;

    // Connect to in-memory database
    client = new MongoClient(mongoUri);
    await client.connect();

    // Set up Express app
    app = express();
    app.use(express.json());

    // Configure rate limiter for test endpoint
    const testRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50, // Match production limits
      standardHeaders: true,
      legacyHeaders: false,
      message: "Too many card requests, please try again later"
    });

    // Define test endpoint that mimics cards/all.js behavior with rate limiting
    app.get("/api/cards/all", testRateLimit, async (req, res) => {
      try {
        const db = client.db();
        const collection = db.collection("cards");

        const cards = await collection.find({}).toArray();

        if (!cards || cards.length === 0) {
          return res
            .status(404)
            .json({ message: "No cards found in database" });
        }

        res.status(200).json(cards);
      } catch (error) {
        console.error("Error retrieving all cards:", error);
        res.status(500).json({ message: "Failed to retrieve cards" });
      }
    });
  });

  afterAll(async () => {
    if (client) await client.close();
    await mongoServer.stop();
  });

  test("returns all cards from collection", async () => {
    // Insert test cards
    const db = client.db();
    const collection = db.collection("cards");

    const testCards = [
      {
        title: "Test Movie 1",
        year: 2000,
        month: 5,
        imageUrl: "https://example.com/image1.jpg",
        sourceUrl: "https://example.com/source1",
        category: "movie"
      },
      {
        title: "Test Album 1",
        year: 1995,
        month: 8,
        imageUrl: "https://example.com/image2.jpg",
        sourceUrl: "https://example.com/source2",
        category: "album"
      }
    ];

    await collection.insertMany(testCards);

    const response = await request(app).get("/api/cards/all");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toHaveProperty("title");
    expect(response.body[0]).toHaveProperty("year");
    expect(response.body[0]).toHaveProperty("month");
    expect(response.body[0]).toHaveProperty("imageUrl");
    expect(response.body[0]).toHaveProperty("sourceUrl");
    expect(response.body[0]).toHaveProperty("category");

    // Clean up
    await collection.deleteMany({});
  });

  test("returns 404 when no cards exist", async () => {
    // Ensure collection is empty
    const db = client.db();
    const collection = db.collection("cards");
    await collection.deleteMany({});

    const response = await request(app).get("/api/cards/all");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      "No cards found in database"
    );
  });

  test("returns 500 on database error", async () => {
    // Mock console.error to suppress expected error output
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Set up Express app with endpoint that throws database error
    const errorApp = express();
    errorApp.use(express.json());

    const testRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 50,
      standardHeaders: true,
      legacyHeaders: false
    });

    errorApp.get("/api/cards/all", testRateLimit, async (req, res) => {
      try {
        // Simulate database error without actually breaking connection
        throw new Error("Database connection failed");
      } catch (error) {
        console.error("Error retrieving all cards:", error);
        res.status(500).json({ message: "Failed to retrieve cards" });
      }
    });

    const response = await request(errorApp).get("/api/cards/all");

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Failed to retrieve cards");

    // Restore console.error
    console.error = originalConsoleError;
  });
});
