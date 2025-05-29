const {
  describe,
  test,
  expect,
  beforeAll,
  afterAll
} = require("@jest/globals");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient } = require("mongodb");
const { getRandomCard } = require("./mocks/cardService.js");

describe("Random Card Selection", () => {
  let mongoServer;
  let mongoUri;
  let mongoClient;

  beforeAll(async () => {
    // Create a single MongoDB Memory Server instance
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();

    // Store original MONGO_URI to restore later
    const originalUri = process.env.MONGO_URI;
    process.env.MONGO_URI = mongoUri;

    // Connect directly to seed data
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    const db = mongoClient.db();
    const collection = db.collection("cards");

    // Insert sample card data
    const sampleCards = Array.from({ length: 10 }, (_, i) => ({
      title: `Test Card ${i}`,
      year: 1990 + i,
      category: i % 2 === 0 ? "movie" : "album",
      imageUrl: "https://example.com/test.jpg",
      sourceUrl: "https://example.com",
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await collection.insertMany(sampleCards);

    // Restore original URI if it was set
    if (originalUri) {
      process.env.MONGO_URI = originalUri;
    }
  });

  afterAll(async () => {
    // Close client and stop memory server
    if (mongoClient) await mongoClient.close();
    if (mongoServer) await mongoServer.stop();
  });

  test("getRandomCard returns different cards on multiple calls", async () => {
    // Use the mongoUri directly that ensures successful database query
    const originalUri = process.env.MONGO_URI;
    process.env.MONGO_URI = mongoUri;

    try {
      // Get multiple random cards
      const results = new Set();

      for (let i = 0; i < 10; i++) {
        const card = await getRandomCard();
        if (card) {
          // Use both title and year to identify unique cards
          results.add(`${card.title}_${card.year}`);
        }
      }

      // With 10 cards in seed data, we should get at least 3 different cards
      // in 10 attempts if randomization works correctly
      expect(results.size).toBeGreaterThan(2);
    } finally {
      // Restore original URI if it was set
      if (originalUri) {
        process.env.MONGO_URI = originalUri;
      }
    }
  });
});
