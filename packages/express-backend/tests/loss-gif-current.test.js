const {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach
} = require("@jest/globals");
const request = require("supertest");
const express = require("express");
const { MongoMemoryServer } = require("mongodb-memory-server");

describe("GET /api/loss-gifs/current", () => {
  let app;
  let mongoServer;
  let mongoUri;

  beforeAll(async () => {
    // Create MongoDB memory server
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    process.env.MONGO_URI = mongoUri;

    // Set up Express app with endpoint
    app = express();
    app.use(express.json());

    // Import and mount the endpoint
    const lossGifsCurrentHandler = (await import("../api/loss-gifs/current.js"))
      .default;
    app.get("/api/loss-gifs/current", lossGifsCurrentHandler);
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
    // Seed test data before each test
    const { getLossGifsCollection } = await import("../models/LossGif.js");
    const { client, collection } = await getLossGifsCollection();

    await collection.deleteMany({});

    const testGifs = [
      {
        category: "bad",
        streakThreshold: 2,
        imageUrl: "https://example.com/bad.gif",
        createdAt: new Date()
      },
      {
        category: "frustrated",
        streakThreshold: 5,
        imageUrl: "https://example.com/frustrated.gif",
        createdAt: new Date()
      },
      {
        category: "decent",
        streakThreshold: 8,
        imageUrl: "https://example.com/decent.gif",
        createdAt: new Date()
      }
    ];

    await collection.insertMany(testGifs);
    await client.close();
  });

  test("returns appropriate GIF for low score", async () => {
    const response = await request(app).get("/api/loss-gifs/current?score=1");

    expect(response.status).toBe(200);
    expect(response.body.category).toBe("bad");
    expect(response.body.streakThreshold).toBe(2);
  });

  test("returns appropriate GIF for medium score", async () => {
    const response = await request(app).get("/api/loss-gifs/current?score=3");

    expect(response.status).toBe(200);
    expect(response.body.category).toBe("frustrated");
    expect(response.body.streakThreshold).toBe(5);
  });

  test("returns appropriate GIF for higher score", async () => {
    const response = await request(app).get("/api/loss-gifs/current?score=6");

    expect(response.status).toBe(200);
    expect(response.body.category).toBe("decent");
    expect(response.body.streakThreshold).toBe(8);
  });

  test("requires score parameter", async () => {
    const response = await request(app).get("/api/loss-gifs/current");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Score parameter required");
  });

  test("validates score parameter format", async () => {
    const response = await request(app).get(
      "/api/loss-gifs/current?score=invalid"
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Valid score parameter required");
  });

  test("rejects negative score values", async () => {
    const response = await request(app).get("/api/loss-gifs/current?score=-1");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Valid score parameter required");
  });

  test("handles no qualifying GIFs found", async () => {
    const response = await request(app).get("/api/loss-gifs/current?score=10");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No loss GIF found for score");
  });

  test("selects lowest qualifying threshold", async () => {
    // Add GIF with higher threshold
    const { getLossGifsCollection } = await import("../models/LossGif.js");
    const { client, collection } = await getLossGifsCollection();

    await collection.insertOne({
      category: "satisfied",
      streakThreshold: 12,
      imageUrl: "https://example.com/satisfied.gif",
      createdAt: new Date()
    });

    await client.close();

    const response = await request(app).get("/api/loss-gifs/current?score=4");

    expect(response.status).toBe(200);
    expect(response.body.category).toBe("frustrated");
    expect(response.body.streakThreshold).toBe(5);
  });
});
