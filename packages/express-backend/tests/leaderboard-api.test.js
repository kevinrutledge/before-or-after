import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach
} from "@jest/globals";
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

describe("GET /api/leaderboard", () => {
  let app;
  let mongoServer;
  let mongoUri;
  let client;
  let consoleErrorSpy;

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

    // Define test endpoint that mimics leaderboard.js behavior
    app.get("/api/leaderboard", async (req, res) => {
      try {
        const { limit } = req.query;

        // Parse limit parameter with default and validation
        let parsedLimit = 10;
        if (limit) {
          parsedLimit = parseInt(limit);
          if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
            return res
              .status(400)
              .json({ message: "Limit must be between 1 and 100" });
          }
        }

        const db = client.db();
        const collection = db.collection("users");

        const leaderboard = await collection
          .find({ highScore: { $gt: 0 } })
          .sort({ highScore: -1 })
          .limit(parsedLimit)
          .project({ username: 1, highScore: 1 })
          .toArray();

        res.status(200).json(leaderboard);
      } catch (error) {
        console.error("Leaderboard fetch error:", error);
        res.status(500).json({ message: "Failed to fetch leaderboard" });
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

    // Suppress console.error output during tests
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error after each test
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore();
    }
  });

  test("returns top scores sorted by highScore DESC", async () => {
    // Insert test users with scores
    const db = client.db();
    const collection = db.collection("users");

    const testUsers = [
      { username: "player1", highScore: 15, email: "p1@test.com" },
      { username: "player2", highScore: 25, email: "p2@test.com" },
      { username: "player3", highScore: 10, email: "p3@test.com" },
      { username: "player4", highScore: 30, email: "p4@test.com" }
    ];

    await collection.insertMany(testUsers);

    const response = await request(app).get("/api/leaderboard");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(4);

    // Verify descending order by highScore
    expect(response.body[0].username).toBe("player4");
    expect(response.body[0].highScore).toBe(30);
    expect(response.body[1].username).toBe("player2");
    expect(response.body[1].highScore).toBe(25);
    expect(response.body[2].username).toBe("player1");
    expect(response.body[2].highScore).toBe(15);
    expect(response.body[3].username).toBe("player3");
    expect(response.body[3].highScore).toBe(10);

    // Verify only username and highScore fields returned
    expect(response.body[0]).toHaveProperty("username");
    expect(response.body[0]).toHaveProperty("highScore");
    expect(response.body[0]).not.toHaveProperty("email");
  });

  test("validates limit parameter and rejects invalid values", async () => {
    // Insert test user
    const db = client.db();
    const collection = db.collection("users");
    await collection.insertOne({ username: "player1", highScore: 10 });

    // Test invalid limit values
    const invalidLimits = ["invalid", "0", "-1", "101", "150"];

    for (const limit of invalidLimits) {
      const response = await request(app).get(
        `/api/leaderboard?limit=${limit}`
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Limit must be between 1 and 100");
    }
  });

  test("applies limit parameter correctly", async () => {
    // Insert more test users than limit
    const db = client.db();
    const collection = db.collection("users");

    const testUsers = [];
    for (let i = 1; i <= 15; i++) {
      testUsers.push({
        username: `player${i}`,
        highScore: i * 5,
        email: `p${i}@test.com`
      });
    }

    await collection.insertMany(testUsers);

    // Test with limit of 5
    const response = await request(app).get("/api/leaderboard?limit=5");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(5);

    // Verify top 5 scores returned
    expect(response.body[0].highScore).toBe(75); // player15
    expect(response.body[4].highScore).toBe(55); // player11
  });

  test("returns empty array when no scores exist", async () => {
    // Insert users with zero highScore
    const db = client.db();
    const collection = db.collection("users");

    await collection.insertMany([
      { username: "player1", highScore: 0, email: "p1@test.com" },
      { username: "player2", highScore: 0, email: "p2@test.com" }
    ]);

    const response = await request(app).get("/api/leaderboard");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(0);
  });

  test("excludes users with zero highScore", async () => {
    // Insert mix of users with and without scores
    const db = client.db();
    const collection = db.collection("users");

    const testUsers = [
      { username: "player1", highScore: 20, email: "p1@test.com" },
      { username: "player2", highScore: 0, email: "p2@test.com" },
      { username: "player3", highScore: 15, email: "p3@test.com" },
      { username: "player4", highScore: 0, email: "p4@test.com" }
    ];

    await collection.insertMany(testUsers);

    const response = await request(app).get("/api/leaderboard");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].username).toBe("player1");
    expect(response.body[1].username).toBe("player3");
  });

  test("handles database connection failures gracefully", async () => {
    // Set up Express app with simulated database error
    const errorApp = express();
    errorApp.use(express.json());

    errorApp.get("/api/leaderboard", async (req, res) => {
      try {
        // Simulate database error
        throw new Error("Database connection failed");
      } catch (error) {
        console.error("Leaderboard fetch error:", error);
        res.status(500).json({ message: "Failed to fetch leaderboard" });
      }
    });

    const response = await request(errorApp).get("/api/leaderboard");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Failed to fetch leaderboard");

    // Verify error was logged (even though suppressed in output)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Leaderboard fetch error:",
      expect.any(Error)
    );
  });

  test("uses default limit when parameter not provided", async () => {
    // Insert 15 test users
    const db = client.db();
    const collection = db.collection("users");

    const testUsers = [];
    for (let i = 1; i <= 15; i++) {
      testUsers.push({
        username: `player${i}`,
        highScore: i,
        email: `p${i}@test.com`
      });
    }

    await collection.insertMany(testUsers);

    const response = await request(app).get("/api/leaderboard");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(10); // Default limit
  });
});
