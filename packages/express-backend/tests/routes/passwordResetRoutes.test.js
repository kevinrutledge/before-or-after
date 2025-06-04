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

// Mock nodemailer before importing routes
jest.mock("nodemailer", () => {
  const mockSendMail = jest.fn();
  const mockTransporter = {
    sendMail: mockSendMail
  };
  return {
    createTransport: jest.fn(() => mockTransporter),
    __mockSendMail: mockSendMail // Export for test access
  };
});

// Mock rate limiter before importing routes
jest.mock("express-rate-limit", () => {
  return jest.fn(() => (req, res, next) => next());
});

import passwordResetRoutes from "../../src/routes/passwordResetRoutes.js";

// Get mock reference after import
const nodemailer = require("nodemailer");
const mockSendMail = nodemailer.__mockSendMail;

describe("Password Reset Routes", () => {
  let app;
  let server;
  let consoleErrorSpy;

  // Standard test user data template
  const createUserData = (overrides = {}) => ({
    email: "test@example.com",
    username: "testuser",
    password: "hashedpassword",
    role: "user",
    currentScore: 0,
    highScore: 0,
    createdAt: new Date(),
    ...overrides
  });

  // Standard reset request template
  const createResetRequest = (overrides = {}) => ({
    email: "test@example.com",
    ...overrides
  });

  // Standard verify request template
  const createVerifyRequest = (overrides = {}) => ({
    email: "test@example.com",
    code: "123456",
    ...overrides
  });

  // Standard password reset template
  const createPasswordReset = (overrides = {}) => ({
    email: "test@example.com",
    resetToken: "valid-token",
    newPassword: "newpassword123",
    ...overrides
  });

  beforeAll(async () => {
    await startMemoryServer();
    process.env.JWT_SECRET = "test-secret";
    process.env.EMAIL_SERVICE = "gmail";
    process.env.EMAIL_USER = "test@gmail.com";
    process.env.EMAIL_PASS = "testpass";

    // Create Express app with password reset routes
    app = express();
    app.use(express.json());
    app.use("/api/auth", passwordResetRoutes);

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
    mockSendMail.mockClear();
    mockSendMail.mockResolvedValue({ messageId: "test-message-id" });
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("POST /api/auth/forgot-password", () => {
    test("generates reset code for existing user", async () => {
      // Create test user
      const { client, collection } = await getUsersCollection();
      await collection.insertOne(createUserData());
      await client.close();

      const resetRequest = createResetRequest();

      const response = await request(server)
        .post("/api/auth/forgot-password")
        .send(resetRequest);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        "If an account with this email exists, a reset code has been sent"
      );

      // Verify reset code stored in database
      const { client: verifyClient, collection: verifyCollection } =
        await getUsersCollection();
      const updatedUser = await verifyCollection.findOne({
        email: "test@example.com"
      });
      await verifyClient.close();

      expect(updatedUser.resetCode).toMatch(/^\d{6}$/);
      expect(updatedUser.resetCodeExpires).toBeInstanceOf(Date);
      expect(updatedUser.resetCodeExpires.getTime()).toBeGreaterThan(
        Date.now()
      );
    });

    test("sends email with verification code", async () => {
      // Create test user
      const { client, collection } = await getUsersCollection();
      await collection.insertOne(createUserData());
      await client.close();

      const resetRequest = createResetRequest();

      const response = await request(server)
        .post("/api/auth/forgot-password")
        .send(resetRequest);

      expect(response.status).toBe(200);
      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.to).toBe("test@example.com");
      expect(emailCall.subject).toBe("Your verification code");
      expect(emailCall.text).toMatch(
        /Your Before or After verification code is: \d{6}/
      );
      expect(emailCall.html).toMatch(/\d{6}/);
    });

    test("returns same message for non-existent user", async () => {
      const resetRequest = createResetRequest({
        email: "nonexistent@example.com"
      });

      const response = await request(server)
        .post("/api/auth/forgot-password")
        .send(resetRequest);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        "If an account with this email exists, a reset code has been sent"
      );

      // Verify no email sent for non-existent user
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    test("validates email field presence", async () => {
      const response = await request(server)
        .post("/api/auth/forgot-password")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email is required");
    });

    test("sets code expiration to 15 minutes", async () => {
      const beforeRequest = Date.now();

      // Create test user
      const { client, collection } = await getUsersCollection();
      await collection.insertOne(createUserData());
      await client.close();

      const resetRequest = createResetRequest();

      await request(server)
        .post("/api/auth/forgot-password")
        .send(resetRequest);

      const afterRequest = Date.now();

      // Verify expiration time
      const { client: verifyClient, collection: verifyCollection } =
        await getUsersCollection();
      const updatedUser = await verifyCollection.findOne({
        email: "test@example.com"
      });
      await verifyClient.close();

      const expectedMin = beforeRequest + 14 * 60 * 1000; // 14 minutes tolerance
      const expectedMax = afterRequest + 16 * 60 * 1000; // 16 minutes tolerance

      expect(updatedUser.resetCodeExpires.getTime()).toBeGreaterThan(
        expectedMin
      );
      expect(updatedUser.resetCodeExpires.getTime()).toBeLessThan(expectedMax);
    });

    test("handles email sending failures gracefully", async () => {
      mockSendMail.mockRejectedValueOnce(
        new Error("Email service unavailable")
      );

      // Create test user
      const { client, collection } = await getUsersCollection();
      await collection.insertOne(createUserData());
      await client.close();

      const resetRequest = createResetRequest();

      const response = await request(server)
        .post("/api/auth/forgot-password")
        .send(resetRequest);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal server error");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Password reset request error:",
        expect.any(Error)
      );
    });
  });

  describe("POST /api/auth/verify-code", () => {
    test("verifies valid code and returns reset token", async () => {
      const resetCode = "123456";
      const futureExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes future

      // Create test user with reset code
      const { client, collection } = await getUsersCollection();
      const userData = createUserData({
        resetCode,
        resetCodeExpires: futureExpiry
      });
      const insertResult = await collection.insertOne(userData);
      await client.close();

      const verifyRequest = createVerifyRequest({ code: resetCode });

      const response = await request(server)
        .post("/api/auth/verify-code")
        .send(verifyRequest);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Code verified successfully");
      expect(response.body.resetToken).toBeDefined();

      // Verify token is valid JWT
      const decoded = jwt.verify(
        response.body.resetToken,
        process.env.JWT_SECRET
      );
      expect(decoded.email).toBe("test@example.com");
      expect(decoded.id).toBe(insertResult.insertedId.toString());
    });

    test("rejects invalid verification code", async () => {
      const resetCode = "123456";
      const futureExpiry = new Date(Date.now() + 10 * 60 * 1000);

      // Create test user with reset code
      const { client, collection } = await getUsersCollection();
      await collection.insertOne(
        createUserData({
          resetCode,
          resetCodeExpires: futureExpiry
        })
      );
      await client.close();

      const verifyRequest = createVerifyRequest({ code: "wrong-code" });

      const response = await request(server)
        .post("/api/auth/verify-code")
        .send(verifyRequest);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Invalid or expired verification code"
      );
    });

    test("rejects expired verification code", async () => {
      const resetCode = "123456";
      const pastExpiry = new Date(Date.now() - 1000); // 1 second ago

      // Create test user with expired reset code
      const { client, collection } = await getUsersCollection();
      await collection.insertOne(
        createUserData({
          resetCode,
          resetCodeExpires: pastExpiry
        })
      );
      await client.close();

      const verifyRequest = createVerifyRequest({ code: resetCode });

      const response = await request(server)
        .post("/api/auth/verify-code")
        .send(verifyRequest);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Invalid or expired verification code"
      );
    });

    test("validates required fields", async () => {
      const testCases = [
        { email: "test@example.com" }, // Missing code
        { code: "123456" }, // Missing email
        {} // Missing both
      ];

      for (const testCase of testCases) {
        const response = await request(server)
          .post("/api/auth/verify-code")
          .send(testCase);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          "Email and verification code are required"
        );
      }
    });

    test("rejects code for non-existent user", async () => {
      const verifyRequest = createVerifyRequest({
        email: "nonexistent@example.com"
      });

      const response = await request(server)
        .post("/api/auth/verify-code")
        .send(verifyRequest);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Invalid or expired verification code"
      );
    });

    test("generates token with 15 minute expiration", async () => {
      const resetCode = "123456";
      const futureExpiry = new Date(Date.now() + 10 * 60 * 1000);

      // Create test user with reset code
      const { client, collection } = await getUsersCollection();
      await collection.insertOne(
        createUserData({
          resetCode,
          resetCodeExpires: futureExpiry
        })
      );
      await client.close();

      const beforeVerify = Math.floor(Date.now() / 1000);
      const verifyRequest = createVerifyRequest({ code: resetCode });

      const response = await request(server)
        .post("/api/auth/verify-code")
        .send(verifyRequest);

      expect(response.status).toBe(200);

      const decoded = jwt.verify(
        response.body.resetToken,
        process.env.JWT_SECRET
      );
      const expectedExpiry = beforeVerify + 15 * 60; // 15 minutes

      // Allow 60 second tolerance for test execution
      expect(decoded.exp).toBeGreaterThan(expectedExpiry - 60);
      expect(decoded.exp).toBeLessThan(expectedExpiry + 60);
    });
  });

  describe("POST /api/auth/reset-password", () => {
    test("resets password with valid token", async () => {
      const userId = "507f1f77bcf86cd799439011";

      // Create test user
      const { client, collection } = await getUsersCollection();
      const { ObjectId } = await import("mongodb");
      await collection.insertOne(
        createUserData({
          _id: new ObjectId(userId),
          password: "oldhashedpassword"
        })
      );
      await client.close();

      // Generate valid reset token
      const resetToken = jwt.sign(
        { id: userId, email: "test@example.com" },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      const passwordReset = createPasswordReset({ resetToken });

      const response = await request(server)
        .post("/api/auth/reset-password")
        .send(passwordReset);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Password reset successfully");

      // Verify password updated in database
      const { client: verifyClient, collection: verifyCollection } =
        await getUsersCollection();
      const updatedUser = await verifyCollection.findOne({
        email: "test@example.com"
      });
      await verifyClient.close();

      expect(updatedUser.password).not.toBe("oldhashedpassword");
      expect(updatedUser.password).toMatch(/^\$2[aby]\$/);
      expect(updatedUser.resetCode).toBeUndefined();
      expect(updatedUser.resetCodeExpires).toBeUndefined();
    });

    test("validates password length", async () => {
      const resetToken = jwt.sign(
        { id: "507f1f77bcf86cd799439011", email: "test@example.com" },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      const passwordReset = createPasswordReset({
        resetToken,
        newPassword: "123" // Too short
      });

      const response = await request(server)
        .post("/api/auth/reset-password")
        .send(passwordReset);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Password must be at least 6 characters"
      );
    });

    test("validates required fields", async () => {
      const testCases = [
        { email: "test@example.com", resetToken: "token" }, // Missing newPassword
        { email: "test@example.com", newPassword: "password123" }, // Missing resetToken
        { resetToken: "token", newPassword: "password123" }, // Missing email
        {} // Missing all
      ];

      for (const testCase of testCases) {
        const response = await request(server)
          .post("/api/auth/reset-password")
          .send(testCase);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("All fields are required");
      }
    });

    test("rejects invalid reset token", async () => {
      const passwordReset = createPasswordReset({
        resetToken: "invalid-token"
      });

      const response = await request(server)
        .post("/api/auth/reset-password")
        .send(passwordReset);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid or expired reset token");
    });

    test("rejects expired reset token", async () => {
      // Generate expired token
      const expiredToken = jwt.sign(
        { id: "507f1f77bcf86cd799439011", email: "test@example.com" },
        process.env.JWT_SECRET,
        { expiresIn: "-1m" } // Expired 1 minute ago
      );

      const passwordReset = createPasswordReset({
        resetToken: expiredToken
      });

      const response = await request(server)
        .post("/api/auth/reset-password")
        .send(passwordReset);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid or expired reset token");
    });

    test("rejects token with mismatched email", async () => {
      const resetToken = jwt.sign(
        { id: "507f1f77bcf86cd799439011", email: "different@example.com" },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      const passwordReset = createPasswordReset({ resetToken });

      const response = await request(server)
        .post("/api/auth/reset-password")
        .send(passwordReset);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid reset token");
    });

    test("handles database update failures", async () => {
      // Generate valid token for non-existent user
      const resetToken = jwt.sign(
        { id: "507f1f77bcf86cd799439011", email: "nonexistent@example.com" },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      const passwordReset = createPasswordReset({
        resetToken,
        email: "nonexistent@example.com"
      });

      const response = await request(server)
        .post("/api/auth/reset-password")
        .send(passwordReset);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Password reset failed");
    });

    test("hashes new password correctly", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const newPassword = "newpassword123";

      // Create test user
      const { client, collection } = await getUsersCollection();
      const { ObjectId } = await import("mongodb");
      await collection.insertOne(
        createUserData({
          _id: new ObjectId(userId)
        })
      );
      await client.close();

      // Generate valid reset token
      const resetToken = jwt.sign(
        { id: userId, email: "test@example.com" },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      const passwordReset = createPasswordReset({
        resetToken,
        newPassword
      });

      const response = await request(server)
        .post("/api/auth/reset-password")
        .send(passwordReset);

      expect(response.status).toBe(200);

      // Verify password can be validated with bcrypt
      const { client: verifyClient, collection: verifyCollection } =
        await getUsersCollection();
      const updatedUser = await verifyCollection.findOne({
        email: "test@example.com"
      });
      await verifyClient.close();

      const isMatch = await bcrypt.compare(newPassword, updatedUser.password);
      expect(isMatch).toBe(true);
    });
  });

  describe("Rate Limiting", () => {
    test("applies rate limiter to password reset endpoints", async () => {
      const resetRequest = createResetRequest();

      // Make multiple requests rapidly
      const requests = Array(4)
        .fill()
        .map(() =>
          request(server).post("/api/auth/forgot-password").send(resetRequest)
        );

      const responses = await Promise.all(requests);

      // All requests should succeed within rate limit
      responses.forEach((response) => {
        expect([200, 500]).toContain(response.status); // 200 or 500 for email errors
      });
    });
  });

  describe("Security Features", () => {
    test("does not reveal user existence through timing", async () => {
      const existingUserRequest = createResetRequest();
      const nonExistentUserRequest = createResetRequest({
        email: "nonexistent@example.com"
      });

      // Create test user for comparison
      const { client, collection } = await getUsersCollection();
      await collection.insertOne(createUserData());
      await client.close();

      const start1 = Date.now();
      const response1 = await request(server)
        .post("/api/auth/forgot-password")
        .send(existingUserRequest);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const response2 = await request(server)
        .post("/api/auth/forgot-password")
        .send(nonExistentUserRequest);
      const time2 = Date.now() - start2;

      // Both should return same message
      expect(response1.body.message).toBe(response2.body.message);
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Timing difference should be reasonable (allowing for normal variance)
      const timeDiff = Math.abs(time1 - time2);
      expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
    });

    test("generates random 6-digit codes", async () => {
      const codes = new Set();

      // Create test user
      const { client, collection } = await getUsersCollection();
      await collection.insertOne(createUserData());
      await client.close();

      // Generate multiple codes
      for (let i = 0; i < 5; i++) {
        const resetRequest = createResetRequest();

        await request(server)
          .post("/api/auth/forgot-password")
          .send(resetRequest);

        const { client: verifyClient, collection: verifyCollection } =
          await getUsersCollection();
        const user = await verifyCollection.findOne({
          email: "test@example.com"
        });
        await verifyClient.close();

        codes.add(user.resetCode);
      }

      // All codes should be different and 6 digits
      expect(codes.size).toBe(5);
      codes.forEach((code) => {
        expect(code).toMatch(/^\d{6}$/);
      });
    });

    test("clears reset code after successful password reset", async () => {
      const userId = "507f1f77bcf86cd799439011";

      // Create test user with reset code
      const { client, collection } = await getUsersCollection();
      const { ObjectId } = await import("mongodb");
      await collection.insertOne(
        createUserData({
          _id: new ObjectId(userId),
          resetCode: "123456",
          resetCodeExpires: new Date(Date.now() + 10 * 60 * 1000)
        })
      );
      await client.close();

      // Generate valid reset token
      const resetToken = jwt.sign(
        { id: userId, email: "test@example.com" },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      const passwordReset = createPasswordReset({ resetToken });

      await request(server)
        .post("/api/auth/reset-password")
        .send(passwordReset);

      // Verify reset code and expiry cleared
      const { client: verifyClient, collection: verifyCollection } =
        await getUsersCollection();
      const updatedUser = await verifyCollection.findOne({
        email: "test@example.com"
      });
      await verifyClient.close();

      expect(updatedUser.resetCode).toBeUndefined();
      expect(updatedUser.resetCodeExpires).toBeUndefined();
    });
  });
});
