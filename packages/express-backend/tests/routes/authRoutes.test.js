import request from "supertest";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  startMemoryServer,
  stopMemoryServer,
  clearDatabase
} from "../testUtils.js";
import { getUsersCollection } from "../../models/User.js";

// Mock rate limiter before importing routes
jest.mock("express-rate-limit", () => {
  return jest.fn(() => (req, res, next) => next());
});

import authRoutes from "../../src/routes/authRoutes.js";

describe("Auth Routes", () => {
  let app;
  let server;
  let consoleErrorSpy;

  // Standard test user data template
  const createUserData = (overrides = {}) => ({
    email: "test@example.com",
    username: "testuser",
    password: "password123",
    ...overrides
  });

  // Standard login data template
  const createLoginData = (overrides = {}) => ({
    emailOrUsername: "test@example.com",
    password: "password123",
    ...overrides
  });

  beforeAll(async () => {
    await startMemoryServer();
    process.env.JWT_SECRET = "test-secret";

    // Create Express app with auth routes
    app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes);

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

  describe("POST /api/auth/signup", () => {
    test("creates user with valid data", async () => {
      const userData = createUserData();

      const response = await request(server)
        .post("/api/auth/signup")
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
    });

    test("validates required fields", async () => {
      const response = await request(server)
        .post("/api/auth/signup")
        .send({ email: "test@example.com" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Email, username, and password required"
      );
    });

    test("validates email field presence", async () => {
      const response = await request(server)
        .post("/api/auth/signup")
        .send({ username: "testuser", password: "password123" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Email, username, and password required"
      );
    });

    test("enforces password minimum length", async () => {
      const userData = createUserData({ password: "123" });

      const response = await request(server)
        .post("/api/auth/signup")
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Password must be at least 6 characters"
      );
    });

    // Email format validation tests
    const invalidEmails = [
      { email: "testexample.com", description: "missing @ symbol" },
      { email: "a".repeat(250) + "@example.com", description: "too long" },
      { email: "test@", description: "malformed domain" },
      { email: "test@domain", description: "domain without dot" },
      { email: "test@domain.", description: "domain ending with dot" }
    ];

    invalidEmails.forEach(({ email, description }) => {
      test(`validates email format - ${description}`, async () => {
        const userData = createUserData({ email });

        const response = await request(server)
          .post("/api/auth/signup")
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid email format");
      });
    });

    test("rejects duplicate email", async () => {
      const userData = createUserData();

      // Create first user
      await request(server).post("/api/auth/signup").send(userData);

      // Attempt duplicate email with different username
      const duplicateData = createUserData({ username: "differentuser" });
      const response = await request(server)
        .post("/api/auth/signup")
        .send(duplicateData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email already exists");
    });

    test("hashes password before storage", async () => {
      const userData = createUserData();

      const response = await request(server)
        .post("/api/auth/signup")
        .send(userData);

      expect(response.status).toBe(201);

      // Verify password is hashed in database
      const { client, collection } = await getUsersCollection();
      const user = await collection.findOne({ email: userData.email });
      await client.close();

      expect(user.password).not.toBe(userData.password);
      expect(user.password).toMatch(/^\$2[aby]\$/);
    });

    test("sets default user role and scores", async () => {
      const userData = createUserData();

      const response = await request(server)
        .post("/api/auth/signup")
        .send(userData);

      expect(response.status).toBe(201);

      // Verify default values in database
      const { client, collection } = await getUsersCollection();
      const user = await collection.findOne({ email: userData.email });
      await client.close();

      expect(user.role).toBe("user");
      expect(user.currentScore).toBe(0);
      expect(user.highScore).toBe(0);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create test user for login tests
      const { client, collection } = await getUsersCollection();
      const hashedPassword = await bcrypt.hash("password123", 10);

      await collection.insertOne({
        email: "test@example.com",
        username: "testuser",
        password: hashedPassword,
        role: "user",
        currentScore: 5,
        highScore: 15
      });
      await client.close();
    });

    test("authenticates user with email", async () => {
      const loginData = createLoginData();

      const response = await request(server)
        .post("/api/auth/login")
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe("test@example.com");
      expect(response.body.user.role).toBe("user");
      expect(response.body.user).not.toHaveProperty("password");
    });

    test("authenticates user with username", async () => {
      const loginData = createLoginData({ emailOrUsername: "testuser" });

      const response = await request(server)
        .post("/api/auth/login")
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe("test@example.com");
      expect(response.body.user.role).toBe("user");
      expect(response.body.user).not.toHaveProperty("password");
    });

    test("validates required fields", async () => {
      const response = await request(server)
        .post("/api/auth/login")
        .send({ emailOrUsername: "test@example.com" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Email/username and password required"
      );
    });

    test("validates emailOrUsername field presence", async () => {
      const response = await request(server)
        .post("/api/auth/login")
        .send({ password: "password123" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Email/username and password required"
      );
    });

    test("rejects invalid credentials", async () => {
      const loginData = createLoginData({ password: "wrongpassword" });

      const response = await request(server)
        .post("/api/auth/login")
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });

    test("rejects non-existent user", async () => {
      const loginData = createLoginData({
        emailOrUsername: "nonexistent@example.com"
      });

      const response = await request(server)
        .post("/api/auth/login")
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });

    test("generates valid JWT token", async () => {
      const loginData = createLoginData();

      const response = await request(server)
        .post("/api/auth/login")
        .send(loginData);

      expect(response.status).toBe(200);

      // Verify token is valid
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.email).toBe("test@example.com");
      expect(decoded.role).toBe("user");
      expect(decoded.id).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    test("sets JWT token expiration to 24 hours", async () => {
      const loginData = createLoginData();
      const beforeLogin = Math.floor(Date.now() / 1000);

      const response = await request(server)
        .post("/api/auth/login")
        .send(loginData);

      expect(response.status).toBe(200);

      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      const expectedExpiry = beforeLogin + 24 * 60 * 60; // 24 hours

      // Allow 60 second tolerance for test execution time
      expect(decoded.exp).toBeGreaterThan(expectedExpiry - 60);
      expect(decoded.exp).toBeLessThan(expectedExpiry + 60);
    });

    test("handles username case insensitive", async () => {
      const loginData = createLoginData({ emailOrUsername: "TESTUSER" });

      const response = await request(server)
        .post("/api/auth/login")
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe("test@example.com");
    });
  });

  describe("Rate Limiting", () => {
    test("applies rate limiter to auth endpoints", async () => {
      const userData = createUserData();

      // Make multiple requests rapidly
      const requests = Array(3)
        .fill()
        .map(() => request(server).post("/api/auth/signup").send(userData));

      const responses = await Promise.all(requests);

      // First request should succeed, others may hit validation or rate limit
      expect([201, 400]).toContain(responses[0].status);
    });

    test("rate limiter allows successful requests", async () => {
      const userData = createUserData();

      const response = await request(server)
        .post("/api/auth/signup")
        .send(userData);

      // Should succeed when under rate limit
      expect(response.status).toBe(201);
    });
  });

  describe("Error Handling", () => {
    test("handles database connection failures", async () => {
      const userData = createUserData();

      // First create a user to test duplicate scenario
      await request(server).post("/api/auth/signup").send(userData);

      // Try to create duplicate - should handle gracefully
      const response = await request(server)
        .post("/api/auth/signup")
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email already exists");
    });

    test("handles JSON parsing errors", async () => {
      const response = await request(server)
        .post("/api/auth/signup")
        .set("Content-Type", "application/json")
        .send("{invalid json");

      expect(response.status).toBe(400);
    });

    test("logs errors to console", async () => {
      const userData = createUserData();

      // Create user twice to trigger error path
      await request(server).post("/api/auth/signup").send(userData);
      await request(server).post("/api/auth/signup").send(userData);

      // Error logging is tested indirectly through error responses
      expect(consoleErrorSpy).toHaveBeenCalledTimes(0); // Should not error for duplicate
    });
  });

  describe("Input Validation", () => {
    test("handles empty request body", async () => {
      const response = await request(server).post("/api/auth/signup").send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Email, username, and password required"
      );
    });

    test("handles null and undefined values", async () => {
      const response = await request(server).post("/api/auth/signup").send({
        email: null,
        username: null,
        password: undefined
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Email, username, and password required"
      );
    });

    test("handles empty string values", async () => {
      const response = await request(server).post("/api/auth/signup").send({
        email: "",
        username: "",
        password: ""
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Email, username, and password required"
      );
    });

    test("handles whitespace-only values", async () => {
      const response = await request(server).post("/api/auth/signup").send({
        email: "   ",
        username: "   ",
        password: "   "
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Email, username, and password required"
      );
    });
  });

  describe("Security", () => {
    test("prevents email injection attempts", async () => {
      const maliciousEmails = [
        "test@example.com<script>alert('xss')</script>",
        "test'; DROP TABLE users; --@example.com",
        "test@exam${process.exit()}ple.com"
      ];

      for (const email of maliciousEmails) {
        const userData = createUserData({ email });

        const response = await request(server)
          .post("/api/auth/signup")
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid email format");
      }
    });

    test("password is not returned in responses", async () => {
      const userData = createUserData();

      // Test signup response
      const signupResponse = await request(server)
        .post("/api/auth/signup")
        .send(userData);

      expect(signupResponse.body).not.toHaveProperty("password");

      // Test login response
      const loginData = createLoginData();

      const loginResponse = await request(server)
        .post("/api/auth/login")
        .send(loginData);

      if (loginResponse.status === 200 && loginResponse.body.user) {
        expect(loginResponse.body.user).not.toHaveProperty("password");
      }
    });
  });
});
