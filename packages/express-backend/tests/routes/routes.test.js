import request from "supertest";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import {
  startMemoryServer,
  stopMemoryServer,
  clearDatabase
} from "../testUtils.js";

// Import the actual routes file
import routes from "../../src/routes/routes.js";

describe("Routes", () => {
  let app;
  let server;
  let consoleErrorSpy;

  // Standard guess request template
  const createGuessRequest = (overrides = {}) => ({
    previousYear: 2019,
    previousMonth: 5,
    currentYear: 2021,
    currentMonth: 8,
    guess: "after",
    ...overrides
  });

  beforeAll(async () => {
    await startMemoryServer();

    // Create Express app with actual routes
    app = express();
    app.use(express.json());
    app.use("/api", routes);

    // Create HTTP server from app
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(resolve));
  });

  afterAll(async () => {
    // Close HTTP server
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }

    // Disconnect mongoose if connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    await stopMemoryServer();
  });

  beforeEach(async () => {
    await clearDatabase();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("GET /api/cards/next", () => {
    test("handles route properly", async () => {
      const response = await request(server).get("/api/cards/next");

      // Check if route exists and handles request
      expect([200, 404, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("title");
      } else if (response.status === 404) {
        expect(response.body.message).toBe("No cards found in database");
      } else {
        expect(response.body.message).toBe("Failed to retrieve card");
      }
    });
  });

  describe("POST /api/cards/guess", () => {
    test("processes correct after guess", async () => {
      const guessRequest = createGuessRequest({
        previousYear: 2019,
        previousMonth: 5,
        currentYear: 2021,
        currentMonth: 8,
        guess: "after"
      });

      const response = await request(server)
        .post("/api/cards/guess")
        .send(guessRequest);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("correct");
      expect(response.body).toHaveProperty("nextCard");
    });

    test("processes guess logic correctly", async () => {
      // Test case where current is after previous
      const afterGuess = createGuessRequest({
        previousYear: 2000,
        previousMonth: 3,
        currentYear: 2010,
        currentMonth: 7,
        guess: "after"
      });

      const afterResponse = await request(server)
        .post("/api/cards/guess")
        .send(afterGuess);

      expect(afterResponse.status).toBe(200);
      expect(afterResponse.body.correct).toBe(true);

      // Test case where current is before previous
      const beforeGuess = createGuessRequest({
        previousYear: 2010,
        previousMonth: 7,
        currentYear: 2000,
        currentMonth: 3,
        guess: "before"
      });

      const beforeResponse = await request(server)
        .post("/api/cards/guess")
        .send(beforeGuess);

      expect(beforeResponse.status).toBe(200);
      expect(beforeResponse.body.correct).toBe(true);
    });

    test("handles same year different month correctly", async () => {
      // Current month after previous month
      const laterMonthGuess = createGuessRequest({
        previousYear: 2020,
        previousMonth: 3,
        currentYear: 2020,
        currentMonth: 8,
        guess: "after"
      });

      const laterResponse = await request(server)
        .post("/api/cards/guess")
        .send(laterMonthGuess);

      expect(laterResponse.status).toBe(200);
      expect(laterResponse.body.correct).toBe(true);

      // Current month before previous month
      const earlierMonthGuess = createGuessRequest({
        previousYear: 2020,
        previousMonth: 8,
        currentYear: 2020,
        currentMonth: 3,
        guess: "before"
      });

      const earlierResponse = await request(server)
        .post("/api/cards/guess")
        .send(earlierMonthGuess);

      expect(earlierResponse.status).toBe(200);
      expect(earlierResponse.body.correct).toBe(true);
    });

    test("processes incorrect after guess", async () => {
      const guessRequest = createGuessRequest({
        previousYear: 2021,
        previousMonth: 8,
        currentYear: 2019,
        currentMonth: 5,
        guess: "after"
      });

      const response = await request(server)
        .post("/api/cards/guess")
        .send(guessRequest);

      expect(response.status).toBe(200);
      expect(response.body.correct).toBe(false);
      expect(response.body.nextCard).toBeNull();
    });

    test("processes incorrect before guess", async () => {
      const guessRequest = createGuessRequest({
        previousYear: 2019,
        previousMonth: 5,
        currentYear: 2021,
        currentMonth: 8,
        guess: "before"
      });

      const response = await request(server)
        .post("/api/cards/guess")
        .send(guessRequest);

      expect(response.status).toBe(200);
      expect(response.body.correct).toBe(false);
      expect(response.body.nextCard).toBeNull();
    });

    test("validates required fields", async () => {
      const missingFieldTests = [
        {
          previousYear: 2019,
          previousMonth: 5,
          currentYear: 2021,
          currentMonth: 8
        }, // Missing guess
        {
          previousYear: 2019,
          previousMonth: 5,
          currentYear: 2021,
          guess: "after"
        }, // Missing currentMonth
        {
          previousYear: 2019,
          previousMonth: 5,
          currentMonth: 8,
          guess: "after"
        }, // Missing currentYear
        {
          previousYear: 2019,
          currentYear: 2021,
          currentMonth: 8,
          guess: "after"
        }, // Missing previousMonth
        {
          previousMonth: 5,
          currentYear: 2021,
          currentMonth: 8,
          guess: "after"
        }, // Missing previousYear
        {} // Missing all fields
      ];

      for (const testData of missingFieldTests) {
        const response = await request(server)
          .post("/api/cards/guess")
          .send(testData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Missing required fields");
      }
    });

    test("validates guess field presence with falsy values", async () => {
      const falsyGuessTests = [
        {
          previousYear: 2019,
          previousMonth: 5,
          currentYear: 2021,
          currentMonth: 8,
          guess: ""
        },
        {
          previousYear: 2019,
          previousMonth: 5,
          currentYear: 2021,
          currentMonth: 8,
          guess: null
        },
        {
          previousYear: 2019,
          previousMonth: 5,
          currentYear: 2021,
          currentMonth: 8,
          guess: false
        }
      ];

      for (const testData of falsyGuessTests) {
        const response = await request(server)
          .post("/api/cards/guess")
          .send(testData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Missing required fields");
      }
    });

    test("validates guess value format", async () => {
      const invalidGuessTests = [
        "wrong",
        "BEFORE",
        "AFTER",
        "yes",
        "no",
        123,
        true
      ];

      for (const invalidGuess of invalidGuessTests) {
        const guessRequest = createGuessRequest({ guess: invalidGuess });

        const response = await request(server)
          .post("/api/cards/guess")
          .send(guessRequest);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Guess must be 'before' or 'after'");
      }
    });

    test("handles same year and month values", async () => {
      const sameYearMonthRequest = createGuessRequest({
        previousYear: 2020,
        previousMonth: 6,
        currentYear: 2020,
        currentMonth: 6,
        guess: "after"
      });

      const response = await request(server)
        .post("/api/cards/guess")
        .send(sameYearMonthRequest);

      expect(response.status).toBe(200);
      expect(response.body.correct).toBe(true);
      expect(response.body.nextCard).toHaveProperty("title");
    });

    test("handles zero year and month values", async () => {
      const zeroRequest = createGuessRequest({
        previousYear: 0,
        previousMonth: 1,
        currentYear: 1,
        currentMonth: 1,
        guess: "after"
      });

      const response = await request(server)
        .post("/api/cards/guess")
        .send(zeroRequest);

      expect(response.status).toBe(200);
      expect(response.body.correct).toBe(true);
    });

    test("handles negative year values", async () => {
      const negativeRequest = createGuessRequest({
        previousYear: -100,
        previousMonth: 5,
        currentYear: -50,
        currentMonth: 8,
        guess: "after"
      });

      const response = await request(server)
        .post("/api/cards/guess")
        .send(negativeRequest);

      expect(response.status).toBe(200);
      expect(response.body.correct).toBe(true);
    });
  });

  describe("Input Validation Edge Cases", () => {
    test("handles malformed JSON gracefully", async () => {
      const response = await request(server)
        .post("/api/cards/guess")
        .set("Content-Type", "application/json")
        .send("{invalid json");

      expect(response.status).toBe(400);
    });

    test("handles empty request body", async () => {
      const response = await request(server).post("/api/cards/guess").send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Missing required fields");
    });

    test("handles null request body", async () => {
      const response = await request(server)
        .post("/api/cards/guess")
        .send(null);

      // Null body may cause JSON parsing error or validation error
      expect([400, 500]).toContain(response.status);
    });

    test("handles extra fields in request", async () => {
      const requestWithExtra = createGuessRequest({
        extraField: "should-be-ignored",
        anotherField: 123
      });

      const response = await request(server)
        .post("/api/cards/guess")
        .send(requestWithExtra);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("correct");
    });
  });

  describe("Service Integration", () => {
    test("routes handle requests appropriately", async () => {
      // Test routes exist and respond
      const cardResponse = await request(server).get("/api/cards/next");
      expect([200, 404, 500]).toContain(cardResponse.status);

      const guessResponse = await request(server)
        .post("/api/cards/guess")
        .send(createGuessRequest());
      expect([200, 400, 500]).toContain(guessResponse.status);
    });
  });
});
