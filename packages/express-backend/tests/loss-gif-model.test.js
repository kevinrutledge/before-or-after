const {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach
} = require("@jest/globals");
const { MongoMemoryServer } = require("mongodb-memory-server");

describe("LossGif Model", () => {
  let mongoServer;
  let mongoUri;

  beforeAll(async () => {
    // Create MongoDB memory server
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    process.env.MONGO_URI = mongoUri;
  });

  afterAll(async () => {
    // Close shared connections before stopping server
    const { closeSharedConnection } = await import("../models/LossGif.js");
    await closeSharedConnection();

    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear database before each test
    const { getLossGifsCollection } = await import("../models/LossGif.js");
    const { client, collection } = await getLossGifsCollection();
    await collection.deleteMany({});
    await client.close();
  });

  test("establishes connection and creates indexes", async () => {
    const { getLossGifsCollection } = await import("../models/LossGif.js");

    const { client, collection } = await getLossGifsCollection();

    // Verify connection established
    expect(client).toBeDefined();
    expect(collection).toBeDefined();

    // Verify indexes created
    const indexes = await collection.indexes();
    const indexNames = indexes.map((index) => index.name);

    expect(indexNames).toContain("threshold_index");
    expect(indexNames).toContain("category_index");
    expect(indexNames).toContain("threshold_category_index");

    await client.close();
  });

  test("stores and retrieves loss GIF records", async () => {
    const { getLossGifsCollection } = await import("../models/LossGif.js");

    const { client, collection } = await getLossGifsCollection();

    // Insert test record
    const testGif = {
      category: "frustrated",
      streakThreshold: 5,
      imageUrl: "https://example.com/frustrated.gif",
      thumbnailUrl: "https://example.com/frustrated-thumb.gif",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await collection.insertOne(testGif);
    expect(insertResult.insertedId).toBeDefined();

    // Retrieve record
    const retrieved = await collection.findOne({
      _id: insertResult.insertedId
    });

    expect(retrieved.category).toBe("frustrated");
    expect(retrieved.streakThreshold).toBe(5);
    expect(retrieved.imageUrl).toBe("https://example.com/frustrated.gif");

    await client.close();
  });

  test("handles threshold-based queries efficiently", async () => {
    const { getLossGifsCollection } = await import("../models/LossGif.js");

    const { client, collection } = await getLossGifsCollection();

    // Insert test data with different thresholds
    const testGifs = [
      { category: "bad", streakThreshold: 2, imageUrl: "bad.gif" },
      {
        category: "frustrated",
        streakThreshold: 5,
        imageUrl: "frustrated.gif"
      },
      { category: "decent", streakThreshold: 8, imageUrl: "decent.gif" }
    ];

    await collection.insertMany(testGifs);

    // Query for GIFs with threshold > 3
    const results = await collection
      .find({ streakThreshold: { $gt: 3 } })
      .sort({ streakThreshold: 1 })
      .toArray();

    expect(results).toHaveLength(2);
    expect(results[0].category).toBe("frustrated");
    expect(results[1].category).toBe("decent");

    await client.close();
  });
});
