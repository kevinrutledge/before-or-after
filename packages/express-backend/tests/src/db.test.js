import mongoose from "mongoose";
import { connectToDatabase, testConnection } from "../../src/db.js";
import { startMemoryServer, stopMemoryServer } from "../testUtils.js";

describe("Database Connection", () => {
  let consoleInfoSpy;
  let consoleErrorSpy;
  let originalMongoUri;

  beforeAll(async () => {
    await startMemoryServer();
    originalMongoUri = process.env.MONGO_URI;
  });

  afterAll(async () => {
    await stopMemoryServer();
  });

  beforeEach(() => {
    process.env.MONGO_URI = originalMongoUri;
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(async () => {
    consoleInfoSpy.mockRestore();
    consoleErrorSpy.mockRestore();

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  describe("connectToDatabase", () => {
    test("connects successfully with valid URI", async () => {
      const connection = await connectToDatabase();

      expect(connection.readyState).toBe(1);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "MongoDB connection established"
      );
    });

    test("throws error when MONGO_URI missing", async () => {
      delete process.env.MONGO_URI;

      await expect(connectToDatabase()).rejects.toThrow(
        "Missing MONGO_URI environment variable"
      );
    });

    test("throws error when connection fails", async () => {
      const mockError = new Error("Connection failed");
      const connectSpy = jest
        .spyOn(mongoose, "connect")
        .mockRejectedValue(mockError);

      await expect(connectToDatabase()).rejects.toThrow("Connection failed");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to connect to MongoDB:",
        mockError
      );

      connectSpy.mockRestore();
    });

    test("returns mongoose connection object", async () => {
      const connection = await connectToDatabase();

      expect(connection).toBe(mongoose.connection);
      expect(connection).toHaveProperty("readyState");
      expect(connection).toHaveProperty("db");
    });

    test("calls mongoose connect with MONGO_URI from environment", async () => {
      const mongoConnectSpy = jest.spyOn(mongoose, "connect");
      const expectedUri = process.env.MONGO_URI;

      await connectToDatabase();

      expect(mongoConnectSpy).toHaveBeenCalledWith(expectedUri);

      mongoConnectSpy.mockRestore();
    });
  });

  describe("testConnection", () => {
    test("returns true for successful connection test", async () => {
      const result = await testConnection();

      expect(result).toBe(true);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "MongoDB connection established"
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "MongoDB connection successful:",
        expect.objectContaining({ ok: 1 })
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith("MongoDB connection closed");
    });

    test("returns false for connection failure", async () => {
      const mockError = new Error("Connection timeout");
      const connectSpy = jest
        .spyOn(mongoose, "connect")
        .mockRejectedValue(mockError);

      const result = await testConnection();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "MongoDB connection test failed:",
        mockError
      );

      connectSpy.mockRestore();
    });

    test("handles ping operation correctly", async () => {
      const result = await testConnection();

      expect(result).toBe(true);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "MongoDB connection successful:",
        expect.objectContaining({ ok: 1 })
      );
    });

    test("disconnects after test completion", async () => {
      await testConnection();

      expect(consoleInfoSpy).toHaveBeenCalledWith("MongoDB connection closed");
      expect(mongoose.connection.readyState).toBe(0);
    });

    test("skips disconnect when connection never established", async () => {
      const mockError = new Error("Connection refused");
      const connectSpy = jest
        .spyOn(mongoose, "connect")
        .mockRejectedValue(mockError);

      const result = await testConnection();

      expect(result).toBe(false);
      expect(consoleInfoSpy).not.toHaveBeenCalledWith(
        "MongoDB connection closed"
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "MongoDB connection test failed:",
        mockError
      );

      connectSpy.mockRestore();
    });

    test("returns false when ping fails after successful connection", async () => {
      const originalConnect = mongoose.connect;
      const connectSpy = jest
        .spyOn(mongoose, "connect")
        .mockImplementation(async (...args) => {
          const connection = await originalConnect.apply(mongoose, args);

          // Mock ping to fail after connection established
          const mockPing = jest
            .fn()
            .mockRejectedValue(new Error("Ping failed"));
          const mockAdmin = jest.fn().mockReturnValue({ ping: mockPing });

          if (mongoose.connection && mongoose.connection.db) {
            mongoose.connection.db.admin = mockAdmin;
          }

          return connection;
        });

      const result = await testConnection();

      expect(result).toBe(false);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "MongoDB connection established"
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "MongoDB connection test failed:",
        expect.objectContaining({ message: "Ping failed" })
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith("MongoDB connection closed");

      connectSpy.mockRestore();
    });
  });
});
