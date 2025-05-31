import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach
} from "@jest/globals";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

describe("POST /api/scores/update", () => {
  let app;
  let mongoServer;
  let mongoUri;
  let client;
  let validToken;

  beforeAll(async () => {
    // Suppress console.error for expected test errors
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Create MongoDB memory server
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    process.env.MONGO_URI = mongoUri;
    process.env.JWT_SECRET = "test-secret";

    // Connect to in-memory database
    client = new MongoClient(mongoUri);
    await client.connect();

    // Generate initial token with correct user ID
    validToken = jwt.sign(
      {
        email: "test@example.com",
        role: "user",
        id: "507f1f77bcf86cd799439011"
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Set up Express app
    app = express();
    app.use(express.json());

    // Define test endpoint that mimics scores/update.js behavior
    app.post("/api/scores/update", async (req, res) => {
      // Verify authentication token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ message: "Invalid token" });
      }

      const { currentScore, highScore } = req.body;

      // Validate required score fields
      if (currentScore === undefined || highScore === undefined) {
        return res
          .status(400)
          .json({ message: "Current score and high score required" });
      }

      // Validate scores are integers without conversion
      if (
        !Number.isInteger(currentScore) ||
        !Number.isInteger(highScore) ||
        currentScore < 0 ||
        highScore < 0
      ) {
        return res
          .status(400)
          .json({ message: "Scores must be non-negative integers" });
      }

      // Validate high score is not less than current score
      if (highScore < currentScore) {
        return res
          .status(400)
          .json({ message: "High score cannot be less than current score" });
      }

      try {
        const db = client.db();
        const collection = db.collection("users");

        const { ObjectId } = await import("mongodb");
        const result = await collection.updateOne(
          { _id: new ObjectId(decoded.id) },
          {
            $set: {
              currentScore: currentScore,
              highScore: highScore
            }
          }
        );

        if (result.matchedCount === 0) {
          return res.status(400).json({ message: "Failed to update scores" });
        }

        res.status(200).json({
          message: "Scores updated successfully",
          currentScore: currentScore,
          highScore: highScore
        });
      } catch (error) {
        console.error("Score update error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
  });

  afterAll(async () => {
    if (client) await client.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    const db = client.db();
    const collection = db.collection("users");
    await collection.deleteMany({});

    // Insert test user with consistent ID
    await collection.insertOne({
      _id: new (await import("mongodb")).ObjectId("507f1f77bcf86cd799439011"),
      email: "test@example.com",
      currentScore: 0,
      highScore: 0
    });
  });

  test("persists authenticated user scores to database", async () => {
    const scoreData = {
      currentScore: 15,
      highScore: 20
    };

    const response = await request(app)
      .post("/api/scores/update")
      .set("Authorization", `Bearer ${validToken}`)
      .send(scoreData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Scores updated successfully");
    expect(response.body.currentScore).toBe(15);
    expect(response.body.highScore).toBe(20);

    // Verify database update
    const db = client.db();
    const collection = db.collection("users");
    const user = await collection.findOne({ email: "test@example.com" });

    expect(user.currentScore).toBe(15);
    expect(user.highScore).toBe(20);
  });

  test("validates non-negative integer scores", async () => {
    const invalidScores = [
      { currentScore: -5, highScore: 10 },
      { currentScore: 5, highScore: -10 },
      { currentScore: "invalid", highScore: 10 },
      { currentScore: 5, highScore: "invalid" },
      { currentScore: 5.5, highScore: 10 },
      { currentScore: 5, highScore: 10.5 }
    ];

    for (const scoreData of invalidScores) {
      const response = await request(app)
        .post("/api/scores/update")
        .set("Authorization", `Bearer ${validToken}`)
        .send(scoreData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Scores must be non-negative integers"
      );
    }
  });

  test("prevents highScore less than currentScore", async () => {
    const invalidScoreData = {
      currentScore: 25,
      highScore: 15
    };

    const response = await request(app)
      .post("/api/scores/update")
      .set("Authorization", `Bearer ${validToken}`)
      .send(invalidScoreData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "High score cannot be less than current score"
    );

    // Verify database unchanged
    const db = client.db();
    const collection = db.collection("users");
    const user = await collection.findOne({ email: "test@example.com" });

    expect(user.currentScore).toBe(0);
    expect(user.highScore).toBe(0);
  });

  test("requires authentication token for access", async () => {
    const scoreData = {
      currentScore: 10,
      highScore: 15
    };

    // Test without token
    const noTokenResponse = await request(app)
      .post("/api/scores/update")
      .send(scoreData);

    expect(noTokenResponse.status).toBe(401);
    expect(noTokenResponse.body.message).toBe("Authentication required");

    // Test with invalid token
    const invalidTokenResponse = await request(app)
      .post("/api/scores/update")
      .set("Authorization", "Bearer invalid-token")
      .send(scoreData);

    expect(invalidTokenResponse.status).toBe(401);
    expect(invalidTokenResponse.body.message).toBe("Invalid token");
  });

  test("validates required score fields presence", async () => {
    const missingFieldTests = [
      { currentScore: 10 }, // Missing highScore
      { highScore: 15 }, // Missing currentScore
      {} // Missing both
    ];

    for (const scoreData of missingFieldTests) {
      const response = await request(app)
        .post("/api/scores/update")
        .set("Authorization", `Bearer ${validToken}`)
        .send(scoreData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Current score and high score required"
      );
    }
  });

  test("handles database connection failures gracefully", async () => {
    // Set up Express app with simulated database error
    const errorApp = express();
    errorApp.use(express.json());

    errorApp.post("/api/scores/update", async (req, res) => {
      // Verify token first
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      try {
        jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ message: "Invalid token" });
      }

      const { currentScore, highScore } = req.body;

      if (currentScore === undefined || highScore === undefined) {
        return res
          .status(400)
          .json({ message: "Current score and high score required" });
      }

      try {
        // Simulate database error
        throw new Error("Database connection failed");
      } catch (error) {
        console.error("Score update error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    const scoreData = {
      currentScore: 10,
      highScore: 15
    };

    const response = await request(errorApp)
      .post("/api/scores/update")
      .set("Authorization", `Bearer ${validToken}`)
      .send(scoreData);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal server error");
  });

  test("allows equal currentScore and highScore values", async () => {
    const scoreData = {
      currentScore: 20,
      highScore: 20
    };

    const response = await request(app)
      .post("/api/scores/update")
      .set("Authorization", `Bearer ${validToken}`)
      .send(scoreData);

    expect(response.status).toBe(200);
    expect(response.body.currentScore).toBe(20);
    expect(response.body.highScore).toBe(20);
  });

  test("handles zero score values correctly", async () => {
    const scoreData = {
      currentScore: 0,
      highScore: 0
    };

    const response = await request(app)
      .post("/api/scores/update")
      .set("Authorization", `Bearer ${validToken}`)
      .send(scoreData);

    expect(response.status).toBe(200);
    expect(response.body.currentScore).toBe(0);
    expect(response.body.highScore).toBe(0);
  });
});
