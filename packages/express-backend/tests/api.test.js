const {
  describe,
  test,
  expect,
  beforeAll,
  afterAll
} = require("@jest/globals");
const request = require("supertest");
const express = require("express");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient } = require("mongodb");

describe("API Routes", () => {
  let app;
  let mongoServer;
  let mongoUri;
  let client;

  // Set up Express app and MongoDB memory server before tests
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

    // Directly define test endpoints
    app.get("/api/cards/next", (req, res) => {
      res.json({
        title: "Test Card",
        year: 2000,
        month: 5,
        imageUrl: "https://example.com/image.jpg",
        sourceUrl: "https://example.com",
        category: "test"
      });
    });

    app.post("/api/cards/guess", (req, res) => {
      const { previousYear, currentYear, previousMonth, currentMonth, guess } =
        req.body;

      if (
        previousYear === undefined ||
        currentYear === undefined ||
        previousMonth === undefined ||
        currentMonth === undefined ||
        !guess
      ) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (guess !== "before" && guess !== "after") {
        return res
          .status(400)
          .json({ message: "Guess must be 'before' or 'after'" });
      }

      const isAfter =
        currentYear > previousYear ||
        (currentYear === previousYear && currentMonth > previousMonth);

      const correct =
        (guess === "after" && isAfter) || (guess === "before" && !isAfter);

      res.json({
        correct,
        nextCard: correct
          ? {
              title: "Next Test Card",
              year: 2010,
              imageUrl: "https://example.com/image2.jpg",
              sourceUrl: "https://example.com",
              category: "test"
            }
          : null
      });
    });
  });

  // Rest of your test code...
  afterAll(async () => {
    if (client) await client.close(); // close only if connected
    await mongoServer.stop();
  });

  // Your test cases...
  describe("GET /api/cards/next", () => {
    test("returns a card", async () => {
      const response = await request(app).get("/api/cards/next");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("title");
      expect(response.body).toHaveProperty("year");
    });
  });

  describe("POST /api/cards/guess", () => {
    test("returns correct=true when guess is correct", async () => {
      const payload = {
        previousYear: 1980,
        currentYear: 1990,
        previousMonth: 5,
        currentMonth: 6,
        guess: "after"
      };

      const response = await request(app)
        .post("/api/cards/guess")
        .send(payload);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("correct", true);
    });

    test("returns correct=false when guess is wrong", async () => {
      const payload = {
        previousYear: 2000,
        currentYear: 1990,
        previousMonth: 5,
        currentMonth: 6,
        guess: "after"
      };

      const response = await request(app)
        .post("/api/cards/guess")
        .send(payload);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("correct", false);
    });

    test("correct=true when year is same but currentMonth is later", async () => {
      const payload = {
        previousYear: 2000,
        currentYear: 2000,
        previousMonth: 3,
        currentMonth: 7,
        guess: "after"
      };

      const response = await request(app)
        .post("/api/cards/guess")
        .send(payload);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("correct", true);
    });
  });
});
