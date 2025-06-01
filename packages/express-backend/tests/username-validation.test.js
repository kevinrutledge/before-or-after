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
import bcrypt from "bcryptjs";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { testRateLimit } from "./testUtils.js";

describe("Username Validation", () => {
  let app;
  let mongoServer;
  let mongoUri;
  let client;

  beforeAll(async () => {
    // Suppress console.error output during tests
    jest.spyOn(console, "error").mockImplementation(() => {});

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

    // Define test endpoint that mimics auth/signup.js behavior
    app.post("/api/auth/signup", testRateLimit, async (req, res) => {
      const { email, username, password } = req.body;

      // Validate username format first when present
      if (username !== undefined) {
        if (username.length < 3 || username.length > 20) {
          return res.status(400).json({
            message: "Username must be 3-20 characters"
          });
        }

        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(username)) {
          return res.status(400).json({
            message: "Username contains invalid characters"
          });
        }
      }

      if (!email || !username || !password) {
        return res.status(400).json({
          message: "Email, username, and password required"
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters"
        });
      }

      try {
        const db = client.db();
        const collection = db.collection("users");

        // Create unique indexes
        await collection.createIndex({ email: 1 }, { unique: true });
        await collection.createIndex({ username: 1 }, { unique: true });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user record
        await collection.insertOne({
          email,
          username,
          password: hashedPassword,
          role: "user",
          currentScore: 0,
          highScore: 0,
          createdAt: new Date()
        });

        res.status(201).json({
          success: true,
          message: "User registered successfully"
        });
      } catch (error) {
        // Handle duplicate username or email
        if (error.code === 11000) {
          const field = error.keyPattern.email ? "Email" : "Username";
          return res.status(400).json({ message: `${field} already exists` });
        }
        console.error("User creation error:", error);
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
  });

  test("enforces username uniqueness validation", async () => {
    const firstUser = {
      email: "user1@test.com",
      username: "testuser",
      password: "password123"
    };

    const duplicateUser = {
      email: "user2@test.com",
      username: "testuser", // Same username
      password: "password456"
    };

    // Create first user successfully
    const firstResponse = await request(app)
      .post("/api/auth/signup")
      .send(firstUser);

    expect(firstResponse.status).toBe(201);
    expect(firstResponse.body.success).toBe(true);

    // Attempt to create duplicate username
    const duplicateResponse = await request(app)
      .post("/api/auth/signup")
      .send(duplicateUser);

    expect(duplicateResponse.status).toBe(400);
    expect(duplicateResponse.body.message).toBe("Username already exists");
  });

  test("validates username format requirements", async () => {
    const validUser = {
      email: "test@example.com",
      password: "password123"
    };

    const invalidUsernames = [
      "ab", // Too short
      "a".repeat(21), // Too long
      "test user", // Contains space
      "test@user", // Contains @ symbol
      "test.user", // Contains dot
      "test#user", // Contains hash
      "test$user", // Contains dollar sign
      "user!", // Contains exclamation
      "пользователь", // Contains non-ASCII characters
      "", // Empty string
      "test user!", // Multiple invalid characters
      "test%user&more" // Multiple special characters
    ];

    for (const invalidUsername of invalidUsernames) {
      const userData = { ...validUser, username: invalidUsername };
      const response = await request(app)
        .post("/api/auth/signup")
        .send(userData);

      expect(response.status).toBe(400);

      if (invalidUsername.length < 3 || invalidUsername.length > 20) {
        expect(response.body.message).toBe("Username must be 3-20 characters");
      } else {
        expect(response.body.message).toBe(
          "Username contains invalid characters"
        );
      }
    }
  });

  test("accepts valid username formats", async () => {
    const baseUser = {
      password: "password123"
    };

    const validUsernames = [
      "abc", // Minimum length
      "a".repeat(20), // Maximum length
      "user123", // Alphanumeric
      "test_user", // With underscore
      "test-user", // With dash
      "User123", // Mixed case
      "123user", // Starting with numbers
      "user_123-test", // Mixed valid characters
      "USERNAME", // All uppercase
      "username", // All lowercase
      "User_Name-123" // Complex valid format
    ];

    for (let i = 0; i < validUsernames.length; i++) {
      const username = validUsernames[i];
      const userData = {
        ...baseUser,
        email: `test${i}@example.com`,
        username
      };

      const response = await request(app)
        .post("/api/auth/signup")
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
    }
  });

  test("allows username case variations as separate accounts", async () => {
    const firstUser = {
      email: "user1@test.com",
      username: "TestUser",
      password: "password123"
    };

    const caseVariations = [
      {
        email: "user2@test.com",
        username: "testuser",
        password: "password123"
      },
      {
        email: "user3@test.com",
        username: "TESTUSER",
        password: "password123"
      },
      { email: "user4@test.com", username: "TeStUsEr", password: "password123" }
    ];

    // Create first user
    const firstResponse = await request(app)
      .post("/api/auth/signup")
      .send(firstUser);

    expect(firstResponse.status).toBe(201);

    // Test case variations are allowed
    for (const variation of caseVariations) {
      const response = await request(app)
        .post("/api/auth/signup")
        .send(variation);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
    }
  });

  test("handles database errors during username validation", async () => {
    // Set up Express app with simulated database error
    const errorApp = express();
    errorApp.use(express.json());

    errorApp.post("/api/auth/signup", testRateLimit, async (req, res) => {
      const { email, username, password } = req.body;

      // Validate username format first when present
      if (username !== undefined) {
        if (username.length < 3 || username.length > 20) {
          return res.status(400).json({
            message: "Username must be 3-20 characters"
          });
        }

        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(username)) {
          return res.status(400).json({
            message: "Username contains invalid characters"
          });
        }
      }

      if (!email || !username || !password) {
        return res.status(400).json({
          message: "Email, username, and password required"
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters"
        });
      }

      try {
        // Simulate database error
        throw new Error("Database connection failed");
      } catch (error) {
        console.error("User creation error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    const userData = {
      email: "test@example.com",
      username: "validuser",
      password: "password123"
    };

    const response = await request(errorApp)
      .post("/api/auth/signup")
      .send(userData);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal server error");
  });

  test("validates username before database operations", async () => {
    const invalidUser = {
      email: "test@example.com",
      username: "ab", // Too short
      password: "password123"
    };

    const response = await request(app)
      .post("/api/auth/signup")
      .send(invalidUser);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Username must be 3-20 characters");

    // Verify no database record created
    const db = client.db();
    const collection = db.collection("users");
    const userCount = await collection.countDocuments();

    expect(userCount).toBe(0);
  });

  test("stores username exactly as provided when valid", async () => {
    const userData = {
      email: "test@example.com",
      username: "Test_User-123",
      password: "password123"
    };

    const response = await request(app).post("/api/auth/signup").send(userData);

    expect(response.status).toBe(201);

    // Verify exact username stored
    const db = client.db();
    const collection = db.collection("users");
    const user = await collection.findOne({ email: "test@example.com" });

    expect(user.username).toBe("Test_User-123");
  });

  test("prevents username injection attacks", async () => {
    const maliciousUsernames = [
      "usr<script>", // XSS attempt within length limit
      "usr@hack", // SQL injection attempt within length limit
      "usr'hack", // SQL injection attempt within length limit
      "usr;drop", // SQL injection attempt within length limit
      "usr${bad}", // Template injection within length limit
      "usr`exec`" // Command injection within length limit
    ];

    for (const maliciousUsername of maliciousUsernames) {
      const userData = {
        email: "test@example.com",
        username: maliciousUsername,
        password: "password123"
      };

      const response = await request(app)
        .post("/api/auth/signup")
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Username contains invalid characters"
      );
    }
  });
});
