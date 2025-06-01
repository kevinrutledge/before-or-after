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
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");

describe("Admin Loss GIFs API", () => {
  let app;
  let mongoServer;
  let mongoUri;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    // Create MongoDB memory server
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    process.env.MONGO_URI = mongoUri;
    process.env.JWT_SECRET = "test-secret";

    // Create tokens
    adminToken = jwt.sign(
      { email: "admin@test.com", role: "admin", id: "admin123" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    userToken = jwt.sign(
      { email: "user@test.com", role: "user", id: "user123" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Set up Express app with endpoint
    app = express();
    app.use(express.json());

    // Import and mount endpoint
    const adminLossGifsHandler = (await import("../api/admin/loss-gifs.js"))
      .default;
    app.use("/api/admin/loss-gifs", adminLossGifsHandler);
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

  test("rejects requests without authentication", async () => {
    const response = await request(app).get("/api/admin/loss-gifs");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Authentication required");
  });

  test("rejects non-admin users", async () => {
    const response = await request(app)
      .get("/api/admin/loss-gifs")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Admin access required");
  });

  test("lists loss GIFs for admin users", async () => {
    // Seed test data
    const { getLossGifsCollection } = await import("../models/LossGif.js");
    const { client, collection } = await getLossGifsCollection();

    await collection.insertMany([
      {
        category: "bad",
        scoreRange: "< 2",
        streakThreshold: 2,
        imageUrl: "https://example.com/bad.gif",
        createdAt: new Date()
      },
      {
        category: "frustrated",
        scoreRange: "2 - 4",
        streakThreshold: 5,
        imageUrl: "https://example.com/frustrated.gif",
        createdAt: new Date()
      }
    ]);

    await client.close();

    const response = await request(app)
      .get("/api/admin/loss-gifs")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].category).toBe("bad");
  });

  test("updates existing loss GIF", async () => {
    // Create test GIF first
    const { getLossGifsCollection } = await import("../models/LossGif.js");
    const { client, collection } = await getLossGifsCollection();

    const insertResult = await collection.insertOne({
      category: "decent",
      scoreRange: "5 - 7",
      streakThreshold: 8,
      imageUrl: "https://example.com/decent.gif",
      createdAt: new Date()
    });

    await client.close();

    const updateData = {
      category: "good",
      scoreRange: "8 - 11",
      streakThreshold: 10
    };

    const response = await request(app)
      .put(`/api/admin/loss-gifs/${insertResult.insertedId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.category).toBe("good");
    expect(response.body.scoreRange).toBe("8 - 11");
    expect(response.body.streakThreshold).toBe(10);
  });

  test("validates required fields for update", async () => {
    // Create test GIF first
    const { getLossGifsCollection } = await import("../models/LossGif.js");
    const { client, collection } = await getLossGifsCollection();

    const insertResult = await collection.insertOne({
      category: "test",
      scoreRange: "< 2",
      streakThreshold: 1,
      imageUrl: "https://example.com/test.gif",
      createdAt: new Date()
    });

    await client.close();

    const incompleteUpdate = {
      category: "test"
      // Missing required fields scoreRange and streakThreshold
    };

    const response = await request(app)
      .put(`/api/admin/loss-gifs/${insertResult.insertedId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(incompleteUpdate);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Missing required fields");
  });

  test("handles update of non-existent GIF", async () => {
    const { ObjectId } = await import("mongodb");
    const fakeId = new ObjectId();

    const updateData = {
      category: "fake",
      scoreRange: "0 - 1",
      streakThreshold: 1
    };

    const response = await request(app)
      .put(`/api/admin/loss-gifs/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Loss GIF not found");
  });

  test("rejects unsupported POST method", async () => {
    const newGif = {
      category: "ecstatic",
      scoreRange: ">= 12",
      streakThreshold: 15,
      imageUrl: "https://example.com/ecstatic.gif"
    };

    const response = await request(app)
      .post("/api/admin/loss-gifs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(newGif);

    expect(response.status).toBe(405);
    expect(response.body.message).toBe("Method not allowed");
  });

  test("rejects unsupported DELETE method", async () => {
    const { ObjectId } = await import("mongodb");
    const fakeId = new ObjectId();

    const response = await request(app)
      .delete(`/api/admin/loss-gifs/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(405);
    expect(response.body.message).toBe("Method not allowed");
  });
});
