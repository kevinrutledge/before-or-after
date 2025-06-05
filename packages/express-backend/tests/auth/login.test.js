import request from "supertest";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import {
  startMemoryServer,
  stopMemoryServer,
  clearDatabase
} from "../testUtils.js";
import { createUser } from "../../models/User.js";
import loginHandler from "../../api/auth/login.js";

describe("Login API High Score Response", () => {
  let app;
  let server;

  beforeAll(async () => {
    await startMemoryServer();
    process.env.JWT_SECRET = "test-secret";

    // Create Express app with login handler
    app = express();
    app.use(express.json());
    app.post("/api/auth/login", loginHandler);

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
  });

  test("login response includes currentScore and highScore from MongoDB", async () => {
    // Create user with specific scores
    const userResult = await createUser(
      "test@example.com",
      "testuser",
      "password123"
    );
    expect(userResult.success).toBe(true);

    // Update user scores directly in database
    const { getUsersCollection } = await import("../../models/User.js");
    const { client, collection } = await getUsersCollection();

    await collection.updateOne(
      { _id: userResult.userId },
      {
        $set: {
          currentScore: 7,
          highScore: 15
        }
      }
    );
    await client.close();

    // Test login request
    const response = await request(server).post("/api/auth/login").send({
      emailOrUsername: "test@example.com",
      password: "password123"
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user");

    // Verify user object includes score fields
    const { user } = response.body;
    expect(user).toHaveProperty("email", "test@example.com");
    expect(user).toHaveProperty("username", "testuser");
    expect(user).toHaveProperty("role", "user");

    // These are the critical fields for high score sync
    expect(user).toHaveProperty("currentScore", 7);
    expect(user).toHaveProperty("highScore", 15);

    // Should not include password
    expect(user).not.toHaveProperty("password");
  });

  test("login response includes default scores for new user", async () => {
    // Create new user (should have default scores of 0)
    const userResult = await createUser(
      "newuser@example.com",
      "newuser",
      "password123"
    );
    expect(userResult.success).toBe(true);

    const response = await request(server).post("/api/auth/login").send({
      emailOrUsername: "newuser@example.com",
      password: "password123"
    });

    expect(response.status).toBe(200);

    const { user } = response.body;

    // New user should have default scores
    expect(user).toHaveProperty("currentScore", 0);
    expect(user).toHaveProperty("highScore", 0);
  });

  test("login response includes updated scores after gameplay", async () => {
    // Create user
    const userResult = await createUser(
      "player@example.com",
      "player",
      "password123"
    );

    // Simulate gameplay - update scores
    const { updateUserScores } = await import("../../models/User.js");
    const updateResult = await updateUserScores(
      userResult.userId.toString(),
      5, // current score
      12 // high score
    );
    expect(updateResult.success).toBe(true);

    // Login and verify updated scores returned
    const response = await request(server).post("/api/auth/login").send({
      emailOrUsername: "player@example.com",
      password: "password123"
    });

    expect(response.status).toBe(200);

    const { user } = response.body;
    expect(user).toHaveProperty("currentScore", 5);
    expect(user).toHaveProperty("highScore", 12);
  });

  test("login with username returns same user data including scores", async () => {
    // Create user with scores
    const userResult = await createUser(
      "username-test@example.com",
      "testusername",
      "password123"
    );

    const { getUsersCollection } = await import("../../models/User.js");
    const { client, collection } = await getUsersCollection();

    await collection.updateOne(
      { _id: userResult.userId },
      {
        $set: {
          currentScore: 3,
          highScore: 8
        }
      }
    );
    await client.close();

    // Login with username instead of email
    const response = await request(server).post("/api/auth/login").send({
      emailOrUsername: "testusername", // Using username
      password: "password123"
    });

    expect(response.status).toBe(200);

    const { user } = response.body;
    expect(user).toHaveProperty("email", "username-test@example.com");
    expect(user).toHaveProperty("username", "testusername");
    expect(user).toHaveProperty("currentScore", 3);
    expect(user).toHaveProperty("highScore", 8);
  });

  test("login failure does not leak user score information", async () => {
    // Create user
    await createUser("secure@example.com", "secureuser", "correctpassword");

    // Attempt login with wrong password
    const response = await request(server).post("/api/auth/login").send({
      emailOrUsername: "secure@example.com",
      password: "wrongpassword"
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid credentials");

    // Should not include user data or scores
    expect(response.body).not.toHaveProperty("user");
    expect(response.body).not.toHaveProperty("token");
  });

  test("validateUser function returns complete user data", async () => {
    // Test the underlying validateUser function directly
    const userResult = await createUser(
      "direct-test@example.com",
      "directuser",
      "password123"
    );

    // Update scores
    const { getUsersCollection } = await import("../../models/User.js");
    const { client, collection } = await getUsersCollection();

    await collection.updateOne(
      { _id: userResult.userId },
      {
        $set: {
          currentScore: 9,
          highScore: 20
        }
      }
    );
    await client.close();

    // Test validateUser directly
    const { validateUser } = await import("../../models/User.js");
    const validationResult = await validateUser(
      "direct-test@example.com",
      "password123"
    );

    expect(validationResult.success).toBe(true);
    expect(validationResult.user).toHaveProperty("currentScore", 9);
    expect(validationResult.user).toHaveProperty("highScore", 20);
    expect(validationResult.user).not.toHaveProperty("password");
  });
});
